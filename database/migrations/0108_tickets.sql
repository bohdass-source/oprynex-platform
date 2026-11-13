-- Oprynex Cloud, stage 2: support tickets (every plan; the site's Start plan lists "Anfragen und Tickets").
-- A ticket belongs to a workspace, may come from a request (lead_id), has a status, priority and an assignee from the
-- workspace's members. Its conversation holds internal notes, logged replies to the customer and status changes.

CREATE TABLE public.tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 number bigint GENERATED ALWAYS AS IDENTITY,
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
 subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
 customer_name text NOT NULL DEFAULT '' CHECK (char_length(customer_name) <= 100),
 customer_email text NOT NULL DEFAULT '' CHECK (customer_email = lower(customer_email) AND char_length(customer_email) <= 255),
 channel text NOT NULL DEFAULT 'manual' CHECK (channel IN ('manual','request','email','phone','chat')),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','solved','closed')),
 priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
 assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX tickets_workspace_updated_idx ON public.tickets(workspace_id, updated_at DESC);
CREATE INDEX tickets_lead_idx ON public.tickets(lead_id) WHERE lead_id IS NOT NULL;

CREATE TABLE public.ticket_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
 kind text NOT NULL CHECK (kind IN ('note','reply','status')),
 body text CHECK (char_length(body) <= 8000),
 from_status text,
 to_status text,
 CHECK ((kind IN ('note','reply') AND char_length(body) >= 1) OR (kind = 'status' AND to_status IS NOT NULL))
);
CREATE INDEX ticket_messages_ticket_idx ON public.ticket_messages(ticket_id, created_at);

-- An assignee must be a member of the ticket's workspace; a linked request must be in the same workspace.
CREATE FUNCTION private.user_in_workspace(p_user uuid, p_ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p_user IS NULL OR EXISTS (SELECT 1 FROM public.workspace_members m WHERE m.workspace_id = p_ws AND m.user_id = p_user);
$$;
CREATE FUNCTION private.ticket_in_workspace(p_ticket uuid, p_ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = p_ticket AND t.workspace_id = p_ws);
$$;
REVOKE ALL ON FUNCTION private.user_in_workspace(uuid, uuid), private.ticket_in_workspace(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.user_in_workspace(uuid, uuid), private.ticket_in_workspace(uuid, uuid) TO authenticated;

-- Status changes are written into the conversation; any change or new message moves the ticket up the list.
CREATE FUNCTION private.log_ticket_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 NEW.updated_at := now();
 IF NEW.status IS DISTINCT FROM OLD.status THEN
  INSERT INTO public.ticket_messages(workspace_id, ticket_id, author_id, kind, from_status, to_status)
  VALUES (NEW.workspace_id, NEW.id, auth.uid(), 'status', OLD.status, NEW.status);
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER tickets_log_change BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION private.log_ticket_change();

CREATE FUNCTION private.touch_ticket() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.kind <> 'status' THEN UPDATE public.tickets SET updated_at = now() WHERE id = NEW.ticket_id; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER ticket_messages_touch AFTER INSERT ON public.ticket_messages FOR EACH ROW EXECUTE FUNCTION private.touch_ticket();
REVOKE ALL ON FUNCTION private.log_ticket_change(), private.touch_ticket() FROM PUBLIC, anon, authenticated;

-- Supabase gives anon and authenticated every right on a new public table; take them back, then grant what members need.
REVOKE ALL ON public.tickets, public.ticket_messages FROM anon, authenticated;
GRANT ALL ON public.tickets, public.ticket_messages TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON public.tickets TO authenticated;
GRANT INSERT (workspace_id, lead_id, subject, customer_name, customer_email, channel, status, priority, assigned_to) ON public.tickets TO authenticated;
GRANT UPDATE (lead_id, subject, customer_name, customer_email, channel, status, priority, assigned_to) ON public.tickets TO authenticated;
CREATE POLICY tickets_select ON public.tickets FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));
CREATE POLICY tickets_insert ON public.tickets FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.is_workspace_member(workspace_id)) AND private.lead_in_workspace(lead_id, workspace_id) AND private.user_in_workspace(assigned_to, workspace_id));
CREATE POLICY tickets_update ON public.tickets FOR UPDATE TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)))
 WITH CHECK ((SELECT private.is_workspace_member(workspace_id)) AND private.lead_in_workspace(lead_id, workspace_id) AND private.user_in_workspace(assigned_to, workspace_id));
-- Deleting a ticket (with its conversation) is for owners and admins, like deleting requests.
CREATE POLICY tickets_delete ON public.tickets FOR DELETE TO authenticated USING ((SELECT private.is_workspace_admin(workspace_id)));

GRANT SELECT, DELETE ON public.ticket_messages TO authenticated;
GRANT INSERT (workspace_id, ticket_id, kind, body) ON public.ticket_messages TO authenticated;
CREATE POLICY ticket_messages_select ON public.ticket_messages FOR SELECT TO authenticated USING ((SELECT private.is_workspace_member(workspace_id)));
CREATE POLICY ticket_messages_insert ON public.ticket_messages FOR INSERT TO authenticated
 WITH CHECK (kind IN ('note','reply') AND author_id = (SELECT auth.uid()) AND (SELECT private.is_workspace_member(workspace_id)) AND private.ticket_in_workspace(ticket_id, workspace_id));
CREATE POLICY ticket_messages_delete_own ON public.ticket_messages FOR DELETE TO authenticated
 USING (kind IN ('note','reply') AND author_id = (SELECT auth.uid()) AND (SELECT private.is_workspace_member(workspace_id)));
