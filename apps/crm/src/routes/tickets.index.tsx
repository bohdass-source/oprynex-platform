import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LifeBuoy, Plus, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useWorkspace } from "@/lib/auth";
import { PRIORITIES, TICKET_STATUSES, filterTickets, isOpenTicket, type Priority, type TicketChannel, type TicketFilter } from "@/lib/crm";
import { channelLabel, priorityLabel, ticketStatusLabel, useI18n, type DictKey } from "@/lib/i18n";
import { useTeam, useTicketChange, useTickets } from "@/lib/queries";

const FILTERS: TicketFilter[] = ["active", "mine", ...TICKET_STATUSES, "all"];
const filterKey: Partial<Record<TicketFilter, DictKey>> = { active: "ticketActive", mine: "ticketMine", all: "ticketAll" };

export const Route = createFileRoute("/tickets/")({
  validateSearch: (s: Record<string, unknown>): { view?: TicketFilter | undefined } => ({ view: FILTERS.includes(s["view"] as TicketFilter) ? (s["view"] as TicketFilter) : undefined }),
  component: TicketsPage,
});

export const priorityTone: Record<Priority, string> = {
  urgent: "border-danger text-danger", high: "border-gold text-gold", normal: "border-line text-muted", low: "border-line text-muted opacity-70",
};

function TicketsPage() {
  const { workspace, userId } = useWorkspace();
  const { t, lang, formatDateTime } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/tickets/" });
  const tickets = useTickets(workspace.id);
  const team = useTeam(workspace.id);
  const filter = search.view ?? "active";
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const all = tickets.data ?? [];
  const rows = useMemo(() => filterTickets(all, filter, query, userId), [all, filter, query, userId]);
  const count = (f: TicketFilter) => filterTickets(all, f, "", userId).length;
  const emailOf = (id: string | null) => (team.data ?? []).find((m) => m.user_id === id)?.email ?? null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{t("tickets")}</h1>
          <p className="mt-1 text-sm text-muted">{t("ticketsIntro")}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating((v) => !v)} aria-expanded={creating}><Plus className="h-4 w-4" aria-hidden="true" />{t("newTicket")}</button>
      </div>
      {creating && <NewTicketForm workspaceId={workspace.id} onDone={(id) => { setCreating(false); if (id) void navigate({ to: "/tickets/$id", params: { id } }); }} />}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("status")}>
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => void navigate({ search: { view: f === "active" ? undefined : f } })}
            className={`chip ${filter === f ? "border-gold bg-gold text-on-gold" : "border-line text-muted hover:text-text"}`}>
            {filterKey[f] ? t(filterKey[f]!) : ticketStatusLabel[f as keyof typeof ticketStatusLabel][lang]} <span className="opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>
      <label className="relative block md:max-w-md">
        <span className="sr-only">{t("search")}</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
        <input type="search" className="field pl-9" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {tickets.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {tickets.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {tickets.data && rows.length === 0 && (
        <div className="card flex items-center gap-3 p-6 text-sm text-muted"><LifeBuoy className="h-6 w-6 text-gold" aria-hidden="true" />{t("noTickets")}</div>
      )}
      <ul className="space-y-2">
        {rows.map((ticket) => (
          <li key={ticket.id}>
            <Link to="/tickets/$id" params={{ id: ticket.id }} className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-surface-2">
              <span className="w-14 shrink-0 text-xs text-muted tabular-nums">#{ticket.number}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-semibold ${isOpenTicket(ticket) ? "" : "text-muted"}`}>{ticket.subject}</span>
                <span className="block truncate text-xs text-muted">{[ticket.customer_name, ticket.customer_email].filter(Boolean).join(" · ") || channelLabel[ticket.channel][lang]}</span>
              </span>
              <span className={`chip ${priorityTone[ticket.priority]}`}>{priorityLabel[ticket.priority][lang]}</span>
              <span className="chip border-line">{ticketStatusLabel[ticket.status][lang]}</span>
              <span className="w-40 truncate text-xs text-muted">{emailOf(ticket.assigned_to) ?? t("unassigned")}</span>
              <span className="w-32 text-right text-xs text-muted">{formatDateTime(ticket.updated_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewTicketForm({ workspaceId, onDone }: { workspaceId: string; onDone: (id: string | null) => void }) {
  const { t, lang } = useI18n();
  const { create } = useTicketChange(workspaceId);
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<TicketChannel>("phone");
  const [priority, setPriority] = useState<Priority>("normal");
  const [touched, setTouched] = useState(false);
  const cleanEmail = email.trim().toLowerCase();
  const ok = subject.trim().length >= 1 && subject.trim().length <= 200 && (!cleanEmail || EMAIL.test(cleanEmail));
  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!ok) return;
    create.mutate({ subject: subject.trim(), customer_name: name.trim().slice(0, 100), customer_email: cleanEmail, channel, priority }, { onSuccess: (id) => onDone(id) });
  }
  const label = "block text-xs font-semibold text-muted";
  return (
    <form onSubmit={submit} noValidate className="card grid gap-3 p-5 md:grid-cols-2">
      <label className={`${label} md:col-span-2`}>{t("ticketSubject")}
        <input className="field mt-1" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={touched && !subject.trim()} />
      </label>
      <label className={label}>{t("ticketCustomer")}<input className="field mt-1" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className={label}>{t("ticketCustomerEmail")}<input type="email" className="field mt-1" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && !!cleanEmail && !EMAIL.test(cleanEmail)} /></label>
      <label className={label}>{t("ticketChannel")}
        <select className="field mt-1" value={channel} onChange={(e) => setChannel(e.target.value as TicketChannel)}>
          {(["phone", "email", "chat", "manual"] as const).map((c) => <option key={c} value={c}>{channelLabel[c][lang]}</option>)}
        </select>
      </label>
      <label className={label}>{t("ticketPriority")}
        <select className="field mt-1" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel[p][lang]}</option>)}
        </select>
      </label>
      {create.isError && <p className="text-sm text-danger md:col-span-2" role="alert">{t("saveError")}</p>}
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" className="btn-primary" disabled={create.isPending}>{t("save")}</button>
        <button type="button" className="btn-ghost" onClick={() => onDone(null)}>{t("cancel")}</button>
      </div>
    </form>
  );
}
