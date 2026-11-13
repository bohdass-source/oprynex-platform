-- Oprynex App: push notifications about new requests and tickets, also while the CRM is closed.
-- Each member's devices register a browser push endpoint. A new request (not imported) or ticket makes the database call
-- the CRM Worker (POST /api/push) through pg_net with the endpoints of the workspace's members; the Worker signs an empty
-- push with its VAPID key. No request content leaves the CRM: the notification only says that something new arrived.
-- The call carries a random token that lives only here (private.push_hook); the Worker knows just its SHA-256.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
 endpoint text NOT NULL UNIQUE CHECK (endpoint ~ '^https://[^\s]+$' AND char_length(endpoint) <= 1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions(user_id);
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Every signed-in person manages only the devices of their own account.
GRANT SELECT, DELETE ON public.push_subscriptions TO authenticated;
GRANT INSERT (endpoint) ON public.push_subscriptions TO authenticated;
CREATE POLICY push_own_select ON public.push_subscriptions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY push_own_insert ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY push_own_delete ON public.push_subscriptions FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE TABLE private.push_hook (id boolean PRIMARY KEY DEFAULT true CHECK (id), url text NOT NULL, token text NOT NULL CHECK (token ~ '^[a-f0-9]{64}$'));
INSERT INTO private.push_hook(url, token) VALUES ('https://app.oprynex.workers.dev/api/push', encode(extensions.gen_random_bytes(32), 'hex'));
REVOKE ALL ON private.push_hook FROM PUBLIC, anon, authenticated;

-- Sends one call per new request or ticket to the devices of the workspace's members, except the person who created it.
CREATE FUNCTION private.notify_push() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 hook private.push_hook;
 targets text[];
BEGIN
 IF TG_TABLE_NAME = 'leads' AND (NEW.source = 'import' OR NEW.status = 'spam') THEN RETURN NEW; END IF;
 SELECT array_agg(s.endpoint) INTO targets
 FROM public.push_subscriptions s JOIN public.workspace_members m ON m.user_id = s.user_id
 WHERE m.workspace_id = NEW.workspace_id AND s.user_id IS DISTINCT FROM auth.uid();
 IF targets IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO hook FROM private.push_hook;
 PERFORM net.http_post(
  url := hook.url,
  body := jsonb_build_object('kind', CASE TG_TABLE_NAME WHEN 'leads' THEN 'lead' ELSE 'ticket' END, 'endpoints', to_jsonb(targets[1:200])),
  headers := jsonb_build_object('content-type', 'application/json', 'x-push-token', hook.token),
  timeout_milliseconds := 5000
 );
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN
 RETURN NEW; -- a notification must never stop a request or ticket from being saved
END;
$$;
REVOKE ALL ON FUNCTION private.notify_push() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER leads_notify_push AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION private.notify_push();
CREATE TRIGGER tickets_notify_push AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION private.notify_push();
