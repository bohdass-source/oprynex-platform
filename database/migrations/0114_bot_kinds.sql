-- Oprynex Cloud: the six assistant types the site's /assistants page describes. A bot now has a kind; the engine adds
-- rules for that kind to its fixed prompt and adapts the request form. A support assistant hands the visitor's question
-- to the team as a ticket (channel 'chat', the visitor's words as the first entry) instead of a request; the other kinds
-- keep creating requests. Shop and cart assistants answer only from the catalogue text in the knowledge and never
-- change a cart: real cart changes and confirmed bookings need an integration built as a project.

ALTER TABLE public.bots ADD COLUMN kind text NOT NULL DEFAULT 'website' CHECK (kind IN ('website','lead','appointment','support','shop','cart'));
GRANT INSERT (kind) ON public.bots TO authenticated;
GRANT UPDATE (kind) ON public.bots TO authenticated;

ALTER TABLE public.tickets ADD COLUMN bot_id uuid REFERENCES public.bots(id) ON DELETE SET NULL;
CREATE INDEX tickets_bot_created_idx ON public.tickets(bot_id, created_at) WHERE bot_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.bot_engine_config(p_token text, p_bot uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE b public.bots;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) THEN RETURN NULL; END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled;
 IF b.id IS NULL OR NOT private.workspace_has_integrations(b.workspace_id) THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id', b.id, 'name', b.name, 'business', b.business, 'origins', to_jsonb(b.origins), 'languages', to_jsonb(b.languages),
  'greeting', b.greeting, 'knowledge', b.knowledge, 'quickReplies', to_jsonb(b.quick_replies), 'color', b.color, 'privacyUrl', b.privacy_url,
  'kind', b.kind);
END;
$$;

-- Requests from every kind except support, which opens tickets (below).
CREATE OR REPLACE FUNCTION public.accept_bot_lead(p_token text, p_bot uuid, p_ip_hash text, p_lead jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 b public.bots;
 k text;
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled AND kind <> 'support';
 IF b.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
 IF coalesce(p_lead->>'consent', '') <> 'true' OR coalesce(p_lead->>'email', '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN RETURN jsonb_build_object('ok', false); END IF;
 IF (SELECT count(*) FROM public.leads l WHERE l.bot_id = b.id AND l.created_at > ts - interval '1 day') >= 100 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 k := encode(sha256(convert_to(b.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO private.bot_visitor_limits(bucket, minute_start, day) VALUES (k, ts, (ts AT TIME ZONE 'utc')::date) ON CONFLICT DO NOTHING;
 SELECT leads INTO recent FROM private.bot_visitor_limits WHERE bucket = k FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(t), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS t WHERE t > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.leads(workspace_id, site_id, bot_id, name, email, company, message, source, chat_topic, language, page_path, consent, consent_at)
 VALUES (b.workspace_id, b.site_id, b.id, trim(p_lead->>'name'), lower(trim(p_lead->>'email')), nullif(trim(p_lead->>'company'), ''), trim(p_lead->>'message'),
  'bot_lead', left(b.name, 50), p_lead->>'language', nullif(left(p_lead->>'pagePath', 200), ''), true, ts)
 RETURNING id INTO lead_id;
 UPDATE private.bot_visitor_limits SET leads = array_append(recent, ts) WHERE bucket = k;
 RETURN jsonb_build_object('ok', true, 'id', lead_id);
END;
$$;

-- A support assistant's handover: a ticket in the bot's workspace. Same limits as bot requests (5 per visitor and hour,
-- shared with requests, and 100 a day per bot); the bot's workspace must still have integrations.
CREATE FUNCTION public.accept_bot_ticket(p_token text, p_bot uuid, p_ip_hash text, p_ticket jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 b public.bots;
 k text;
 recent timestamptz[];
 t public.tickets;
 subject text := left(trim(coalesce(p_ticket->>'subject', '')), 200);
 body text := trim(coalesce(p_ticket->>'message', ''));
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled AND kind = 'support';
 IF b.id IS NULL OR NOT private.workspace_has_integrations(b.workspace_id) THEN RETURN jsonb_build_object('ok', false); END IF;
 IF coalesce(p_ticket->>'consent', '') <> 'true' OR coalesce(p_ticket->>'email', '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  OR char_length(trim(coalesce(p_ticket->>'name', ''))) NOT BETWEEN 1 AND 100 OR subject = '' OR char_length(body) NOT BETWEEN 10 AND 2000 THEN
  RETURN jsonb_build_object('ok', false);
 END IF;
 IF (SELECT count(*) FROM public.tickets x WHERE x.bot_id = b.id AND x.created_at > ts - interval '1 day') >= 100 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 k := encode(sha256(convert_to(b.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO private.bot_visitor_limits(bucket, minute_start, day) VALUES (k, ts, (ts AT TIME ZONE 'utc')::date) ON CONFLICT DO NOTHING;
 SELECT leads INTO recent FROM private.bot_visitor_limits WHERE bucket = k FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(x), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS x WHERE x > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.tickets(workspace_id, bot_id, created_by, subject, customer_name, customer_email, channel)
 VALUES (b.workspace_id, b.id, NULL, subject, trim(p_ticket->>'name'), lower(trim(p_ticket->>'email')), 'chat')
 RETURNING * INTO t;
 INSERT INTO public.ticket_messages(workspace_id, ticket_id, author_id, kind, body) VALUES (b.workspace_id, t.id, NULL, 'customer', body);
 UPDATE private.bot_visitor_limits SET leads = array_append(recent, ts) WHERE bucket = k;
 RETURN jsonb_build_object('ok', true, 'number', t.number);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_bot_ticket(text, uuid, text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_bot_ticket(text, uuid, text, jsonb) TO anon, service_role;
