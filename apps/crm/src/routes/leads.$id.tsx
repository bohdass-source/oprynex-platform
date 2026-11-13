import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRightLeft, LifeBuoy, Merge, Mail, Phone, StickyNote, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { TaskForm, TaskList } from "@/components/task-list";
import { useWorkspace } from "@/lib/auth";
import { ReplyButton } from "@/components/reply-button";
import { ENTRY_KINDS, STATUSES, can, dayKey, isoDate, replySubject, ticketFromLead, type EntryKind, type Lead, type LeadEvent } from "@/lib/crm";
import { entryLabel, productLabel, sourceLabel, statusLabel, ticketStatusLabel, useI18n, type DictKey } from "@/lib/i18n";
import { PRODUCTS, START_PRICE, formatEur, leadProduct, leadProducts, leadValue, parseValue } from "@/lib/products";
import { useAddEntry, useDeleteEntry, useDeleteLeads, useTeam, useTicketChange, useTickets, useLead, useLeadEvents, useLeads, useMergeLeads, useTasks, useUpdateLead } from "@/lib/queries";

export const Route = createFileRoute("/leads/$id")({ component: LeadPage });

function LeadPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const lead = useLead(id);
  return (
    <section>
      <Link to="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("back")}</Link>
      {lead.isPending && <p className="mt-6 text-sm text-muted" role="status">{t("loading")}</p>}
      {lead.isError && <p className="mt-6 text-sm text-danger" role="alert">{t("loadError")}</p>}
      {lead.isSuccess && !lead.data && <p className="mt-6 text-sm text-muted">{t("notFound")}</p>}
      {lead.data && <LeadDetail lead={lead.data} />}
    </section>
  );
}

/** Support tickets that came from this request, and a button to open a new one with its details. */
function LeadTickets({ lead }: { lead: Lead }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const tickets = useTickets(lead.workspace_id);
  const { create } = useTicketChange(lead.workspace_id);
  const mine = (tickets.data ?? []).filter((ticket) => ticket.lead_id === lead.id);
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold">{t("ticketsOfRequest")}</h2>
      {mine.length > 0 && (
        <ul className="mt-2 space-y-1">
          {mine.map((ticket) => (
            <li key={ticket.id}><Link to="/tickets/$id" params={{ id: ticket.id }} className="flex gap-2 rounded-lg p-1.5 text-sm hover:bg-surface-2">
              <span className="text-muted tabular-nums">#{ticket.number}</span><span className="min-w-0 flex-1 truncate">{ticket.subject}</span><span className="text-xs text-muted">{ticketStatusLabel[ticket.status][lang]}</span>
            </Link></li>
          ))}
        </ul>
      )}
      <button type="button" className="btn-ghost mt-3 w-full" disabled={create.isPending}
        onClick={() => create.mutate({ ...ticketFromLead(lead), priority: "normal" }, { onSuccess: (id) => { if (id) void navigate({ to: "/tickets/$id", params: { id } }); } })}>
        <LifeBuoy className="h-4 w-4" aria-hidden="true" />{t("ticketCreateFromRequest")}
      </button>
      {create.isError && <p className="mt-2 text-sm text-danger" role="alert">{t("saveError")}</p>}
    </div>
  );
}

function DeleteLead({ lead }: { lead: Lead }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const remove = useDeleteLeads(lead.workspace_id);
  function confirmAndDelete() {
    if (!window.confirm(t("deleteLeadConfirm"))) return;
    remove.mutate([lead.id], { onSuccess: () => void navigate({ to: "/leads" }) });
  }
  return (
    <div className="card p-5">
      <button type="button" className="btn-ghost w-full text-danger" onClick={confirmAndDelete} disabled={remove.isPending}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("deleteLead")}</button>
      <p className="mt-2 text-xs text-muted">{t("deleteLeadHint")}</p>
      {remove.isError && <p className="mt-2 text-sm text-danger" role="alert">{t("saveError")}</p>}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (<div><dt className="text-xs font-semibold text-muted">{label}</dt><dd className="text-sm">{children}</dd></div>);
}

function LeadDetail({ lead }: { lead: Lead }) {
  const { workspace } = useWorkspace();
  const { t, lang, formatDateTime, languageName } = useI18n();
  const update = useUpdateLead(workspace.id);
  const tasks = useTasks(workspace.id);
  const leads = useLeads(workspace.id);
  const leadTasks = (tasks.data ?? []).filter((task) => task.lead_id === lead.id);
  const others = (leads.data ?? []).filter((other) => other.id !== lead.id && other.email.toLowerCase() === lead.email.toLowerCase());
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-5">
        <div className="card p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <a href={`mailto:${lead.email}`} className="break-all text-sm text-muted underline">{lead.email}</a>
              <Link to="/customers/$email" params={{ email: lead.email.toLowerCase() }} className="ml-3 text-sm font-semibold text-gold hover:underline">{t("toCustomer")}</Link>
            </div>
            <StatusPill status={lead.status} />
            <ReplyButton to={lead.email} subject={replySubject(lead.language, workspace.name)} kind="lead" language={lead.language} name={lead.name} company={workspace.name} />
          </div>
          <h2 className="mt-5 text-xs font-semibold text-muted">{t("message")}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{lead.message || "—"}</p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold">{t("status")}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUSES.map((status) => (
              <button key={status} type="button" disabled={update.isPending} aria-pressed={lead.status === status}
                onClick={() => lead.status !== status && update.mutate({ id: lead.id, patch: { status } })}
                className={`chip ${lead.status === status ? "border-gold bg-gold text-on-gold" : "border-line text-muted hover:text-text"}`}>
                {statusLabel[status][lang]}
              </button>
            ))}
          </div>
          {update.isError && <p className="mt-2 text-sm text-danger" role="alert">{t("saveError")}</p>}
        </div>

        <Timeline lead={lead} />
      </div>

      <aside className="space-y-5">
        <DealCard lead={lead} />
        {others.length > 0 && (
          <div className="card border-gold/50 p-5">
            <h2 className="text-sm font-bold text-gold">{t("otherRequests")}</h2>
            <ul className="mt-2 space-y-1">
              {others.map((other) => <OtherRequest key={other.id} lead={lead} other={other} />)}
            </ul>
            {can(workspace.role, "mergeDuplicates") && <p className="mt-2 text-xs text-muted">{t("mergeHint")}</p>}
          </div>
        )}
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-bold">{t("tasks")}</h2>
          <TaskForm workspaceId={workspace.id} leadId={lead.id} />
          {tasks.data && <TaskList tasks={leadTasks} workspaceId={workspace.id} />}
        </div>
        <dl className="card grid gap-3 p-5">
          <Fact label={t("received")}>{formatDateTime(lead.created_at)}</Fact>
          {lead.company && <Fact label={t("company")}>{lead.company}</Fact>}
          <Fact label={t("source")}>{sourceLabel[lead.source]?.[lang] ?? lead.source}</Fact>
          {lead.chat_topic && <Fact label={t("topic")}>{lead.chat_topic}</Fact>}
          <Fact label={t("language")}>{languageName(lead.language)}</Fact>
          {lead.page_path && <Fact label={t("page")}>{lead.page_path}</Fact>}
          <Fact label={t("cameFrom")}>{lead.referrer_host ?? t("cameDirect")}</Fact>
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && <Fact label={t("campaign")}>{[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ")}</Fact>}
          <Fact label={t("consent")}>{lead.consent_at ? formatDateTime(lead.consent_at) : t("importedNoConsent")}</Fact>
        </dl>
        <LeadTickets lead={lead} />
        {can(workspace.role, "deleteLeads") && <DeleteLead lead={lead} />}
      </aside>
    </div>
  );
}

/** Another request from the same address; owners and admins can fold it into the open one after a confirmation. */
function OtherRequest({ lead, other }: { lead: Lead; other: Lead }) {
  const { workspace } = useWorkspace();
  const { t, formatDateTime } = useI18n();
  const merge = useMergeLeads(workspace.id);
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="rounded-lg p-1.5 hover:bg-surface-2">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/leads/$id" params={{ id: other.id }} className="flex-1 text-muted hover:text-text">{formatDateTime(other.created_at)}</Link>
        <StatusPill status={other.status} />
        {can(workspace.role, "mergeDuplicates") && !confirming && (
          <button type="button" onClick={() => setConfirming(true)} className="rounded-md p-1 text-muted hover:text-gold" aria-label={`${t("merge")}: ${formatDateTime(other.created_at)}`} title={t("merge")}>
            <Merge className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {confirming && (
        <div className="mt-2 space-y-2 rounded-lg border border-line bg-surface-2 p-2.5 text-xs">
          <p>{t("mergeConfirm")}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-primary h-8 py-1" disabled={merge.isPending} onClick={() => merge.mutate({ keep: lead.id, drop: other.id }, { onSuccess: () => setConfirming(false) })}>{t("merge")}</button>
            <button type="button" className="btn-ghost h-8 py-1" onClick={() => setConfirming(false)}>{t("cancel")}</button>
          </div>
          {merge.isError && <p className="text-danger" role="alert">{t("saveError")}</p>}
        </div>
      )}
    </li>
  );
}

/** Product first; the value field appears once a product is known and is checked while typing. */
/** Who works on this request; only members of the workspace can be chosen (the database checks it too). */
function AssigneeSelect({ lead }: { lead: Lead }) {
  const { workspace, userId } = useWorkspace();
  const { t } = useI18n();
  const update = useUpdateLead(workspace.id);
  const team = useTeam(workspace.id);
  return (
    <div>
      <label htmlFor="lead-assignee" className="text-xs font-semibold text-muted">{t("ticketAssignee")}</label>
      <div className="mt-1 flex gap-2">
        <select id="lead-assignee" className="field" value={lead.assigned_to ?? ""} disabled={update.isPending}
          onChange={(e) => update.mutate({ id: lead.id, patch: { assigned_to: e.target.value || null } })}>
          <option value="">{t("unassigned")}</option>
          {(team.data ?? []).map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
        </select>
        {lead.assigned_to !== userId && (
          <button type="button" className="btn-ghost shrink-0" disabled={update.isPending} onClick={() => update.mutate({ id: lead.id, patch: { assigned_to: userId } })}>{t("takeIt")}</button>
        )}
      </div>
    </div>
  );
}

function DealCard({ lead }: { lead: Lead }) {
  const { workspace } = useWorkspace();
  const { t, lang } = useI18n();
  const update = useUpdateLead(workspace.id);
  const product = leadProduct(lead);
  const value = leadValue(lead);
  const [input, setInput] = useState(lead.value_eur == null ? "" : String(lead.value_eur));
  const [saved, setSaved] = useState(false);
  useEffect(() => setInput(lead.value_eur == null ? "" : String(lead.value_eur)), [lead.value_eur]);
  const parsed = parseValue(input);
  const changed = parsed.ok && parsed.value !== lead.value_eur;
  const chosen = leadProducts(lead).guessed ? [] : leadProducts(lead).products;
  const estimate = leadValue({ ...lead, value_eur: null });
  const startPrice = estimate?.value ?? null;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (parsed.ok && changed) update.mutate({ id: lead.id, patch: { value_eur: parsed.value } }, { onSuccess: () => setSaved(true) });
  }
  return (
    <div className="card space-y-4 p-5">
      <AssigneeSelect lead={lead} />
      <div className="flex items-baseline gap-2">
        <h2 className="flex-1 text-sm font-bold">{t("deal")}</h2>
        {value && <span className={`text-xl font-extrabold ${value.estimated ? "text-muted" : "text-gold"}`}>{value.estimated ? "≈ " : ""}{formatEur(value.value, lang)}</span>}
      </div>
      <fieldset>
        <legend className="text-xs font-semibold text-muted">{t("productsLabel")}</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {PRODUCTS.map((p) => {
            const checked = chosen.includes(p);
            const price = START_PRICE[p];
            return (
              <label key={p} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${checked ? "border-gold/60 bg-gold-soft" : "border-line"}`}>
                <input type="checkbox" checked={checked} disabled={update.isPending} className="h-4 w-4 accent-[var(--gold)]"
                  onChange={() => update.mutate({ id: lead.id, patch: { products: checked ? chosen.filter((x) => x !== p) : [...chosen, p] } })} />
                <span className="flex-1">{productLabel[p][lang]}{checked && chosen[0] === p && chosen.length > 1 ? " ★" : ""}</span>
                <span className="text-xs text-muted">{price != null ? formatEur(price, lang) : t("noStartPrice")}</span>
              </label>
            );
          })}
        </div>
        {!chosen.length && product && <p className="mt-1 text-xs text-muted">{productLabel[product.product][lang]} ({t("guessed")})</p>}
        <p className="mt-1 text-xs text-muted">{t("productsHint")}</p>
      </fieldset>
      {product && (
        <form onSubmit={submit} noValidate>
          <label htmlFor="deal-value" className="text-xs font-semibold text-muted">{t("dealValue")}</label>
          <div className="mt-1 flex gap-2">
            <input id="deal-value" inputMode="decimal" className={`field ${parsed.ok ? "" : "border-danger"}`} value={input}
              aria-invalid={!parsed.ok} aria-describedby="deal-value-hint" placeholder={startPrice != null ? String(startPrice) : ""}
              onChange={(e) => { setInput(e.target.value); setSaved(false); }} />
            <button type="submit" className="btn-primary" disabled={!parsed.ok || !changed || update.isPending}>{t("save")}</button>
          </div>
          <p id="deal-value-hint" className={`mt-1 text-xs ${parsed.ok ? "text-muted" : "text-danger"}`} role={parsed.ok ? undefined : "alert"}>
            {parsed.ok ? (saved && !changed ? t("saved") : t("dealValueHint")) : t("valueInvalid")}
          </p>
        </form>
      )}
    </div>
  );
}

const ENTRY_ICON: Record<EntryKind, LucideIcon> = { note: StickyNote, call: Phone, email: Mail };
const ENTRY_PLACEHOLDER: Record<EntryKind, DictKey> = { note: "notePlaceholder", call: "callPlaceholder", email: "emailPlaceholder" };

/** Quick entries on top; the history below is grouped by day, newest first. */
function Timeline({ lead }: { lead: Lead }) {
  const { userId } = useWorkspace();
  const { t, lang, formatDateTime, formatDate } = useI18n();
  const events = useLeadEvents(lead.id);
  const addEntry = useAddEntry(lead);
  const deleteEntry = useDeleteEntry(lead.id);
  const [kind, setKind] = useState<EntryKind>("note");
  const [body, setBody] = useState("");
  const today = isoDate(new Date());
  const days = useMemo(() => {
    const created: LeadEvent = { id: "created", lead_id: lead.id, created_at: lead.created_at, author_id: null, kind: "status", body: null, from_status: null, to_status: null };
    const groups = new Map<string, LeadEvent[]>();
    for (const event of [...(events.data ?? []), created].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      const key = dayKey(event.created_at);
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }
    return [...groups];
  }, [events.data, lead.id, lead.created_at]);
  function submit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (text) addEntry.mutate({ kind, body: text }, { onSuccess: () => setBody("") });
  }
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold">{t("history")}</h2>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex gap-1" role="group" aria-label={t("logEntry")}>
          {ENTRY_KINDS.map((k) => {
            const Icon = ENTRY_ICON[k];
            return (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${kind === k ? "bg-text text-bg" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />{entryLabel[k][lang]}
              </button>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="entry">{t("logEntry")}</label>
        <textarea id="entry" rows={3} maxLength={4000} className="field" placeholder={t(ENTRY_PLACEHOLDER[kind])} value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit" className="btn-ghost" disabled={addEntry.isPending || !body.trim()}>{t("logEntry")}</button>
        {(addEntry.isError || deleteEntry.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
      </form>
      <div className="mt-5 space-y-5">
        {days.map(([day, items]) => (
          <div key={day}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{day === today ? t("today") : formatDate(day)}</h3>
            <ol className="space-y-3 border-l border-line pl-4">
              {items.map((event) => {
                const Icon = event.id === "created" ? Mail : event.kind === "status" ? ArrowRightLeft : ENTRY_ICON[event.kind];
                return (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[1.6rem] top-0 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-muted" aria-hidden="true"><Icon className="h-3 w-3" /></span>
                    <p className="text-xs text-muted">{formatDateTime(event.created_at)}{event.kind !== "status" && ` · ${entryLabel[event.kind][lang]}`}</p>
                    {event.id === "created" ? <p className="text-sm">{t("created")}</p>
                      : event.kind === "status" ? <p className="text-sm">{t("changedStatus")}: {event.from_status ? statusLabel[event.from_status][lang] : "—"} → {event.to_status ? statusLabel[event.to_status][lang] : "—"}</p>
                      : (
                        <div className="flex items-start gap-2">
                          <p className="flex-1 whitespace-pre-wrap text-sm">{event.body}</p>
                          {event.author_id === userId && (
                            <button type="button" onClick={() => deleteEntry.mutate(event.id)} aria-label={t("deleteEntry")} title={t("deleteEntry")} className="text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </div>
                      )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
