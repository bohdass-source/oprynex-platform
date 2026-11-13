-- Oprynex Cloud: a contact form every Cloud customer can put on their own website, on every plan (the site's /cloud page
-- promises that the platform collects website requests). The customer creates the form in the CRM and pastes one script
-- tag; the client bot engine (Worker "bot") serves the form and passes each request to accept_form_lead with its token,
-- exactly like a chatbot request. Requests land in the customer's workspace with source 'web_form'.
-- Forms set up by Oprynex for its own website projects stay in public.sites and are not changed.

CREATE TABLE public.web_forms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 enabled boolean NOT NULL DEFAULT true,
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
 -- Websites allowed to show the form; http://localhost only for trying it out.
 origins text[] NOT NULL DEFAULT '{}' CHECK (cardinality(origins) <= 10 AND array_to_string(origins, ' ') ~ '^((https://[a-z0-9.-]+|http://localhost(:[0-9]{2,5})?)( |$))*$'),
 language text NOT NULL DEFAULT 'de' CHECK (language IN ('de','en','ru')),
 color text NOT NULL DEFAULT '#111111' CHECK (color ~ '^#[0-9a-f]{6}$'),
 privacy_url text CHECK (privacy_url ~ '^https://[^\s]+$' AND char_length(privacy_url) <= 300),
 ask_company boolean NOT NULL DEFAULT false,
 daily_limit integer NOT NULL DEFAULT 200 CHECK (daily_limit BETWEEN 1 AND 2000)
);
CREATE INDEX web_forms_workspace_idx ON public.web_forms(workspace_id);
REVOKE ALL ON public.web_forms FROM anon, authenticated;
GRANT ALL ON public.web_forms TO service_role;
ALTER TABLE public.web_forms ENABLE ROW LEVEL SECURITY;
-- Members see their forms; owners and admins create, change and delete them. A form never moves to another workspace.
GRANT SELECT, DELETE ON public.web_forms TO authenticated;
GRANT INSERT (workspace_id, enabled, name, origins, language, color, privacy_url, ask_company, daily_limit) ON public.web_forms TO authenticated;
GRANT UPDATE (enabled, name, origins, language, color, privacy_url, ask_company, daily_limit, updated_at) ON public.web_forms TO authenticated;
CREATE POLICY web_forms_select ON public.web_forms FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));
CREATE POLICY web_forms_insert ON public.web_forms FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)));
CREATE POLICY web_forms_update ON public.web_forms FOR UPDATE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id))) WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)));
CREATE POLICY web_forms_delete ON public.web_forms FOR DELETE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));

-- At most 10 forms per workspace, so one account cannot flood the engine with forms.
CREATE FUNCTION private.web_forms_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('web_forms:' || NEW.workspace_id::text));
 IF (SELECT count(*) FROM public.web_forms WHERE workspace_id = NEW.workspace_id) >= 10 THEN
  RAISE EXCEPTION 'web_form_limit' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.web_forms_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER web_forms_limit BEFORE INSERT ON public.web_forms FOR EACH ROW EXECUTE FUNCTION private.web_forms_limit();

ALTER TABLE public.leads ADD COLUMN form_id uuid REFERENCES public.web_forms(id) ON DELETE SET NULL;
CREATE INDEX leads_form_created_idx ON public.leads(form_id, created_at) WHERE form_id IS NOT NULL;
ALTER TABLE public.leads DROP CONSTRAINT leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN ('contact_form','chat_lead','chat_handoff','import','bot_lead','web_form'));

-- What the engine needs to show an enabled form; null for an unknown or switched off form or a paused workspace.
-- "owner" is the workspace name: the visitor consents to that company handling the request.
CREATE FUNCTION public.web_form_config(p_token text, p_form uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE f public.web_forms; w public.workspaces;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) THEN RETURN NULL; END IF;
 SELECT * INTO f FROM public.web_forms WHERE id = p_form AND enabled;
 IF f.id IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO w FROM public.workspaces WHERE id = f.workspace_id;
 IF w.status = 'paused' THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id', f.id, 'owner', w.name, 'origins', to_jsonb(f.origins), 'language', f.language, 'color', f.color,
  'privacyUrl', f.privacy_url, 'askCompany', f.ask_company);
END;
$$;

-- Saves a request sent through a form into the form's workspace. Same rules as the other public intakes:
-- consent and a valid email, 5 requests per visitor and form per hour, and the form's daily_limit.
CREATE FUNCTION public.accept_form_lead(p_token text, p_form uuid, p_ip_hash text, p_lead jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 f public.web_forms;
 bucket text;
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN jsonb_build_object('ok', false); END IF;
 SELECT * INTO f FROM public.web_forms WHERE id = p_form AND enabled;
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

-- Only the engine calls these, with the publishable key (anon) plus its token. Signed-in CRM users never need them.
REVOKE ALL ON FUNCTION public.web_form_config(text, uuid), public.accept_form_lead(text, uuid, text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.web_form_config(text, uuid), public.accept_form_lead(text, uuid, text, jsonb) TO anon, service_role;
