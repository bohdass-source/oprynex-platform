-- Oprynex Cloud: the customers of a Cloud customer open support tickets themselves (the site promises support tickets on
-- every plan). A website form now has a purpose: 'request' (0112, creates a request) or 'support', which creates a ticket
-- with the channel 'web' and the customer's own words as the first message of the conversation (kind 'customer').
-- The engine calls accept_form_ticket with its token; the same consent, email, per-visitor and daily limits apply.

ALTER TABLE public.web_forms ADD COLUMN purpose text NOT NULL DEFAULT 'request' CHECK (purpose IN ('request','support'));
GRANT INSERT (purpose) ON public.web_forms TO authenticated;
GRANT UPDATE (purpose) ON public.web_forms TO authenticated;

ALTER TABLE public.tickets ADD COLUMN form_id uuid REFERENCES public.web_forms(id) ON DELETE SET NULL;
CREATE INDEX tickets_form_created_idx ON public.tickets(form_id, created_at) WHERE form_id IS NOT NULL;
ALTER TABLE public.tickets DROP CONSTRAINT tickets_channel_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_channel_check CHECK (channel IN ('manual','request','email','phone','chat','web'));

-- The customer's message. Members still add only notes and replies (ticket_messages_insert), and cannot delete it.
ALTER TABLE public.ticket_messages DROP CONSTRAINT ticket_messages_kind_check;
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_kind_check CHECK (kind IN ('note','reply','status','customer'));
ALTER TABLE public.ticket_messages DROP CONSTRAINT ticket_messages_check;
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_check
 CHECK ((kind IN ('note','reply','customer') AND char_length(body) >= 1) OR (kind = 'status' AND to_status IS NOT NULL));

CREATE OR REPLACE FUNCTION public.web_form_config(p_token text, p_form uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE f public.web_forms; w public.workspaces;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) THEN RETURN NULL; END IF;
 SELECT * INTO f FROM public.web_forms WHERE id = p_form AND enabled;
 IF f.id IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO w FROM public.workspaces WHERE id = f.workspace_id;
 IF w.status = 'paused' THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id', f.id, 'owner', w.name, 'origins', to_jsonb(f.origins), 'language', f.language, 'color', f.color,
  'privacyUrl', f.privacy_url, 'askCompany', f.ask_company, 'purpose', f.purpose);
END;
$$;

-- A request form only creates requests.
CREATE OR REPLACE FUNCTION public.accept_form_lead(p_token text, p_form uuid, p_ip_hash text, p_lead jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 f public.web_forms;
 bucket text;
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO f FROM public.web_forms WHERE id = p_form AND enabled AND purpose = 'request';
 IF f.id IS NULL OR (SELECT status FROM public.workspaces WHERE id = f.workspace_id) = 'paused' THEN RETURN jsonb_build_object('ok', false); END IF;
 IF coalesce(p_lead->>'consent', '') <> 'true' OR coalesce(p_lead->>'email', '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN RETURN jsonb_build_object('ok', false); END IF;
 IF (SELECT count(*) FROM public.leads l WHERE l.form_id = f.id AND l.created_at > ts - interval '1 day') >= f.daily_limit THEN
  RETURN jsonb_build_object('ok', false, 'limited', true);
 END IF;
 bucket := encode(sha256(convert_to('form:' || f.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO public.lead_rate_limits(ip_hash) VALUES (bucket) ON CONFLICT DO NOTHING;
 SELECT accepted_at INTO recent FROM public.lead_rate_limits WHERE ip_hash = bucket FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(t), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS t WHERE t > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.leads(workspace_id, form_id, name, email, company, message, source, chat_topic, language, page_path, consent, consent_at)
 VALUES (f.workspace_id, f.id, trim(p_lead->>'name'), lower(trim(p_lead->>'email')), CASE WHEN f.ask_company THEN nullif(trim(p_lead->>'company'), '') END,
  trim(p_lead->>'message'), 'web_form', left(f.name, 50), p_lead->>'language', nullif(left(p_lead->>'pagePath', 200), ''), true, ts)
 RETURNING id INTO lead_id;
 UPDATE public.lead_rate_limits SET accepted_at = array_append(recent, ts), updated_at = ts WHERE ip_hash = bucket;
 RETURN jsonb_build_object('ok', true, 'id', lead_id);
END;
$$;

-- Opens a ticket from a support form: subject, customer name and email on the ticket, the message as the first entry.
-- Consent is checked here but not stored on the ticket; the form only works with it, as the request forms do.
CREATE FUNCTION public.accept_form_ticket(p_token text, p_form uuid, p_ip_hash text, p_ticket jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 f public.web_forms;
 bucket text;
 recent timestamptz[];
 t public.tickets;
 subject text := left(trim(coalesce(p_ticket->>'subject', '')), 200);
 body text := trim(coalesce(p_ticket->>'message', ''));
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO f FROM public.web_forms WHERE id = p_form AND enabled AND purpose = 'support';
 IF f.id IS NULL OR (SELECT status FROM public.workspaces WHERE id = f.workspace_id) = 'paused' THEN RETURN jsonb_build_object('ok', false); END IF;
 IF coalesce(p_ticket->>'consent', '') <> 'true' OR coalesce(p_ticket->>'email', '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  OR char_length(trim(coalesce(p_ticket->>'name', ''))) NOT BETWEEN 1 AND 100 OR subject = '' OR char_length(body) NOT BETWEEN 10 AND 2000 THEN
  RETURN jsonb_build_object('ok', false);
 END IF;
 IF (SELECT count(*) FROM public.tickets x WHERE x.form_id = f.id AND x.created_at > ts - interval '1 day') >= f.daily_limit THEN
  RETURN jsonb_build_object('ok', false, 'limited', true);
 END IF;
 bucket := encode(sha256(convert_to('form:' || f.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO public.lead_rate_limits(ip_hash) VALUES (bucket) ON CONFLICT DO NOTHING;
 SELECT accepted_at INTO recent FROM public.lead_rate_limits WHERE ip_hash = bucket FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(x), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS x WHERE x > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.tickets(workspace_id, form_id, created_by, subject, customer_name, customer_email, channel)
 VALUES (f.workspace_id, f.id, NULL, subject, trim(p_ticket->>'name'), lower(trim(p_ticket->>'email')), 'web')
 RETURNING * INTO t;
 INSERT INTO public.ticket_messages(workspace_id, ticket_id, author_id, kind, body) VALUES (f.workspace_id, t.id, NULL, 'customer', body);
 UPDATE public.lead_rate_limits SET accepted_at = array_append(recent, ts), updated_at = ts WHERE ip_hash = bucket;
 RETURN jsonb_build_object('ok', true, 'number', t.number);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_form_ticket(text, uuid, text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_form_ticket(text, uuid, text, jsonb) TO anon, service_role;
