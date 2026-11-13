-- Oprynex App: imported contacts, merging duplicate requests and member roles.
-- Website leads keep every intake rule (consent, message of 10+ characters). Only rows with source 'import' skip them:
-- they are the owner's existing contacts entered by a member, not visitors who filled in the site's form.

ALTER TABLE public.leads DROP CONSTRAINT leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN ('contact_form','chat_lead','chat_handoff','import'));
ALTER TABLE public.leads ALTER COLUMN consent SET DEFAULT false;
ALTER TABLE public.leads ALTER COLUMN consent_at DROP NOT NULL;
ALTER TABLE public.leads DROP CONSTRAINT leads_consent_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_consent_check CHECK (source = 'import' OR (consent = true AND consent_at IS NOT NULL));
ALTER TABLE public.leads DROP CONSTRAINT leads_message_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_message_check CHECK (char_length(message) <= 2000 AND (source = 'import' OR char_length(message) >= 10));

-- Roles: owner and admin manage data and the team; members work the pipeline.
CREATE FUNCTION private.workspace_role(ws uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT m.role FROM public.workspace_members m WHERE m.workspace_id = ws AND m.user_id = (SELECT auth.uid());
$$;
CREATE FUNCTION private.is_workspace_admin(ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce(private.workspace_role(ws) IN ('owner','admin'), false);
$$;
REVOKE ALL ON FUNCTION private.workspace_role(uuid), private.is_workspace_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.workspace_role(uuid), private.is_workspace_admin(uuid) TO authenticated;

-- Import: owners and admins add contacts with source 'import'; dates may lie in the past, never in the future.
GRANT INSERT (workspace_id, name, email, company, message, source, language, status, product, value_eur, created_at, updated_at, consent) ON public.leads TO authenticated;
CREATE POLICY leads_insert_import ON public.leads FOR INSERT TO authenticated
 WITH CHECK (source = 'import' AND consent = false AND created_at <= now() AND updated_at <= now() AND (SELECT private.is_workspace_admin(workspace_id)));

-- Merge: the kept request takes over history and tasks, fills its empty deal fields from the other one,
-- records the other request's message as a note, and the other request is deleted. One transaction.
CREATE FUNCTION public.merge_leads(p_keep uuid, p_drop uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 k public.leads;
 d public.leads;
BEGIN
 SELECT * INTO k FROM public.leads WHERE id = p_keep FOR UPDATE;
 SELECT * INTO d FROM public.leads WHERE id = p_drop FOR UPDATE;
 IF p_keep = p_drop OR k.id IS NULL OR d.id IS NULL OR k.workspace_id <> d.workspace_id OR NOT private.is_workspace_admin(k.workspace_id) THEN
  RAISE EXCEPTION 'merge not allowed' USING ERRCODE = '42501';
 END IF;
 UPDATE public.leads SET company = coalesce(k.company, d.company), product = coalesce(k.product, d.product), value_eur = coalesce(k.value_eur, d.value_eur) WHERE id = p_keep;
 UPDATE public.lead_events SET lead_id = p_keep WHERE lead_id = p_drop;
 UPDATE public.tasks SET lead_id = p_keep WHERE lead_id = p_drop;
 INSERT INTO public.lead_events(workspace_id, lead_id, author_id, kind, body)
 VALUES (k.workspace_id, p_keep, auth.uid(), 'note', left(format(E'↳ %s · %s · %s\n%s', to_char(d.created_at, 'YYYY-MM-DD'), d.source, d.name, coalesce(nullif(d.message, ''), '—')), 4000));
 DELETE FROM public.leads WHERE id = p_drop;
END;
$$;
REVOKE ALL ON FUNCTION public.merge_leads(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_leads(uuid, uuid) TO authenticated;

-- Team list with email addresses (auth.users is not readable by members), only for members of that workspace.
CREATE FUNCTION public.workspace_team(ws uuid) RETURNS TABLE (user_id uuid, email text, role text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT m.user_id, u.email::text, m.role, m.created_at
 FROM public.workspace_members m JOIN auth.users u ON u.id = m.user_id
 WHERE m.workspace_id = ws AND private.is_workspace_member(ws)
 ORDER BY m.created_at;
$$;
REVOKE ALL ON FUNCTION public.workspace_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workspace_team(uuid) TO authenticated;

-- Invitations: owners and admins invite; only an owner may invite another owner.
GRANT SELECT, DELETE ON public.workspace_invites TO authenticated;
GRANT INSERT (workspace_id, email, role) ON public.workspace_invites TO authenticated;
CREATE POLICY invites_select ON public.workspace_invites FOR SELECT TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));
CREATE POLICY invites_insert ON public.workspace_invites FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)) AND (role <> 'owner' OR (SELECT private.workspace_role(workspace_id)) = 'owner'));
CREATE POLICY invites_delete ON public.workspace_invites FOR DELETE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));

-- Members: only an owner changes roles; owners remove anyone, admins remove plain members.
GRANT UPDATE (role), DELETE ON public.workspace_members TO authenticated;
CREATE POLICY members_update ON public.workspace_members FOR UPDATE TO authenticated
 USING ((SELECT private.workspace_role(workspace_id)) = 'owner') WITH CHECK ((SELECT private.workspace_role(workspace_id)) = 'owner');
CREATE POLICY members_delete ON public.workspace_members FOR DELETE TO authenticated
 USING ((SELECT private.workspace_role(workspace_id)) = 'owner' OR (role = 'member' AND (SELECT private.is_workspace_admin(workspace_id))));

-- A workspace always keeps at least one owner (deleting the whole workspace is still possible).
CREATE FUNCTION private.keep_an_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF OLD.role = 'owner' AND (TG_OP = 'DELETE' OR NEW.role <> 'owner')
  AND EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = OLD.workspace_id)
  AND NOT EXISTS (SELECT 1 FROM public.workspace_members m WHERE m.workspace_id = OLD.workspace_id AND m.role = 'owner' AND m.user_id <> OLD.user_id) THEN
  RAISE EXCEPTION 'a workspace needs an owner' USING ERRCODE = '23514';
 END IF;
 RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION private.keep_an_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER members_keep_an_owner BEFORE UPDATE OR DELETE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION private.keep_an_owner();
