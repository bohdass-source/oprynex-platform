// CRM domain: pipeline statuses, row types and the pure helpers the screens use.
import type { Product } from "@/lib/products";

export const STATUSES = ["new", "contacted", "proposal", "won", "lost", "spam"] as const;
export type Status = (typeof STATUSES)[number];
/** Statuses that still need work; the inbox opens on these. */
export const OPEN_STATUSES: readonly Status[] = ["new", "contacted", "proposal"];

export type Lead = {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: "contact_form" | "chat_lead" | "chat_handoff" | "import" | "bot_lead" | "web_form";
  bot_id?: string | null;
  form_id?: string | null;
  site_id?: string | null;
  chat_topic: string | null;
  language: string;
  page_path: string | null;
  referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  /** Empty only for imported contacts, which did not come through the site form. */
  consent_at: string | null;
  status: Status;
  assigned_to: string | null;
  product: Product | null;
  /** Every product of the request, the first one is `product` (0120_lead_products.sql). */
  products?: Product[];
  value_eur: number | null;
};

/** Pipeline columns on the board; spam stays out of the way. */
export const BOARD_STATUSES: readonly Status[] = ["new", "contacted", "proposal", "won", "lost"];

export type LeadEvent = {
  id: string;
  lead_id: string;
  created_at: string;
  author_id: string | null;
  kind: EntryKind | "status";
  body: string | null;
  from_status: Status | null;
  to_status: Status | null;
};

/** What a member logs by hand in a lead's history. */
export const ENTRY_KINDS = ["note", "call", "email"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export type Task = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  created_at: string;
  title: string;
  due_date: string | null;
  done_at: string | null;
};

export const ROLES = ["owner", "admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export const PLANS = ["start", "team", "business"] as const;
export type CloudPlan = (typeof PLANS)[number];
export type Plan = CloudPlan | "internal";
export type WorkspaceStatus = "trial" | "active" | "paused";
export type Workspace = { id: string; name: string; role: Role; plan: Plan; status: WorkspaceStatus; trial_ends_at: string | null };

/** Oprynex Cloud plans. Prices (net euros a month) and seats must stay equal to `prices` in oprynex-site/src/lib/offers.ts;
 *  seats are enforced by private.plan_user_limit (0107_cloud_plans_signup.sql). */
export const CLOUD_PLANS: Record<CloudPlan, { price: number; users: number; roles: boolean; integrations: boolean }> = {
  start: { price: 30, users: 2, roles: false, integrations: false },
  team: { price: 100, users: 5, roles: true, integrations: false },
  business: { price: 200, users: 12, roles: true, integrations: true },
};

/** Seats of a plan; null for Oprynex's own unlimited workspaces. */
export function seatLimit(plan: Plan): number | null {
  return plan === "internal" ? null : CLOUD_PLANS[plan].users;
}

/** Website chatbots and other integrations: Business and Oprynex's internal plan, while not paused (0110_integrations_by_plan.sql). */
export function hasIntegrations(workspace: Pick<Workspace, "plan" | "status">): boolean {
  return workspace.status !== "paused" && (workspace.plan === "internal" || CLOUD_PLANS[workspace.plan].integrations);
}

/** Roles a workspace may hand out: the Start plan has owners and members only. */
export function rolesForPlan(plan: Plan, roles: readonly Role[]): Role[] {
  return plan === "start" ? roles.filter((r) => r !== "admin") : [...roles];
}

/** Whole days left in a trial (0 on the last day, negative once it ended); null outside a trial. */
export function trialDaysLeft(workspace: Pick<Workspace, "status" | "trial_ends_at">, now = new Date()): number | null {
  if (workspace.status !== "trial" || !workspace.trial_ends_at) return null;
  return Math.ceil((new Date(workspace.trial_ends_at).getTime() - now.getTime()) / 86_400_000) - 1;
}

const WORKSPACE_KEY = "oprynex-app-workspace";
/** The workspace this browser last opened, if the person still belongs to it; otherwise the oldest one. */
export function pickWorkspace<T extends { id: string }>(list: T[], remembered: string | null): T | undefined {
  return list.find((w) => w.id === remembered) ?? list[0];
}
export function rememberedWorkspace(): string | null {
  try { return localStorage.getItem(WORKSPACE_KEY); } catch { return null; }
}
export function rememberWorkspace(id: string) {
  try { localStorage.setItem(WORKSPACE_KEY, id); } catch { /* storage blocked: the oldest workspace opens next time */ }
}

/** What each role may do; the database policies in 0102_import_merge_roles.sql, 0105_client_bots.sql, 0106_delete_leads.sql 0112_web_forms.sql and 0115_data_protection.sql enforce the same rules. */
export const PERMISSIONS = ["viewLeads", "workPipeline", "logActivity", "manageTasks", "importData", "mergeDuplicates", "deleteLeads", "manageBots", "manageForms", "manageData", "inviteMembers", "removeMembers", "changeRoles"] as const;
export type Permission = (typeof PERMISSIONS)[number];
const MEMBER_PERMISSIONS: readonly Permission[] = ["viewLeads", "workPipeline", "logActivity", "manageTasks"];

export function can(role: Role, permission: Permission): boolean {
  if (role === "owner") return true;
  if (role === "admin") return permission !== "changeRoles";
  return MEMBER_PERMISSIONS.includes(permission);
}

export type LeadFilter = "open" | Status | "all";

/** Assignee filter of the requests table: "me", "none" or a member's user id. */
export function matchesOwner(lead: Pick<Lead, "assigned_to">, owner: string | undefined, me: string): boolean {
  if (!owner) return true;
  if (owner === "none") return lead.assigned_to === null;
  return lead.assigned_to === (owner === "me" ? me : owner);
}

/** Status tab plus free-text search over name, email, company and message. */
export function filterLeads(leads: Lead[], filter: LeadFilter, query: string): Lead[] {
  const q = query.trim().toLowerCase();
  return leads.filter((lead) => {
    if (filter === "open" ? !OPEN_STATUSES.includes(lead.status) : filter !== "all" && lead.status !== filter) return false;
    if (!q) return true;
    // The site shows visitors the first 8 characters of the request id as their request number.
    if (/^[0-9a-f]{8}$/.test(q) && lead.id.startsWith(q)) return true;
    return [lead.name, lead.email, lead.company ?? "", lead.message].some((field) => field.toLowerCase().includes(q));
  });
}

export function countByStatus(leads: Lead[]): Record<LeadFilter, number> {
  const counts = { all: leads.length, open: 0, new: 0, contacted: 0, proposal: 0, won: 0, lost: 0, spam: 0 } as Record<LeadFilter, number>;
  for (const lead of leads) {
    counts[lead.status] += 1;
    if (OPEN_STATUSES.includes(lead.status)) counts.open += 1;
  }
  return counts;
}

/** Local calendar date as YYYY-MM-DD, the format of a Postgres date column. */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type TaskGroup = "overdue" | "today" | "upcoming" | "someday" | "done";

export function taskGroup(task: Task, today: string): TaskGroup {
  if (task.done_at) return "done";
  if (!task.due_date) return "someday";
  if (task.due_date < today) return "overdue";
  return task.due_date === today ? "today" : "upcoming";
}

/** Open tasks first by date (undated last), done tasks after them, newest done first. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.done_at !== !b.done_at) return a.done_at ? 1 : -1;
    if (a.done_at && b.done_at) return b.done_at.localeCompare(a.done_at);
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date !== b.due_date) return a.due_date ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** Reply link that opens the mail program with the visitor's address and a subject in their site language. */
/** Subject line of a reply in the customer's language, naming the CRM company the customer wrote to. */
export function replySubject(language: string, company: string): string {
  return language === "ru" ? `Ваш запрос в ${company}` : language === "de" ? `Ihre Anfrage bei ${company}` : `Your request to ${company}`;
}

export function replyMailto(lead: Pick<Lead, "email" | "language">, company: string): string {
  const subject = replySubject(lead.language, company);
  return `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}`;
}

/** Leads that share an email address with an earlier or later lead, keyed by lead id. */
export function duplicatesOf(leads: Pick<Lead, "id" | "email">[]): Map<string, string[]> {
  const byEmail = new Map<string, string[]>();
  for (const lead of leads) {
    const key = lead.email.trim().toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), lead.id]);
  }
  const result = new Map<string, string[]>();
  for (const ids of byEmail.values()) if (ids.length > 1) for (const id of ids) result.set(id, ids.filter((other) => other !== id));
  return result;
}

/** Calendar day key (YYYY-MM-DD, local time) of a timestamp, for grouping a history by day. */
export function dayKey(timestamp: string): string {
  return isoDate(new Date(timestamp));
}

// Client chatbots (0105_client_bots.sql). The engine is the separate Worker "bot"; the CRM only edits settings and reads usage.
export const BOT_ENGINE = "https://bot.oprynex.workers.dev";
export const BOT_LANGUAGES = ["de", "en", "ru"] as const;
export type BotLanguage = (typeof BOT_LANGUAGES)[number];
/** The six assistant types of the site's /assistants page (0114_bot_kinds.sql); a support assistant opens tickets. */
export const BOT_KINDS = ["website", "lead", "appointment", "support", "shop", "cart"] as const;
export type BotKind = (typeof BOT_KINDS)[number];

export type Bot = {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
  name: string;
  business: string;
  origins: string[];
  languages: BotLanguage[];
  greeting: string;
  knowledge: string;
  quick_replies: string[];
  color: string;
  privacy_url: string | null;
  daily_limit: number;
  visitor_daily_limit: number;
  kind: BotKind;
};
export type BotUsage = { bot_id: string; day: string; questions: number };

export type BotDraft = Omit<Bot, "id" | "workspace_id" | "created_at" | "updated_at">;
export const KNOWLEDGE_MAX = 20000;

export function emptyBot(): BotDraft {
  return { enabled: false, name: "", business: "", origins: [], languages: ["de"], greeting: "", knowledge: "", quick_replies: [], color: "#111111", privacy_url: null, daily_limit: 300, visitor_daily_limit: 40, kind: "website" };
}

/** One website per line; "Praxis.de/kontakt" becomes "https://praxis.de", blank lines and repeats disappear. */
export function parseOrigins(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split(/[\n,]+/)) {
    const raw = line.trim().toLowerCase();
    if (!raw) continue;
    try {
      const url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
      seen.add(url.hostname === "localhost" ? `http://localhost${url.port ? `:${url.port}` : ""}` : `https://${url.hostname}`);
    } catch { seen.add(raw); }
  }
  return [...seen];
}

const ORIGIN = /^(https:\/\/[a-z0-9.-]+|http:\/\/localhost(:[0-9]{2,5})?)$/;

export type BotProblem = "name" | "business" | "origins" | "languages" | "greeting" | "knowledge" | "quickReplies" | "color" | "privacyUrl" | "limits";

/** The same checks as the database constraints, so the form explains a mistake before saving. */
export function botProblems(bot: BotDraft): BotProblem[] {
  const problems: BotProblem[] = [];
  if (!bot.name.trim() || bot.name.trim().length > 60) problems.push("name");
  if (!bot.business.trim() || bot.business.trim().length > 120) problems.push("business");
  if (bot.origins.length > 10 || bot.origins.some((o) => !ORIGIN.test(o)) || (bot.enabled && bot.origins.length === 0)) problems.push("origins");
  if (bot.languages.length === 0) problems.push("languages");
  if (bot.greeting.length > 500) problems.push("greeting");
  if (bot.knowledge.length > KNOWLEDGE_MAX) problems.push("knowledge");
  if (bot.quick_replies.length > 6 || bot.quick_replies.join("").length > 360) problems.push("quickReplies");
  if (!/^#[0-9a-f]{6}$/.test(bot.color)) problems.push("color");
  if (bot.privacy_url !== null && (!/^https:\/\/\S+$/.test(bot.privacy_url) || bot.privacy_url.length > 300)) problems.push("privacyUrl");
  if (!(bot.daily_limit >= 1 && bot.daily_limit <= 5000 && bot.visitor_daily_limit >= 1 && bot.visitor_daily_limit <= 200)) problems.push("limits");
  return problems;
}

/** The engine's own demo page for a bot; it shows the bot only when the engine address is among the bot's websites. */
export function previewUrl(bot: Pick<Bot, "id" | "languages">): string {
  return `${BOT_ENGINE}/demo/${bot.id}?lang=${bot.languages[0] ?? "de"}`;
}

/** The line a client's website needs to show the bot. */
export function embedCode(botId: string, language?: BotLanguage): string {
  return `<script src="${BOT_ENGINE}/widget.js" data-bot="${botId}"${language ? ` data-lang="${language}"` : ""} async></script>`;
}

// Website forms (0112_web_forms.sql): a contact form for the customer's own website, on every plan, served by the engine.
export type WebForm = {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
  name: string;
  origins: string[];
  language: BotLanguage;
  color: string;
  privacy_url: string | null;
  ask_company: boolean;
  daily_limit: number;
  /** "request" creates requests, "support" creates support tickets (0113_support_forms.sql). */
  purpose: FormPurpose;
};
export const FORM_PURPOSES = ["request", "support"] as const;
export type FormPurpose = (typeof FORM_PURPOSES)[number];
export type WebFormDraft = Omit<WebForm, "id" | "workspace_id" | "created_at" | "updated_at">;
export const WEB_FORM_LIMIT = 10;

export function emptyForm(language: BotLanguage = "de"): WebFormDraft {
  return { enabled: true, name: "", origins: [], language, color: "#111111", privacy_url: null, ask_company: false, daily_limit: 200, purpose: "request" };
}

export type FormProblem = "name" | "origins" | "color" | "privacyUrl" | "limits";

/** The same checks as the database constraints. An active form needs a website and the privacy policy its consent links to. */
export function formProblems(form: WebFormDraft): FormProblem[] {
  const problems: FormProblem[] = [];
  if (!form.name.trim() || form.name.trim().length > 60) problems.push("name");
  if (form.origins.length > 10 || form.origins.some((o) => !ORIGIN.test(o)) || (form.enabled && form.origins.length === 0)) problems.push("origins");
  if (!/^#[0-9a-f]{6}$/.test(form.color)) problems.push("color");
  if (form.privacy_url === null ? form.enabled : !/^https:\/\/\S+$/.test(form.privacy_url) || form.privacy_url.length > 300) problems.push("privacyUrl");
  if (!(form.daily_limit >= 1 && form.daily_limit <= 2000)) problems.push("limits");
  return problems;
}

/** The two lines a website needs: where the form appears, and the script that fills it. */
export function formEmbedCode(formId: string): string {
  return `<div data-oprynex-form="${formId}"></div>\n<script src="${BOT_ENGINE}/form.js" async></script>`;
}

/** The engine's own preview page; it shows the form only when the engine address is among the form's websites. */
export function formPreviewUrl(formId: string): string {
  return `${BOT_ENGINE}/form-demo/${formId}`;
}

/** Questions today and over the last 7 days (today included), from bot_usage rows. */
export function usageSummary(rows: BotUsage[], botId: string, today: string): { today: number; week: number } {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  const from = start.toISOString().slice(0, 10);
  let todayCount = 0;
  let week = 0;
  for (const row of rows) {
    if (row.bot_id !== botId || row.day < from || row.day > today) continue;
    week += row.questions;
    if (row.day === today) todayCount += row.questions;
  }
  return { today: todayCount, week };
}

// Support tickets (0108_tickets.sql).
export const TICKET_STATUSES = ["open", "pending", "solved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const TICKET_CHANNELS = ["manual", "request", "email", "phone", "chat", "web"] as const;
export type TicketChannel = (typeof TICKET_CHANNELS)[number];

export type Ticket = {
  id: string;
  number: number;
  workspace_id: string;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  subject: string;
  customer_name: string;
  customer_email: string;
  channel: TicketChannel;
  status: TicketStatus;
  priority: Priority;
  assigned_to: string | null;
  /** The support form the customer used (channel "web"). */
  form_id?: string | null;
};
/** "customer" is the customer's own message from a support form; members add only notes and replies. */
export type TicketMessage = { id: string; ticket_id: string; created_at: string; author_id: string | null; kind: "note" | "reply" | "status" | "customer"; body: string | null; from_status: TicketStatus | null; to_status: TicketStatus | null };

/** Open and waiting tickets still need work; solved and closed ones do not. */
export const isOpenTicket = (ticket: Pick<Ticket, "status">) => ticket.status === "open" || ticket.status === "pending";

export type TicketFilter = "active" | TicketStatus | "mine" | "all";

/** Most urgent first, then the most recently changed. */
export function sortTickets(tickets: Ticket[]): Ticket[] {
  const rank = (p: Priority) => PRIORITIES.indexOf(p);
  return [...tickets].sort((a, b) => rank(a.priority) - rank(b.priority) || b.updated_at.localeCompare(a.updated_at));
}

export function filterTickets(tickets: Ticket[], filter: TicketFilter, query: string, me: string): Ticket[] {
  const q = query.trim().toLowerCase();
  return sortTickets(tickets.filter((t) => {
    if (filter === "active" ? !isOpenTicket(t) : filter === "mine" ? !(t.assigned_to === me && isOpenTicket(t)) : filter !== "all" && t.status !== filter) return false;
    return !q || `#${t.number} ${t.subject} ${t.customer_name} ${t.customer_email}`.toLowerCase().includes(q);
  }));
}

/** A new ticket's fields taken from a request: its subject from the first line of the message. */
export function ticketFromLead(lead: Pick<Lead, "id" | "name" | "email" | "message">): { lead_id: string; subject: string; customer_name: string; customer_email: string; channel: TicketChannel } {
  const first = (lead.message.split("\n").find((line) => line.trim()) ?? "").trim();
  const subject = (first.length > 80 ? `${first.slice(0, 79).trimEnd()}…` : first) || lead.name;
  return { lead_id: lead.id, subject, customer_name: lead.name.slice(0, 100), customer_email: lead.email.toLowerCase().slice(0, 255), channel: "request" };
}

// Customer card: requests and tickets of one person, grouped by email address in the browser (no extra table).
export type Customer = {
  email: string;
  name: string;
  company: string | null;
  leads: Lead[];
  tickets: Ticket[];
  first: string;
  last: string;
  openRequests: number;
  openTickets: number;
  wonEur: number;
};

/** One customer per email address (case-insensitive); name and company come from the newest request or ticket. */
export function customersFrom(leads: Lead[], tickets: Ticket[]): Customer[] {
  const byEmail = new Map<string, Customer>();
  const entry = (email: string) => {
    let c = byEmail.get(email);
    if (!c) { c = { email, name: "", company: null, leads: [], tickets: [], first: "", last: "", openRequests: 0, openTickets: 0, wonEur: 0 }; byEmail.set(email, c); }
    return c;
  };
  const seen = (c: Customer, at: string, name: string, company: string | null) => {
    if (!c.first || at < c.first) c.first = at;
    if (!c.last || at >= c.last) { c.last = at; if (name) c.name = name; if (company) c.company = company; }
    if (!c.name) c.name = name;
    if (!c.company && company) c.company = company;
  };
  for (const lead of leads) {
    const email = lead.email.trim().toLowerCase();
    if (!email || lead.status === "spam") continue;
    const c = entry(email);
    c.leads.push(lead);
    if (OPEN_STATUSES.includes(lead.status)) c.openRequests += 1;
    if (lead.status === "won" && lead.value_eur) c.wonEur += lead.value_eur;
    seen(c, lead.created_at, lead.name, lead.company);
  }
  for (const ticket of tickets) {
    const email = ticket.customer_email.trim().toLowerCase();
    if (!email) continue;
    const c = entry(email);
    c.tickets.push(ticket);
    if (isOpenTicket(ticket)) c.openTickets += 1;
    seen(c, ticket.updated_at, ticket.customer_name, null);
  }
  for (const c of byEmail.values()) {
    c.leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
    c.tickets.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (!c.name) c.name = c.email;
  }
  return [...byEmail.values()].sort((a, b) => b.last.localeCompare(a.last));
}

export function searchCustomers(customers: Customer[], query: string): Customer[] {
  const q = query.trim().toLowerCase();
  return q ? customers.filter((c) => `${c.name} ${c.company ?? ""} ${c.email}`.toLowerCase().includes(q)) : customers;
}

// First steps of a new Cloud company (onboarding card on the dashboard), worked out from what already exists.
export const ONBOARDING_STEPS = ["form", "team", "data", "push"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function onboardingDone(facts: { forms: number; sites: number; members: number; invites: number; leads: number; push: boolean }): Record<OnboardingStep, boolean> {
  return {
    form: facts.forms + facts.sites > 0,
    team: facts.members > 1 || facts.invites > 0,
    data: facts.leads > 0,
    push: facts.push,
  };
}

/** Oprynex's own contact, published in the site's Impressum; Cloud customers write here to continue or change a plan. */
export const OPRYNEX_CONTACT = "kontakt@example.com";

/** An email to Oprynex asking to continue on a plan or switch to it; payment is arranged personally until online payment opens. */
export function planRequestMailto(workspaceName: string, plan: CloudPlan, subjectLine: string): string {
  return `mailto:${OPRYNEX_CONTACT}?subject=${encodeURIComponent(`${subjectLine}: ${plan[0]!.toUpperCase()}${plan.slice(1)} · ${workspaceName}`)}`;
}

/** Support figures for the dashboard: open and waiting tickets, tickets closed in the last 30 days, the oldest open one. */
export function ticketStats(tickets: Pick<Ticket, "status" | "created_at" | "updated_at">[], now = new Date()): { open: number; pending: number; done30: number; oldestOpenDays: number | null } {
  const day = 86_400_000;
  const active = tickets.filter((t) => t.status === "open" || t.status === "pending");
  const oldest = active.reduce<number | null>((min, t) => { const at = Date.parse(t.created_at); return min === null || at < min ? at : min; }, null);
  return {
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    done30: tickets.filter((t) => (t.status === "solved" || t.status === "closed") && now.getTime() - Date.parse(t.updated_at) <= 30 * day).length,
    oldestOpenDays: oldest === null ? null : Math.floor((now.getTime() - oldest) / day),
  };
}
