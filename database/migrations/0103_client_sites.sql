-- Oprynex App: client websites send their contact form into the client's own workspace.
-- A client site holds only a random intake token (a Worker secret) and the public publishable key; the database keeps
-- just the token's SHA-256. The site never gets the service role key, so a leaked token can at most add leads to one workspace.

CREATE TABLE public.sites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
 url text CHECK (url ~ '^https://[a-z0-9.-]+$'),
 token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
 daily_limit integer NOT NULL DEFAULT 200 CHECK (daily_limit BETWEEN 1 AND 5000)
);
CREATE INDEX sites_workspace_idx ON public.sites(workspace_id);
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
-- Members see their workspace's sites, never the token hash.
GRANT SELECT (id, workspace_id, created_at, name, url, daily_limit) ON public.sites TO authenticated;
CREATE POLICY sites_select ON public.sites FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));

ALTER TABLE public.leads ADD COLUMN site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
CREATE INDEX leads_site_created_idx ON public.leads(site_id, created_at) WHERE site_id IS NOT NULL;

-- Called by the client site's Worker with its token. Validates everything itself, because the caller is the public API.
-- Limits: 5 requests per visitor and site per hour (the IP hash is mixed with the site id), and the site's daily_limit.
CREATE FUNCTION public.accept_site_lead(p_token text, p_ip_hash text, p_lead jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 s public.sites;
 bucket text;
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
  RETURN jsonb_build_object('ok', false);
 END IF;
 SELECT * INTO s FROM public.sites WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
 IF s.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
 IF coalesce(p_lead->>'consent', '') <> 'true' OR coalesce(p_lead->>'email', '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
  RETURN jsonb_build_object('ok', false);
 END IF;
 IF (SELECT count(*) FROM public.leads l WHERE l.site_id = s.id AND l.created_at > ts - interval '1 day') >= s.daily_limit THEN
  RETURN jsonb_build_object('ok', false, 'limited', true);
 END IF;
 bucket := encode(sha256(convert_to(s.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO public.lead_rate_limits(ip_hash) VALUES (bucket) ON CONFLICT DO NOTHING;
 SELECT accepted_at INTO recent FROM public.lead_rate_limits WHERE ip_hash = bucket FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(t), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS t WHERE t > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.leads(workspace_id, site_id, name, email, company, message, source, language, page_path, consent, consent_at)
 VALUES (s.workspace_id, s.id, trim(p_lead->>'name'), lower(trim(p_lead->>'email')), nullif(trim(p_lead->>'company'), ''), trim(p_lead->>'message'),
  'contact_form', p_lead->>'language', nullif(left(p_lead->>'pagePath', 200), ''), true, ts)
 RETURNING id INTO lead_id;
 UPDATE public.lead_rate_limits SET accepted_at = array_append(recent, ts), updated_at = ts WHERE ip_hash = bucket;
 RETURN jsonb_build_object('ok', true, 'id', lead_id);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_site_lead(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_site_lead(text, text, jsonb) TO anon, service_role;
