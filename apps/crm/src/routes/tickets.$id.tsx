import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRightLeft, Mail, MessageSquareReply, StickyNote, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ReplyButton } from "@/components/reply-button";
import { useWorkspace } from "@/lib/auth";
import { PRIORITIES, TICKET_STATUSES, can, type Priority, type Ticket, type TicketMessage } from "@/lib/crm";
import { channelLabel, priorityLabel, ticketStatusLabel, useI18n } from "@/lib/i18n";
import { useTeam, useTicket, useTicketChange, useTicketMessages } from "@/lib/queries";
import { priorityTone } from "@/routes/tickets.index";

export const Route = createFileRoute("/tickets/$id")({ component: TicketPage });

function TicketPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const ticket = useTicket(id);
  return (
    <section>
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("backToTickets")}</Link>
      {ticket.isPending && <p className="mt-6 text-sm text-muted" role="status">{t("loading")}</p>}
      {ticket.isError && <p className="mt-6 text-sm text-danger" role="alert">{t("loadError")}</p>}
      {ticket.isSuccess && !ticket.data && <p className="mt-6 text-sm text-muted">{t("notFound")}</p>}
      {ticket.data && <TicketDetail ticket={ticket.data} />}
    </section>
  );
}

/** Subject of a reply that names the ticket, so the customer's answer can be matched to it. */
export function ticketSubject(ticket: Pick<Ticket, "number" | "subject">): string {
  return `Re: [#${ticket.number}] ${ticket.subject}`;
}

/** Opens the member's own email program with the customer and a subject that names the ticket. */
export function ticketMailto(ticket: Pick<Ticket, "number" | "subject" | "customer_email">): string {
  return `mailto:${ticket.customer_email}?subject=${encodeURIComponent(ticketSubject(ticket))}`;
}

function TicketDetail({ ticket }: { ticket: Ticket }) {
  const { workspace } = useWorkspace();
  const { t, lang, formatDateTime } = useI18n();
  const navigate = useNavigate();
  const change = useTicketChange(workspace.id);
  const team = useTeam(workspace.id);
  const failed = change.update.isError || change.remove.isError;
  function remove() {
    if (!window.confirm(t("deleteTicketConfirm"))) return;
    change.remove.mutate(ticket.id, { onSuccess: () => void navigate({ to: "/tickets" }) });
  }
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-5">
        <div className="card p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted tabular-nums">#{ticket.number} · {channelLabel[ticket.channel][lang]}</p>
              <h1 className="text-2xl font-bold">{ticket.subject}</h1>
              {(ticket.customer_name || ticket.customer_email) && (
                <p className="mt-1 text-sm text-muted">{ticket.customer_name}{ticket.customer_name && ticket.customer_email && " · "}
                  {ticket.customer_email && <a href={`mailto:${ticket.customer_email}`} className="underline">{ticket.customer_email}</a>}
                  {ticket.customer_email && <Link to="/customers/$email" params={{ email: ticket.customer_email }} className="ml-3 font-semibold text-gold hover:underline">{t("toCustomer")}</Link>}</p>
              )}
            </div>
            <span className={`chip ${priorityTone[ticket.priority]}`}>{priorityLabel[ticket.priority][lang]}</span>
            {ticket.customer_email && <ReplyButton to={ticket.customer_email} subject={ticketSubject(ticket)} kind="ticket" name={ticket.customer_name} company={workspace.name} number={`#${ticket.number}`} />}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold">{t("status")}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TICKET_STATUSES.map((status) => (
              <button key={status} type="button" disabled={change.update.isPending} aria-pressed={ticket.status === status}
                onClick={() => ticket.status !== status && change.update.mutate({ id: ticket.id, patch: { status } })}
                className={`chip ${ticket.status === status ? "border-gold bg-gold text-on-gold" : "border-line text-muted hover:text-text"}`}>
                {ticketStatusLabel[status][lang]}
              </button>
            ))}
          </div>
          {failed && <p className="mt-2 text-sm text-danger" role="alert">{t("saveError")}</p>}
        </div>

        <Conversation ticket={ticket} />
      </div>

      <aside className="space-y-5">
        <div className="card grid gap-4 p-5">
          <label className="block text-xs font-semibold text-muted">{t("ticketAssignee")}
            <select className="field mt-1" value={ticket.assigned_to ?? ""} disabled={change.update.isPending}
              onChange={(e) => change.update.mutate({ id: ticket.id, patch: { assigned_to: e.target.value || null } })}>
              <option value="">{t("unassigned")}</option>
              {(team.data ?? []).map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-muted">{t("ticketPriority")}
            <select className="field mt-1" value={ticket.priority} disabled={change.update.isPending}
              onChange={(e) => change.update.mutate({ id: ticket.id, patch: { priority: e.target.value as Priority } })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel[p][lang]}</option>)}
            </select>
          </label>
        </div>
        <dl className="card grid gap-3 p-5 text-sm">
          <div><dt className="text-xs font-semibold text-muted">{t("ticketCreated")}</dt><dd>{formatDateTime(ticket.created_at)}</dd></div>
          <div><dt className="text-xs font-semibold text-muted">{t("ticketUpdated")}</dt><dd>{formatDateTime(ticket.updated_at)}</dd></div>
          {ticket.lead_id && <div><dt className="text-xs font-semibold text-muted">{t("ticketChannel")}</dt><dd><Link to="/leads/$id" params={{ id: ticket.lead_id }} className="text-gold underline">{t("ticketFromRequest")}</Link></dd></div>}
        </dl>
        {can(workspace.role, "deleteLeads") && (
          <button type="button" className="btn-ghost w-full text-danger" onClick={remove} disabled={change.remove.isPending}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("deleteTicket")}</button>
        )}
      </aside>
    </div>
  );
}

function Conversation({ ticket }: { ticket: Ticket }) {
  const { workspace, userId } = useWorkspace();
  const { t, lang, formatDateTime } = useI18n();
  const messages = useTicketMessages(ticket.id);
  const team = useTeam(workspace.id);
  const { addMessage, removeMessage } = useTicketChange(workspace.id);
  const [kind, setKind] = useState<"note" | "reply">("note");
  const [body, setBody] = useState("");
  const emailOf = (id: string | null) => (team.data ?? []).find((m) => m.user_id === id)?.email ?? "—";
  function submit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    addMessage.mutate({ ticketId: ticket.id, kind, body: text.slice(0, 8000) }, { onSuccess: () => setBody("") });
  }
  const line = (m: TicketMessage) => m.kind === "status"
    ? `${t("ticketStatusChange")}: ${m.from_status ? ticketStatusLabel[m.from_status][lang] : "—"} → ${m.to_status ? ticketStatusLabel[m.to_status][lang] : "—"}`
    : m.body ?? "";
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold">{t("ticketConversation")}</h2>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex gap-1.5" role="group" aria-label={t("ticketConversation")}>
          <button type="button" aria-pressed={kind === "note"} onClick={() => setKind("note")} className={`chip ${kind === "note" ? "border-gold bg-gold text-on-gold" : "border-line text-muted"}`}><StickyNote className="h-3.5 w-3.5" aria-hidden="true" />{t("ticketNote")}</button>
          <button type="button" aria-pressed={kind === "reply"} onClick={() => setKind("reply")} className={`chip ${kind === "reply" ? "border-gold bg-gold text-on-gold" : "border-line text-muted"}`}><MessageSquareReply className="h-3.5 w-3.5" aria-hidden="true" />{t("ticketReply")}</button>
        </div>
        <label className="sr-only" htmlFor="ticket-message">{kind === "note" ? t("ticketNote") : t("ticketReply")}</label>
        <textarea id="ticket-message" className="field min-h-24" maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} />
        {kind === "reply" && <p className="text-xs text-muted">{t("ticketReplyHint")}</p>}
        {(addMessage.isError || removeMessage.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
        <button type="submit" className="btn-primary" disabled={addMessage.isPending || !body.trim()}>{t("ticketAdd")}</button>
      </form>
      {messages.isPending && <p className="mt-4 text-sm text-muted" role="status">{t("loading")}</p>}
      <ol className="mt-5 space-y-3">
        {[...(messages.data ?? [])].reverse().map((m) => (
          <li key={m.id} className={`rounded-xl border p-3 text-sm ${m.kind === "reply" ? "border-gold/50" : m.kind === "status" ? "border-transparent bg-surface text-muted" : m.kind === "customer" ? "border-line bg-surface-2" : "border-line"}`}>
            <div className="flex items-center gap-2 text-xs text-muted">
              {m.kind === "status" ? <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" /> : m.kind === "customer" ? <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> : m.kind === "reply" ? <MessageSquareReply className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> : <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{m.kind === "reply" ? t("ticketReply") : m.kind === "note" ? t("ticketNote") : m.kind === "customer" ? t("ticketCustomerMessage") : ""}</span>
              <span className="ml-auto">{m.kind === "customer" ? ticket.customer_email || ticket.customer_name || "—" : emailOf(m.author_id)} · {formatDateTime(m.created_at)}</span>
              {m.kind !== "status" && m.author_id === userId && (
                <button type="button" className="rounded p-1 hover:text-danger" aria-label={t("deleteEntry")} onClick={() => removeMessage.mutate({ id: m.id, ticketId: ticket.id })}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{line(m)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
