import { Link, createFileRoute } from "@tanstack/react-router";
import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/auth";
import { customersFrom, searchCustomers } from "@/lib/crm";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/products";
import { useLeads, useTickets } from "@/lib/queries";

export const Route = createFileRoute("/customers/")({ component: CustomersPage });

function CustomersPage() {
  const { workspace } = useWorkspace();
  const { t, lang, formatDateTime } = useI18n();
  const leads = useLeads(workspace.id);
  const tickets = useTickets(workspace.id);
  const [query, setQuery] = useState("");
  const all = useMemo(() => customersFrom(leads.data ?? [], tickets.data ?? []), [leads.data, tickets.data]);
  const rows = searchCustomers(all, query);
  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-end gap-3"><h1 className="text-2xl font-bold">{t("customers")}</h1><span className="pb-1 text-sm text-muted">{rows.length} {t("results")}</span></div>
        <p className="mt-1 text-sm text-muted">{t("customersIntro")}</p>
      </div>
      <label className="relative block md:max-w-md">
        <span className="sr-only">{t("search")}</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
        <input type="search" className="field pl-9" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {(leads.isPending || tickets.isPending) && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {(leads.isError || tickets.isError) && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {leads.data && tickets.data && rows.length === 0 && <div className="card flex items-center gap-3 p-6 text-sm text-muted"><UsersRound className="h-6 w-6 text-gold" aria-hidden="true" />{t("noCustomers")}</div>}
      <ul className="space-y-2">
        {rows.slice(0, 500).map((c) => (
          <li key={c.email}>
            <Link to="/customers/$email" params={{ email: c.email }} className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-surface-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft font-bold text-gold">{(c.name[0] ?? "?").toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.name}{c.company && <span className="font-normal text-muted"> · {c.company}</span>}</span>
                <span className="block truncate text-xs text-muted">{c.email}</span>
              </span>
              <span className="text-xs text-muted">{t("customerRequests")}: <b className="text-text">{c.leads.length}</b>{c.openRequests > 0 && <> ({c.openRequests} {t("customerOpen")})</>}</span>
              <span className="text-xs text-muted">{t("customerTickets")}: <b className="text-text">{c.tickets.length}</b>{c.openTickets > 0 && <> ({c.openTickets} {t("customerOpen")})</>}</span>
              {c.wonEur > 0 && <span className="text-sm font-bold text-gold">{formatEur(c.wonEur, lang)}</span>}
              <span className="w-36 text-right text-xs text-muted">{formatDateTime(c.last)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
