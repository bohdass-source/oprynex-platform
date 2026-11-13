-- Oprynex Cloud, stage 3: whoever a request or ticket is assigned to must belong to its workspace,
-- and someone who leaves a workspace stops being the assignee of its requests and tickets.

ALTER POLICY leads_update ON public.leads
 WITH CHECK ((SELECT private.is_workspace_member(workspace_id)) AND private.user_in_workspace(assigned_to, workspace_id));

CREATE FUNCTION private.release_assignments() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 UPDATE public.leads SET assigned_to = NULL WHERE workspace_id = OLD.workspace_id AND assigned_to = OLD.user_id;
 UPDATE public.tickets SET assigned_to = NULL WHERE workspace_id = OLD.workspace_id AND assigned_to = OLD.user_id;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.release_assignments() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER members_release_assignments AFTER DELETE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION private.release_assignments();
