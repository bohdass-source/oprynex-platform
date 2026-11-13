-- Oprynex App: deal fields on leads and logged calls and emails in the lead history.
-- product is the Oprynex offer the request is about; value_eur is the agreed net deal value in whole euros.
-- Both stay empty until a member sets them; the app estimates from the published starting price meanwhile.

ALTER TABLE public.leads ADD COLUMN product text CHECK (product IN ('chatbot','website','crm','erp','mvp','cloud','consulting','other'));
ALTER TABLE public.leads ADD COLUMN value_eur integer CHECK (value_eur BETWEEN 0 AND 10000000);
GRANT UPDATE (product, value_eur) ON public.leads TO authenticated;
CREATE INDEX leads_workspace_email_idx ON public.leads(workspace_id, lower(email));

-- Members log calls and emails next to notes; all three need a text.
ALTER TABLE public.lead_events DROP CONSTRAINT lead_events_kind_check;
ALTER TABLE public.lead_events ADD CONSTRAINT lead_events_kind_check CHECK (kind IN ('note','call','email','status'));
ALTER TABLE public.lead_events DROP CONSTRAINT lead_events_check;
ALTER TABLE public.lead_events ADD CONSTRAINT lead_events_check
 CHECK ((kind IN ('note','call','email') AND char_length(body) >= 1) OR (kind = 'status' AND to_status IS NOT NULL));

DROP POLICY events_insert_note ON public.lead_events;
CREATE POLICY events_insert_entry ON public.lead_events FOR INSERT TO authenticated
 WITH CHECK (kind IN ('note','call','email') AND author_id = (SELECT auth.uid()) AND (SELECT private.is_workspace_member(workspace_id)) AND private.lead_in_workspace(lead_id, workspace_id));
DROP POLICY events_delete_own_note ON public.lead_events;
CREATE POLICY events_delete_own_entry ON public.lead_events FOR DELETE TO authenticated
 USING (kind IN ('note','call','email') AND author_id = (SELECT auth.uid()) AND (SELECT private.is_workspace_member(workspace_id)));
