import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bot, BotDraft, BotUsage, CloudPlan, EntryKind, Lead, LeadEvent, Plan, Role, Task, Ticket, TicketMessage, WebForm, WebFormDraft, WorkspaceStatus } from "@/lib/crm";
import { supabase } from "@/lib/supabase";

// All reads and writes go straight to Supabase; row level security limits them to the member's workspace.
const LEAD_COLUMNS = "id, workspace_id, created_at, updated_at, name, email, company, message, source, chat_topic, language, page_path, referrer_host, utm_source, utm_medium, utm_campaign, consent_at, status, assigned_to, product, products, value_eur, bot_id, site_id, form_id";

/** For updates and deletes: row level security hides a forbidden row instead of failing, so no row means not allowed. */
async function mustChange(promise: PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<void> {
  const rows = await must(promise);
  if (!rows.length) throw new Error("not allowed");
}

async function must<T>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}

export const keys = {
  leads: (ws: string) => ["leads", ws] as const,
  lead: (id: string) => ["lead", id] as const,
  events: (id: string) => ["events", id] as const,
  tasks: (ws: string) => ["tasks", ws] as const,
  bots: (ws: string) => ["bots", ws] as const,
  botUsage: (ws: string) => ["bot-usage", ws] as const,
  forms: (ws: string) => ["web-forms", ws] as const,
};

export function useLeads(workspaceId: string) {
  return useQuery({
    queryKey: keys.leads(workspaceId),
    queryFn: () => must<Lead[]>(supabase().from("leads").select(LEAD_COLUMNS).eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1000)),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: keys.lead(id),
    queryFn: () => must<Lead | null>(supabase().from("leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle()),
  });
}

export function useLeadEvents(leadId: string) {
  return useQuery({
    queryKey: keys.events(leadId),
    queryFn: () => must<LeadEvent[]>(supabase().from("lead_events").select("id, lead_id, created_at, author_id, kind, body, from_status, to_status").eq("lead_id", leadId).order("created_at")),
  });
}

export function useTasks(workspaceId: string) {
  return useQuery({
    queryKey: keys.tasks(workspaceId),
    queryFn: () => must<Task[]>(supabase().from("tasks").select("id, workspace_id, lead_id, created_at, title, due_date, done_at").eq("workspace_id", workspaceId).order("created_at").limit(1000)),
  });
}

export type LeadPatch = Partial<Pick<Lead, "status" | "product" | "products" | "value_eur" | "assigned_to">>;

/** Changes status, product or value; the list and the lead show the change at once and roll back if saving fails. */
export function useUpdateLead(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LeadPatch }) => must(supabase().from("leads").update(patch).eq("id", id).select("id")),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.leads(workspaceId) });
      const before = qc.getQueryData<Lead[]>(keys.leads(workspaceId));
      const beforeLead = qc.getQueryData<Lead | null>(keys.lead(id));
      qc.setQueryData<Lead[]>(keys.leads(workspaceId), (leads) => leads?.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
      qc.setQueryData<Lead | null>(keys.lead(id), (lead) => (lead ? { ...lead, ...patch } : lead));
      return { before, beforeLead };
    },
    onError: (_error, { id }, context) => {
      qc.setQueryData(keys.leads(workspaceId), context?.before);
      qc.setQueryData(keys.lead(id), context?.beforeLead);
    },
    onSettled: (_data, _error, { id }) => Promise.all([
      qc.invalidateQueries({ queryKey: keys.lead(id) }),
      qc.invalidateQueries({ queryKey: keys.events(id) }),
      qc.invalidateQueries({ queryKey: keys.leads(workspaceId) }),
    ]),
  });
}

export function useAddEntry(lead: Pick<Lead, "id" | "workspace_id">) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, body }: { kind: EntryKind; body: string }) => must(supabase().from("lead_events").insert({ workspace_id: lead.workspace_id, lead_id: lead.id, kind, body }).select("id")),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.events(lead.id) }),
  });
}

export function useDeleteEntry(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => must(supabase().from("lead_events").delete().eq("id", id).select("id")),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.events(leadId) }),
  });
}

export function useAddTask(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: { title: string; due_date: string | null; lead_id: string | null }) =>
      must(supabase().from("tasks").insert({ workspace_id: workspaceId, ...task }).select("id")),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tasks(workspaceId) }),
  });
}

export function useToggleTask(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Pick<Task, "id" | "done_at">) =>
      must(supabase().from("tasks").update({ done_at: task.done_at ? null : new Date().toISOString() }).eq("id", task.id).select("id")),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tasks(workspaceId) }),
  });
}

export function useDeleteTask(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => must(supabase().from("tasks").delete().eq("id", id).select("id")),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tasks(workspaceId) }),
  });
}

/** Folds one request into another in the database (history, tasks and empty deal fields move over; the other is deleted). */
export function useMergeLeads(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keep, drop }: { keep: string; drop: string }) => must(supabase().rpc("merge_leads", { p_keep: keep, p_drop: drop })),
    onSettled: (_data, _error, { keep, drop }) => {
      qc.removeQueries({ queryKey: keys.lead(drop) });
      return Promise.all([
        qc.invalidateQueries({ queryKey: keys.lead(keep) }),
        qc.invalidateQueries({ queryKey: keys.events(keep) }),
        qc.invalidateQueries({ queryKey: keys.leads(workspaceId) }),
        qc.invalidateQueries({ queryKey: keys.tasks(workspaceId) }),
      ]);
    },
  });
}

/** Deletes requests for good (owners and admins; row level security refuses everyone else). History and tasks go with them. */
export function useDeleteLeads(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (let i = 0; i < ids.length; i += 200) await mustChange(supabase().from("leads").delete().in("id", ids.slice(i, i + 200)).select("id"));
      return ids.length;
    },
    onSettled: (_data, _error, ids) => {
      ids.forEach((id) => { qc.removeQueries({ queryKey: keys.lead(id) }); qc.removeQueries({ queryKey: keys.events(id) }); });
      return Promise.all([qc.invalidateQueries({ queryKey: keys.leads(workspaceId) }), qc.invalidateQueries({ queryKey: keys.tasks(workspaceId) })]);
    },
  });
}

export type NewImportedLead = Pick<Lead, "name" | "email" | "company" | "message" | "product" | "value_eur" | "status" | "language"> & { created_at: string | null };

/** Saves imported contacts in batches; reports progress after each batch and stops at the first failing one. */
export function useImportLeads(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rows, onProgress }: { rows: NewImportedLead[]; onProgress: (done: number) => void }) => {
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += 200) {
        const batch = rows.slice(i, i + 200).map(({ created_at, ...row }) => ({
          ...row, workspace_id: workspaceId, source: "import", consent: false,
          // The contact's own date counts as both arrival and last change, so old deals do not land in this period's figures.
          created_at: created_at ?? now, updated_at: created_at ?? now,
        }));
        await must(supabase().from("leads").insert(batch).select("id"));
        onProgress(Math.min(i + 200, rows.length));
      }
      return rows.length;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.leads(workspaceId) }),
  });
}

export type TeamMember = { user_id: string; email: string; role: Role; created_at: string };
export type Invite = { email: string; role: Role; created_at: string };

export function useTeam(workspaceId: string) {
  return useQuery({
    queryKey: ["team", workspaceId],
    queryFn: () => must<TeamMember[]>(supabase().rpc("workspace_team", { ws: workspaceId })),
  });
}

export function useInvites(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["invites", workspaceId],
    enabled,
    queryFn: () => must<Invite[]>(supabase().from("workspace_invites").select("email, role, created_at").eq("workspace_id", workspaceId).order("created_at")),
  });
}

/** Invitations and membership changes; every one refreshes the team and the invitation list. */
export function useTeamChange(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["team", workspaceId] }), qc.invalidateQueries({ queryKey: ["invites", workspaceId] })]);
  const ws = { workspace_id: workspaceId };
  return {
    invite: useMutation({ mutationFn: (invite: { email: string; role: Role }) => must(supabase().from("workspace_invites").insert({ ...ws, ...invite }).select("email")), onSettled: refresh }),
    cancelInvite: useMutation({ mutationFn: (email: string) => mustChange(supabase().from("workspace_invites").delete().match({ ...ws, email }).select("email")), onSettled: refresh }),
    setRole: useMutation({ mutationFn: ({ userId, role }: { userId: string; role: Role }) => mustChange(supabase().from("workspace_members").update({ role }).match({ ...ws, user_id: userId }).select("role")), onSettled: refresh }),
    remove: useMutation({ mutationFn: (userId: string) => mustChange(supabase().from("workspace_members").delete().match({ ...ws, user_id: userId }).select("role")), onSettled: refresh }),
  };
}

const BOT_COLUMNS = "id, workspace_id, created_at, updated_at, enabled, name, business, origins, languages, greeting, knowledge, quick_replies, color, privacy_url, daily_limit, visitor_daily_limit, kind";

export function useBots(workspaceId: string) {
  return useQuery({
    queryKey: keys.bots(workspaceId),
    queryFn: () => must<Bot[]>(supabase().from("bots").select(BOT_COLUMNS).eq("workspace_id", workspaceId).order("created_at")),
  });
}

/** Question counts of the last 31 days (UTC days, as the engine counts them). */
export function useBotUsage(workspaceId: string) {
  return useQuery({
    queryKey: keys.botUsage(workspaceId),
    queryFn: () => {
      const from = new Date(Date.now() - 31 * 86_400_000).toISOString().slice(0, 10);
      return must<BotUsage[]>(supabase().from("bot_usage").select("bot_id, day, questions").eq("workspace_id", workspaceId).gte("day", from));
    },
  });
}

/** Creates a bot or saves changes; owners and admins only (row level security refuses everyone else). */
export function useBotChange(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: keys.bots(workspaceId) });
  return {
    save: useMutation({
      mutationFn: async ({ id, draft }: { id: string | null; draft: BotDraft }): Promise<string> => {
        if (!id) {
          const rows = await must<{ id: string }[]>(supabase().from("bots").insert({ ...draft, workspace_id: workspaceId }).select("id"));
          return rows[0]?.id ?? "";
        }
        await mustChange(supabase().from("bots").update({ ...draft, updated_at: new Date().toISOString() }).eq("id", id).select("id"));
        return id;
      },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => mustChange(supabase().from("bots").delete().eq("id", id).select("id")), onSettled: refresh }),
  };
}

const FORM_COLUMNS = "id, workspace_id, created_at, updated_at, enabled, name, origins, language, color, privacy_url, ask_company, daily_limit, purpose";

export function useForms(workspaceId: string) {
  return useQuery({
    queryKey: keys.forms(workspaceId),
    queryFn: () => must<WebForm[]>(supabase().from("web_forms").select(FORM_COLUMNS).eq("workspace_id", workspaceId).order("created_at")),
  });
}

/** Creates a website form or saves changes; owners and admins only (row level security refuses everyone else). */
export function useFormChange(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: keys.forms(workspaceId) });
  return {
    save: useMutation({
      mutationFn: async ({ id, draft }: { id: string | null; draft: WebFormDraft }): Promise<string> => {
        if (!id) {
          const rows = await must<{ id: string }[]>(supabase().from("web_forms").insert({ ...draft, workspace_id: workspaceId }).select("id"));
          return rows[0]?.id ?? "";
        }
        await mustChange(supabase().from("web_forms").update({ ...draft, updated_at: new Date().toISOString() }).eq("id", id).select("id"));
        return id;
      },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => mustChange(supabase().from("web_forms").delete().eq("id", id).select("id")), onSettled: refresh }),
  };
}

/** After how many months lost and spam requests and closed tickets are deleted; null keeps them (0115_data_protection.sql). */
export function useRetention(workspaceId: string) {
  return useQuery({
    queryKey: ["retention", workspaceId],
    queryFn: async () => (await must<{ retention_months: number | null }>(supabase().from("workspaces").select("retention_months").eq("id", workspaceId).single())).retention_months,
  });
}

/** Retention (owners and admins) and deleting the whole company (owner only, the exact name confirms it). */
export function useDataChange(workspaceId: string) {
  const qc = useQueryClient();
  return {
    setRetention: useMutation({
      mutationFn: (months: number | null) => must(supabase().rpc("set_retention", { p_ws: workspaceId, p_months: months })),
      onSettled: () => qc.invalidateQueries({ queryKey: ["retention", workspaceId] }),
    }),
    deleteCompany: useMutation({
      mutationFn: (confirmName: string) => must(supabase().rpc("delete_workspace", { p_ws: workspaceId, p_confirm: confirmName })),
    }),
  };
}

// Oprynex Cloud admin (platform admins only; the database functions refuse everyone else).
export type PlatformWorkspace = { id: string; name: string; created_at: string; plan: Plan; status: WorkspaceStatus; trial_ends_at: string | null; owner_email: string | null; members: number; invites: number; leads: number };

/** Null for everyone who is not an Oprynex admin, so the admin page and menu item stay hidden. */
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => must<{ signupOpen: boolean } | null>(supabase().rpc("platform_settings")),
    staleTime: 5 * 60_000,
  });
}

export function usePlatformWorkspaces(enabled: boolean) {
  return useQuery({ queryKey: ["platform-workspaces"], enabled, queryFn: () => must<PlatformWorkspace[]>(supabase().rpc("platform_workspaces")) });
}

export function usePlatformChange() {
  const qc = useQueryClient();
  return {
    update: useMutation({
      mutationFn: (w: Pick<PlatformWorkspace, "id" | "plan" | "status" | "trial_ends_at">) =>
        must(supabase().rpc("platform_update_workspace", { p_id: w.id, p_plan: w.plan, p_status: w.status, p_trial_ends_at: w.trial_ends_at })),
      onSettled: () => qc.invalidateQueries({ queryKey: ["platform-workspaces"] }),
    }),
    setSignup: useMutation({
      mutationFn: (open: boolean) => must(supabase().rpc("platform_set_signup", { p_open: open })),
      onSettled: () => qc.invalidateQueries({ queryKey: ["platform-settings"] }),
    }),
    /** A client's company with the client invited as owner (0117_platform_create_workspace.sql). */
    create: useMutation({
      mutationFn: (c: { name: string; plan: CloudPlan; email: string; trialDays: number }) =>
        must(supabase().rpc("platform_create_workspace", { p_name: c.name, p_plan: c.plan, p_owner_email: c.email, p_trial_days: c.trialDays })),
      onSettled: () => qc.invalidateQueries({ queryKey: ["platform-workspaces"] }),
    }),
  };
}

/** Self sign-up: the database creates the company on a 14 day trial and makes the caller its owner. */
export function useCreateWorkspace() {
  return useMutation({ mutationFn: ({ name, plan }: { name: string; plan: CloudPlan }) => must<string>(supabase().rpc("create_workspace", { p_name: name, p_plan: plan })) });
}

// Support tickets
const TICKET_COLUMNS = "id, number, workspace_id, lead_id, created_at, updated_at, subject, customer_name, customer_email, channel, status, priority, assigned_to, form_id";
export const ticketKeys = {
  list: (ws: string) => ["tickets", ws] as const,
  one: (id: string) => ["ticket", id] as const,
  messages: (id: string) => ["ticket-messages", id] as const,
};

export function useTickets(workspaceId: string) {
  return useQuery({
    queryKey: ticketKeys.list(workspaceId),
    queryFn: () => must<Ticket[]>(supabase().from("tickets").select(TICKET_COLUMNS).eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(1000)),
  });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: ticketKeys.one(id), queryFn: () => must<Ticket | null>(supabase().from("tickets").select(TICKET_COLUMNS).eq("id", id).maybeSingle()) });
}

export function useTicketMessages(id: string) {
  return useQuery({
    queryKey: ticketKeys.messages(id),
    queryFn: () => must<TicketMessage[]>(supabase().from("ticket_messages").select("id, ticket_id, created_at, author_id, kind, body, from_status, to_status").eq("ticket_id", id).order("created_at")),
  });
}

export type NewTicket = Pick<Ticket, "subject" | "customer_name" | "customer_email" | "channel" | "priority"> & { lead_id?: string | null; assigned_to?: string | null };
export type TicketPatch = Partial<Pick<Ticket, "status" | "priority" | "assigned_to" | "subject">>;

export function useTicketChange(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = (id?: string) => Promise.all([
    qc.invalidateQueries({ queryKey: ticketKeys.list(workspaceId) }),
    ...(id ? [qc.invalidateQueries({ queryKey: ticketKeys.one(id) }), qc.invalidateQueries({ queryKey: ticketKeys.messages(id) })] : []),
  ]);
  return {
    create: useMutation({
      mutationFn: async (ticket: NewTicket) => (await must<{ id: string }[]>(supabase().from("tickets").insert({ ...ticket, workspace_id: workspaceId }).select("id")))[0]?.id ?? "",
      onSettled: () => refresh(),
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: TicketPatch }) => mustChange(supabase().from("tickets").update(patch).eq("id", id).select("id")),
      onSettled: (_d, _e, { id }) => refresh(id),
    }),
    remove: useMutation({
      mutationFn: (id: string) => mustChange(supabase().from("tickets").delete().eq("id", id).select("id")),
      onSettled: (_d, _e, id) => { qc.removeQueries({ queryKey: ticketKeys.one(id) }); return refresh(); },
    }),
    addMessage: useMutation({
      mutationFn: ({ ticketId, kind, body }: { ticketId: string; kind: "note" | "reply"; body: string }) =>
        must(supabase().from("ticket_messages").insert({ workspace_id: workspaceId, ticket_id: ticketId, kind, body }).select("id")),
      onSettled: (_d, _e, { ticketId }) => refresh(ticketId),
    }),
    removeMessage: useMutation({
      mutationFn: ({ id }: { id: string; ticketId: string }) => mustChange(supabase().from("ticket_messages").delete().eq("id", id).select("id")),
      onSettled: (_d, _e, { ticketId }) => refresh(ticketId),
    }),
  };
}

// Website forms connected to this workspace (public.sites, set up by Oprynex; members never see the intake token).
export type Site = { id: string; workspace_id: string; created_at: string; name: string; url: string | null; daily_limit: number };
export function useSites(workspaceId: string) {
  return useQuery({
    queryKey: ["sites", workspaceId],
    queryFn: () => must<Site[]>(supabase().from("sites").select("id, workspace_id, created_at, name, url, daily_limit").eq("workspace_id", workspaceId).order("created_at")),
  });
}
