-- Oprynex App: chatbots for client websites. One engine (Cloudflare Worker "bot", repo oprynex-bot) serves every bot.
-- The engine holds only the publishable key and its own random token (Worker secret BOT_ENGINE_TOKEN); the database keeps
-- just the token's SHA-256 in private.bot_engine_tokens. All engine calls go through the three functions below, which check
-- that token first, so a leaked publishable key alone cannot read bot settings, use the AI quota or add leads.
-- Chat texts are never stored: the database sees only counters and the lead a visitor sends on purpose.

CREATE TABLE public.bots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 enabled boolean NOT NULL DEFAULT false,
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
 business text NOT NULL CHECK (char_length(business) BETWEEN 1 AND 120),
 -- Websites allowed to show the bot; http://localhost only for trying it out.
 origins text[] NOT NULL DEFAULT '{}' CHECK (cardinality(origins) <= 10 AND array_to_string(origins, ' ') ~ '^((https://[a-z0-9.-]+|http://localhost(:[0-9]{2,5})?)( |$))*$'),
 languages text[] NOT NULL DEFAULT '{de}' CHECK (cardinality(languages) >= 1 AND languages <@ ARRAY['de','en','ru']),
 greeting text NOT NULL DEFAULT '' CHECK (char_length(greeting) <= 500),
 knowledge text NOT NULL DEFAULT '' CHECK (char_length(knowledge) <= 20000),
 quick_replies text[] NOT NULL DEFAULT '{}' CHECK (cardinality(quick_replies) <= 6 AND char_length(array_to_string(quick_replies, '')) <= 360),
 color text NOT NULL DEFAULT '#111111' CHECK (color ~ '^#[0-9a-f]{6}$'),
 privacy_url text CHECK (privacy_url ~ '^https://[^\s]+$' AND char_length(privacy_url) <= 300),
 daily_limit integer NOT NULL DEFAULT 300 CHECK (daily_limit BETWEEN 1 AND 5000),
 visitor_daily_limit integer NOT NULL DEFAULT 40 CHECK (visitor_daily_limit BETWEEN 1 AND 200)
);
CREATE INDEX bots_workspace_idx ON public.bots(workspace_id);
REVOKE ALL ON public.bots FROM anon, authenticated;
GRANT ALL ON public.bots TO service_role;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
-- Members see their bots; owners and admins create, change and delete them. A bot never moves to another workspace.
GRANT SELECT, DELETE ON public.bots TO authenticated;
GRANT INSERT (workspace_id, site_id, enabled, name, business, origins, languages, greeting, knowledge, quick_replies, color, privacy_url, daily_limit, visitor_daily_limit) ON public.bots TO authenticated;
GRANT UPDATE (site_id, enabled, name, business, origins, languages, greeting, knowledge, quick_replies, color, privacy_url, daily_limit, visitor_daily_limit, updated_at) ON public.bots TO authenticated;
CREATE POLICY bots_select ON public.bots FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));
CREATE POLICY bots_insert ON public.bots FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)));
CREATE POLICY bots_update ON public.bots FOR UPDATE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id))) WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)));
CREATE POLICY bots_delete ON public.bots FOR DELETE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));

-- Questions per bot and day, for the CRM's usage view and the bot's daily limit.
CREATE TABLE public.bot_usage (
 bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
 day date NOT NULL,
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 questions integer NOT NULL DEFAULT 0,
 PRIMARY KEY (bot_id, day)
);
REVOKE ALL ON public.bot_usage FROM anon, authenticated;
GRANT ALL ON public.bot_usage TO service_role;
ALTER TABLE public.bot_usage ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bot_usage TO authenticated;
CREATE POLICY bot_usage_select ON public.bot_usage FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));

-- Engine internals, out of reach of the REST API.
CREATE TABLE private.bot_engine_tokens (token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.bot_engine_usage (day date PRIMARY KEY, questions integer NOT NULL DEFAULT 0);
-- One row per visitor and bot (SHA-256 of bot id and the visitor's IP hash), never the IP itself.
CREATE TABLE private.bot_visitor_limits (
 bucket text PRIMARY KEY,
 minute_start timestamptz NOT NULL,
 minute_count integer NOT NULL DEFAULT 0,
 day date NOT NULL,
 day_count integer NOT NULL DEFAULT 0,
 leads timestamptz[] NOT NULL DEFAULT '{}'
);
REVOKE ALL ON private.bot_engine_tokens, private.bot_engine_usage, private.bot_visitor_limits FROM PUBLIC, anon, authenticated;

ALTER TABLE public.leads ADD COLUMN bot_id uuid REFERENCES public.bots(id) ON DELETE SET NULL;
CREATE INDEX leads_bot_created_idx ON public.leads(bot_id, created_at) WHERE bot_id IS NOT NULL;
ALTER TABLE public.leads DROP CONSTRAINT leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN ('contact_form','chat_lead','chat_handoff','import','bot_lead'));

CREATE FUNCTION private.bot_engine_ok(p_token text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p_token ~ '^[a-f0-9]{64}$' AND EXISTS (SELECT 1 FROM private.bot_engine_tokens WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex'));
$$;
REVOKE ALL ON FUNCTION private.bot_engine_ok(text) FROM PUBLIC, anon, authenticated;

-- Settings the engine needs to answer for an enabled bot; null for an unknown or switched off bot.
CREATE FUNCTION public.bot_engine_config(p_token text, p_bot uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE b public.bots;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) THEN RETURN NULL; END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled;
 IF b.id IS NULL THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id', b.id, 'name', b.name, 'business', b.business, 'origins', to_jsonb(b.origins), 'languages', to_jsonb(b.languages),
  'greeting', b.greeting, 'knowledge', b.knowledge, 'quickReplies', to_jsonb(b.quick_replies), 'color', b.color, 'privacyUrl', b.privacy_url);
END;
$$;

-- Counts one AI question. Limits: 10 per visitor and minute, the bot's visitor_daily_limit per visitor and day,
-- the bot's daily_limit, and 5000 a day for the whole engine (protects the AI bill whatever the bot settings say).
CREATE FUNCTION public.accept_bot_question(p_token text, p_bot uuid, p_ip_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 b public.bots;
 r private.bot_visitor_limits;
 k text;
 ts timestamptz := clock_timestamp();
 today date := (clock_timestamp() AT TIME ZONE 'utc')::date;
 used integer;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled;
 IF b.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
 k := encode(sha256(convert_to(b.id::text || ':' || p_ip_hash, 'UTF8')), 'hex');
 INSERT INTO private.bot_visitor_limits(bucket, minute_start, day) VALUES (k, ts, today) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM private.bot_visitor_limits WHERE bucket = k FOR UPDATE;
 IF r.minute_start <= ts - interval '1 minute' THEN r.minute_start := ts; r.minute_count := 0; END IF;
 IF r.day <> today THEN r.day := today; r.day_count := 0; END IF;
 IF r.minute_count >= 10 OR r.day_count >= b.visitor_daily_limit THEN RETURN jsonb_build_object('ok', false, 'limited', true); END IF;
 INSERT INTO public.bot_usage(bot_id, day, workspace_id) VALUES (b.id, today, b.workspace_id) ON CONFLICT DO NOTHING;
 SELECT questions INTO used FROM public.bot_usage WHERE bot_id = b.id AND day = today FOR UPDATE;
 IF used >= b.daily_limit THEN RETURN jsonb_build_object('ok', false, 'capacity', true); END IF;
 INSERT INTO private.bot_engine_usage(day) VALUES (today) ON CONFLICT DO NOTHING;
 SELECT questions INTO used FROM private.bot_engine_usage WHERE day = today FOR UPDATE;
 IF used >= 5000 THEN RETURN jsonb_build_object('ok', false, 'capacity', true); END IF;
 UPDATE private.bot_engine_usage SET questions = questions + 1 WHERE day = today;
 UPDATE public.bot_usage SET questions = questions + 1 WHERE bot_id = b.id AND day = today;
 UPDATE private.bot_visitor_limits SET minute_start = r.minute_start, minute_count = r.minute_count + 1, day = r.day, day_count = r.day_count + 1 WHERE bucket = k;
 RETURN jsonb_build_object('ok', true);
END;
$$;

-- Saves a lead the visitor sent from the bot into the bot's workspace. Same rules as client site forms:
-- consent and a valid email, 5 leads per visitor and bot per hour, at most 100 leads per bot and day.
CREATE FUNCTION public.accept_bot_lead(p_token text, p_bot uuid, p_ip_hash text, p_lead jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 b public.bots;
 k text;
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled;
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

-- Only the engine calls these, with the publishable key (anon) plus its token. Signed-in CRM users never need them.
REVOKE ALL ON FUNCTION public.bot_engine_config(text, uuid), public.accept_bot_question(text, uuid, text), public.accept_bot_lead(text, uuid, text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_engine_config(text, uuid), public.accept_bot_question(text, uuid, text), public.accept_bot_lead(text, uuid, text, jsonb) TO anon, service_role;
