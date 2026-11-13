-- Oprynex App: one request may cover several products (for example a website and a chatbot), and the consulting
-- package "Analyse & Plan" is a product of its own (site, 2026-11-07).
-- products is the list a member sets; product stays the first of them, so filters, charts and older code keep working.
-- A trigger keeps both in step whichever one is written. Older values (erp, mvp, cloud) stay allowed in product but
-- become 'other' in the list.

ALTER TABLE public.leads DROP CONSTRAINT leads_product_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_product_check
 CHECK (product IN ('chatbot','website','crm','consulting','consulting_plan','other','erp','mvp','cloud'));

ALTER TABLE public.leads ADD COLUMN products text[] NOT NULL DEFAULT '{}'
 CHECK (products <@ ARRAY['chatbot','website','crm','consulting','consulting_plan','other']::text[] AND cardinality(products) <= 6);

CREATE FUNCTION private.lead_product_list(p text) RETURNS text[]
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT CASE WHEN p IS NULL THEN '{}'::text[]
             WHEN p IN ('chatbot','website','crm','consulting','consulting_plan','other') THEN ARRAY[p]
             ELSE ARRAY['other'] END;
$$;

UPDATE public.leads SET products = private.lead_product_list(product) WHERE product IS NOT NULL;

CREATE FUNCTION private.sync_lead_products() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  IF cardinality(NEW.products) > 0 THEN NEW.product := NEW.products[1];
  ELSE NEW.products := private.lead_product_list(NEW.product); END IF;
 ELSIF NEW.products IS DISTINCT FROM OLD.products THEN
  NEW.product := NEW.products[1];
 ELSIF NEW.product IS DISTINCT FROM OLD.product THEN
  NEW.products := private.lead_product_list(NEW.product);
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.sync_lead_products() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER leads_sync_products BEFORE INSERT OR UPDATE OF product, products ON public.leads
 FOR EACH ROW EXECUTE FUNCTION private.sync_lead_products();

GRANT UPDATE (products) ON public.leads TO authenticated;

-- Merging two requests of one person keeps every product of both.
CREATE OR REPLACE FUNCTION public.merge_leads(p_keep uuid, p_drop uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 k public.leads;
 d public.leads;
BEGIN
 SELECT * INTO k FROM public.leads WHERE id = p_keep FOR UPDATE;
 SELECT * INTO d FROM public.leads WHERE id = p_drop FOR UPDATE;
 IF p_keep = p_drop OR k.id IS NULL OR d.id IS NULL OR k.workspace_id <> d.workspace_id OR NOT private.is_workspace_admin(k.workspace_id) THEN
  RAISE EXCEPTION 'merge not allowed' USING ERRCODE = '42501';
 END IF;
 UPDATE public.leads SET company = coalesce(k.company, d.company),
  products = (SELECT coalesce(array_agg(p ORDER BY first), '{}') FROM (SELECT p, min(o) AS first FROM unnest(k.products || d.products) WITH ORDINALITY AS u(p, o) GROUP BY p) x),
  value_eur = coalesce(k.value_eur, d.value_eur) WHERE id = p_keep;
 UPDATE public.lead_events SET lead_id = p_keep WHERE lead_id = p_drop;
 UPDATE public.tasks SET lead_id = p_keep WHERE lead_id = p_drop;
 INSERT INTO public.lead_events(workspace_id, lead_id, author_id, kind, body)
 VALUES (k.workspace_id, p_keep, auth.uid(), 'note', left(format(E'↳ %s · %s · %s\n%s', to_char(d.created_at, 'YYYY-MM-DD'), d.source, d.name, coalesce(nullif(d.message, ''), '—')), 4000));
 DELETE FROM public.leads WHERE id = p_drop;
END;
$function$;
