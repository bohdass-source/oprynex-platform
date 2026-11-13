-- Oprynex App: owners and admins may delete requests, so a person's data can be erased on request (DSGVO Art. 17)
-- and test or spam requests can be cleared. History entries and tasks of a deleted request go with it
-- (lead_events and tasks reference leads ON DELETE CASCADE since 0100). Members still cannot delete.

GRANT DELETE ON public.leads TO authenticated;
CREATE POLICY leads_delete ON public.leads FOR DELETE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));
