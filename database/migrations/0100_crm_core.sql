-- Oprynex App: CRM core on the shared Supabase project.
-- The site repo owns migrations 0000-0099 (lead intake, chat quotas); this repo owns 0100+.
-- Every CRM row belongs to a workspace; members see only their workspaces (RLS).

CREATE TABLE public.workspaces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100)
);

CREATE TABLE public.workspace_members (
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX workspace_members_user_idx ON public.workspace_members(user_id);

-- An invited email becomes a member when that person first signs in.
CREATE TABLE public.workspace_invites (
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 email text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 255),
 role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (workspace_id, email)
);

-- The operator's own workspace receives every lead from the website.
INSERT INTO public.workspaces(id, name) VALUES ('00000000-0000-4000-8000-000000000001', 'Oprynex');
INSERT INTO public.workspace_invites(workspace_id, email, role) VALUES ('00000000-0000-4000-8000-000000000001', 'owner@example.com', 'owner');

CREATE FUNCTION public.is_workspace_member(ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.workspace_members m WHERE m.workspace_id = ws AND m.user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

CREATE FUNCTION public.accept_workspace_invites() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.workspace_members(workspace_id, user_id, role)
 SELECT i.workspace_id, NEW.id, i.role FROM public.workspace_invites i WHERE i.email = lower(NEW.email)
 ON CONFLICT DO NOTHING;
 DELETE FROM public.workspace_invites i WHERE i.email = lower(NEW.email);
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_workspace_invites() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_accept_invites AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.accept_workspace_invites();

-- Leads: owned by a workspace, sales pipeline statuses, assignee, last change.
ALTER TABLE public.leads ADD COLUMN workspace_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.leads DROP CONSTRAINT leads_status_check;
UPDATE public.leads SET status = CASE status WHEN 'in_progress' THEN 'contacted' WHEN 'done' THEN 'won' ELSE status END;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new','contacted','proposal','won','lost','spam'));
CREATE INDEX leads_workspace_created_idx ON public.leads(workspace_id, created_at DESC);

-- Timeline per lead: notes written by members, status changes written by the trigger below.
CREATE TABLE public.lead_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
 kind text NOT NULL CHECK (kind IN ('note','status')),
 body text CHECK (char_length(body) <= 4000),
 from_status text,
 to_status text,
 CHECK ((kind = 'note' AND char_length(body) >= 1) OR (kind = 'status' AND to_status IS NOT NULL))
);
CREATE INDEX lead_events_lead_idx ON public.lead_events(lead_id, created_at);

CREATE TABLE public.tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
 title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
 due_date date,
 done_at timestamptz
);
CREATE INDEX tasks_workspace_open_idx ON public.tasks(workspace_id, due_date) WHERE done_at IS NULL;

-- A row that points to a lead must belong to that lead's workspace.
CREATE FUNCTION public.lead_in_workspace(p_lead uuid, p_ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p_lead IS NULL OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = p_lead AND l.workspace_id = p_ws);
$$;
REVOKE ALL ON FUNCTION public.lead_in_workspace(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_in_workspace(uuid, uuid) TO authenticated;

CREATE FUNCTION public.log_lead_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 NEW.updated_at := now();
 IF NEW.status IS DISTINCT FROM OLD.status THEN
  INSERT INTO public.lead_events(workspace_id, lead_id, author_id, kind, from_status, to_status)
  VALUES (NEW.workspace_id, NEW.id, auth.uid(), 'status', OLD.status, NEW.status);
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.log_lead_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER leads_log_change BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_lead_change();

-- Grants and row level security.
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspaces, public.workspace_members, public.workspace_invites, public.lead_events, public.tasks FROM anon, authenticated;
GRANT ALL ON public.workspaces, public.workspace_members, public.workspace_invites, public.lead_events, public.tasks TO service_role;

GRANT SELECT ON public.workspaces TO authenticated;
CREATE POLICY workspaces_select ON public.workspaces FOR SELECT TO authenticated USING ((SELECT public.is_workspace_member(id)));

GRANT SELECT ON public.workspace_members TO authenticated;
CREATE POLICY members_select ON public.workspace_members FOR SELECT TO authenticated USING ((SELECT public.is_workspace_member(workspace_id)));

-- Leads arrive only through the website (service role); members read them and move them through the pipeline.
GRANT SELECT ON public.leads TO authenticated;
GRANT UPDATE (status, assigned_to) ON public.leads TO authenticated;
CREATE POLICY leads_select ON public.leads FOR SELECT TO authenticated USING ((SELECT public.is_workspace_member(workspace_id)));
CREATE POLICY leads_update ON public.leads FOR UPDATE TO authenticated USING ((SELECT public.is_workspace_member(workspace_id))) WITH CHECK ((SELECT public.is_workspace_member(workspace_id)));

GRANT SELECT, DELETE ON public.lead_events TO authenticated;
GRANT INSERT (workspace_id, lead_id, kind, body) ON public.lead_events TO authenticated;
CREATE POLICY events_select ON public.lead_events FOR SELECT TO authenticated USING ((SELECT public.is_workspace_member(workspace_id)));
CREATE POLICY events_insert_note ON public.lead_events FOR INSERT TO authenticated
 WITH CHECK (kind = 'note' AND author_id = (SELECT auth.uid()) AND (SELECT public.is_workspace_member(workspace_id)) AND public.lead_in_workspace(lead_id, workspace_id));
CREATE POLICY events_delete_own_note ON public.lead_events FOR DELETE TO authenticated
 USING (kind = 'note' AND author_id = (SELECT auth.uid()) AND (SELECT public.is_workspace_member(workspace_id)));

GRANT SELECT, DELETE ON public.tasks TO authenticated;
GRANT INSERT (workspace_id, lead_id, title, due_date) ON public.tasks TO authenticated;
GRANT UPDATE (title, due_date, done_at) ON public.tasks TO authenticated;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING ((SELECT public.is_workspace_member(workspace_id)));
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated
 WITH CHECK ((SELECT public.is_workspace_member(workspace_id)) AND public.lead_in_workspace(lead_id, workspace_id));
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated
 USING ((SELECT public.is_workspace_member(workspace_id))) WITH CHECK ((SELECT public.is_workspace_member(workspace_id)));
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING ((SELECT public.is_workspace_member(workspace_id)));

-- Helpers live outside the API-exposed schema, so they cannot be called through /rest/v1/rpc.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
ALTER FUNCTION public.is_workspace_member(uuid) SET SCHEMA private;
ALTER FUNCTION public.lead_in_workspace(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.accept_workspace_invites() SET SCHEMA private;
ALTER FUNCTION public.log_lead_change() SET SCHEMA private;
