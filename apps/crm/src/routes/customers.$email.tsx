import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Inbox, LifeBuoy, Mail } from "lucide-react";
import { useMemo } from "react";
import { StatusPill } from "@/components/status-pill";
import { useWorkspace } from "@/lib/auth";
import { customersFrom } from "@/lib/crm";
import { priorityLabel, ticketStatusLabel, useI18n } from "@/lib/i18n";
import { formatEur, leadValue } from "@/lib/products";
import { useLeads, useTickets } from "@/lib/queries";

export const Route = createFileRoute("/customers/$email")({ component: CustomerPage });

function CustomerPage() {
  const { email } = Route.useParams();
  const { workspace } = useWorkspace();
  const { t, lang, formatDateTime } = useI18n();
  const leads = useLeads(workspace.id);
  const tickets = useTickets(workspace.id);
  const customer = useMemo(() => customersFrom(leads.data ?? [], tickets.data ?? []).find((c) => c.email === email.toLowerCase()), [leads.data, tickets.data, email]);
  const loading = leads.isPending || tickets.isPending;
  return (
    <section>
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("backToCustomers")}</Link>
      {loading && <p className="mt-6 text-sm text-muted" role="status">{t("loading")}</p>}
      {(leads.isError || tickets.isError) && <p className="mt-6 text-sm text-danger" role="alert">{t("loadError")}</p>}
      {!loading && !customer && <p className="mt-6 text-sm text-muted">{t("notFound")}</p>}
      {customer && (
        <div className="mt-4 space-y-5">
          <div className="card flex flex-wrap items-start gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-soft text-lg font-bold text-gold">{(customer.name[0] ?? "?").toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              {customer.company && <p className="text-sm">{customer.company}</p>}
              <a href={`mailto:${customer.email}`} className="break-all text-sm text-muted underline">{customer.email}</a>
            </div>
            <a href={`mailto:${customer.email}`} className="btn-primary"><Mail className="h-4 w-4" aria-hidden="true" />{t("reply")}</a>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-muted">{t("customerSince")}</p><p className="mt-1 font-bold">{formatDateTime(customer.first)}</p></div>
            <div className="card p-4"><p className="text-xs text-muted">{t("customerLast")}</p><p className="mt-1 font-bold">{formatDateTime(customer.last)}</p></div>
            <div className="card p-4"><p className="text-xs text-muted">{t("customerRequests")} / {t("customerTickets")}</p><p className="mt-1 text-2xl font-bold">{customer.leads.length} / {customer.tickets.length}</p></div>
            <div className="card p-4"><p className="text-xs text-muted">{t("customerWon")}</p><p className="mt-1 text-2xl font-bold text-gold">{formatEur(customer.wonEur, lang)}</p></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold"><Inbox className="h-4 w-4" aria-hidden="true" />{t("customerRequests")}</h2>
              <ul className="mt-3 divide-y divide-line">
                {customer.leads.map((lead) => {
                  const value = leadValue(lead);
                  return (
                    <li key={lead.id}><Link to="/leads/$id" params={{ id: lead.id }} className="flex flex-wrap items-center gap-2 py-2.5 hover:text-gold">
                      <span className="min-w-0 flex-1 truncate text-sm">{lead.message.split("\n")[0] || "—"}</span>
                      {value && <span className="text-xs text-muted">{value.estimated ? "≈ " : ""}{formatEur(value.value, lang)}</span>}
                      <StatusPill status={lead.status} />
                      <span className="w-full text-xs text-muted">{formatDateTime(lead.created_at)}</span>
                    </Link></li>
                  );
                })}
              </ul>
              {customer.leads.length === 0 && <p className="mt-3 text-sm text-muted">—</p>}
            </div>
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold"><LifeBuoy className="h-4 w-4" aria-hidden="true" />{t("customerTickets")}</h2>
              <ul className="mt-3 divide-y divide-line">
                {customer.tickets.map((ticket) => (
                  <li key={ticket.id}><Link to="/tickets/$id" params={{ id: ticket.id }} className="flex flex-wrap items-center gap-2 py-2.5 hover:text-gold">
                    <span className="text-xs text-muted tabular-nums">#{ticket.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{ticket.subject}</span>
                    <span className="chip border-line">{priorityLabel[ticket.priority][lang]}</span>
                    <span className="chip border-line">{ticketStatusLabel[ticket.status][lang]}</span>
                    <span className="w-full text-xs text-muted">{formatDateTime(ticket.updated_at)}</span>
                  </Link></li>
                ))}
              </ul>
              {customer.tickets.length === 0 && <p className="mt-3 text-sm text-muted">—</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
