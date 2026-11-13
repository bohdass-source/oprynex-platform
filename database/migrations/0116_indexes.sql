-- Indexes the review found missing (Supabase performance advisor): the export and company deletion read and delete by
-- workspace_id, deleting a request removes its tasks by lead_id, and release_assignments (0109) clears assigned_to when
-- someone leaves a company. Author and creator columns stay without index: they are only shown, never searched.
CREATE INDEX IF NOT EXISTS lead_events_workspace_idx ON public.lead_events(workspace_id);
CREATE INDEX IF NOT EXISTS ticket_messages_workspace_idx ON public.ticket_messages(workspace_id);
CREATE INDEX IF NOT EXISTS tasks_lead_idx ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS leads_assigned_idx ON public.leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS tickets_assigned_idx ON public.tickets(assigned_to) WHERE assigned_to IS NOT NULL;
