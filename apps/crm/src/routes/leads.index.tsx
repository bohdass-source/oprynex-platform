import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Bookmark, Copy, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { VirtualRows } from "@/components/virtual-rows";
import { useWorkspace } from "@/lib/auth";
import { STATUSES, can, countByStatus, matchesOwner, duplicatesOf, filterLeads, type Lead, type LeadFilter, type Status } from "@/lib/crm";
import { productLabel, sourceLabel, statusLabel, useI18n } from "@/lib/i18n";
import { PRODUCTS, formatEur, leadProduct, leadProducts, leadValue, type Product } from "@/lib/products";
import { useDeleteLeads, useLeads, useTeam, useUpdateLead } from "@/lib/queries";
import { deleteView, readViews, saveView, type LeadSearch, type SavedView } from "@/lib/views";

const FILTERS: LeadFilter[] = ["open", ...STATUSES, "all"];
const SOURCES = ["contact_form", "web_form", "chat_lead", "chat_handoff", "bot_lead", "import"] as const;
const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => (allowed as readonly unknown[]).includes(value) ? (value as T) : undefined;

export const Route = createFileRoute("/leads/")({
  validateSearch: (s: Record<string, unknown>): LeadSearch => ({
    q: typeof s["q"] === "string" && s["q"].trim() ? s["q"].slice(0, 100) : undefined,
    status: pick(s["status"], FILTERS),
    product: pick(s["product"], [...PRODUCTS, "unknown"] as const),
    source: pick(s["source"], SOURCES),
    owner: typeof s["owner"] === "string" && /^(me|none|[0-9a-f-]{36})$/.test(s["owner"]) ? s["owner"] : undefined,
  }),
  component: LeadsTable,
});

type SortKey = "created_at" | "name" | "value" | "status";
const COLUMNS = "grid grid-cols-[minmax(11rem,1.6fr)_minmax(9rem,1fr)_8rem_9.5rem_9rem_minmax(7rem,0.8fr)_8.5rem] items-center gap-3 px-4";

function LeadsTable() {
  const { workspace, userId } = useWorkspace();
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const team = useTeam(workspace.id);
  const navigate = useNavigate({ from: "/leads/" });
  const leads = useLeads(workspace.id);
  const filter = (search.status ?? "open") as LeadFilter;
  const [query, setQuery] = useState(search.q ?? "");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created_at", dir: -1 });
  const [views, setViews] = useState<SavedView[]>([]);
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState("");
  useEffect(() => setViews(readViews()), []);
  useEffect(() => setQuery(search.q ?? ""), [search.q]);
  // Typing updates the address after a short pause, so a filtered view can be bookmarked or saved.
  useEffect(() => {
    const id = setTimeout(() => { if ((search.q ?? "") !== query.trim()) void navigate({ search: (prev) => ({ ...prev, q: query.trim() || undefined }), replace: true }); }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const all = leads.data ?? [];
  const removeLeads = useDeleteLeads(workspace.id);
  const spamIds = useMemo(() => all.filter((lead) => lead.status === "spam").map((lead) => lead.id), [all]);
  function deleteSpam() {
    if (window.confirm(t("deleteSpamConfirm").replace("{n}", String(spamIds.length)))) removeLeads.mutate(spamIds);
  }
  const counts = useMemo(() => countByStatus(all), [all]);
  const duplicates = useMemo(() => duplicatesOf(all), [all]);
  const rows = useMemo(() => {
    const filtered = filterLeads(all, filter, search.q ?? "").filter((lead) =>
      (!search.product || (search.product === "unknown" ? !leadProduct(lead) : (leadProducts(lead).products as string[]).includes(search.product))) && (!search.source || lead.source === search.source) && matchesOwner(lead, search.owner, userId));
    const value = (lead: Lead) => leadValue(lead)?.value ?? -1;
    const by: Record<SortKey, (a: Lead, b: Lead) => number> = {
      created_at: (a, b) => a.created_at.localeCompare(b.created_at),
      name: (a, b) => a.name.localeCompare(b.name),
      value: (a, b) => value(a) - value(b),
      status: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status),
    };
    return filtered.sort((a, b) => by[sort.key](a, b) * sort.dir);
  }, [all, filter, search.q, search.product, search.source, search.owner, userId, sort]);

  const setSearch = (patch: Partial<LeadSearch>) => void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  function storeView(event: FormEvent) {
    event.preventDefault();
    const name = viewName.trim().slice(0, 40);
    if (!name) return;
    setViews((current) => saveView(current, { name, search: { ...search, status: filter } }));
    setNaming(false);
    setViewName("");
  }
  const SortButton = ({ k, label }: { k: SortKey; label: string }) => (
    <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : k === "name" ? 1 : -1 }))}
      className="inline-flex items-center gap-1 text-left hover:text-text" aria-label={`${t("sortBy")}: ${label}`}>
      {label}{sort.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold">{t("inbox")}</h1>
        <span className="pb-1 text-sm text-muted">{rows.length} {t("results")}</span>
        {filter === "spam" && spamIds.length > 0 && can(workspace.role, "deleteLeads") && (
          <button type="button" className="btn-ghost ml-auto text-danger" onClick={deleteSpam} disabled={removeLeads.isPending}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("deleteSpam")} ({spamIds.length})</button>
        )}
        {removeLeads.isError && <p className="w-full text-sm text-danger" role="alert">{t("saveError")}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("status")}>
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setSearch({ status: f === "open" ? undefined : f })}
            className={`chip ${filter === f ? "border-gold bg-gold text-on-gold" : "border-line text-muted hover:text-text"}`}>
            {statusLabel[f][lang]} <span className="opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_11rem_11rem_11rem_auto]">
        <label className="relative block">
          <span className="sr-only">{t("search")}</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
          <input type="search" className="field pl-9" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="field" aria-label={t("product")} value={search.product ?? ""} onChange={(e) => setSearch({ product: e.target.value || undefined })}>
          <option value="">{t("allProducts")}</option>
          {[...PRODUCTS, "unknown" as const].map((p) => <option key={p} value={p}>{productLabel[p][lang]}</option>)}
        </select>
        <select className="field" aria-label={t("source")} value={search.source ?? ""} onChange={(e) => setSearch({ source: e.target.value || undefined })}>
          <option value="">{t("allSources")}</option>
          {SOURCES.map((s) => <option key={s} value={s}>{sourceLabel[s]?.[lang] ?? s}</option>)}
        </select>
        <select className="field" aria-label={t("ticketAssignee")} value={search.owner ?? ""} onChange={(e) => setSearch({ owner: e.target.value || undefined })}>
          <option value="">{t("allAssignees")}</option>
          <option value="me">{t("assignedToMe")}</option>
          <option value="none">{t("unassigned")}</option>
          {(team.data ?? []).filter((m) => m.user_id !== userId).map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
        </select>
        <button type="button" className="btn-ghost" onClick={() => setNaming((v) => !v)} aria-expanded={naming}><Bookmark className="h-4 w-4" aria-hidden="true" />{t("saveView")}</button>
      </div>

      {(naming || views.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">{t("views")}:</span>
          {views.map((view) => (
            <span key={view.name} className="inline-flex items-center rounded-full border border-line bg-surface">
              <Link to="/leads" search={view.search} className="py-1 pl-3 pr-1 text-sm font-semibold hover:text-gold">{view.name}</Link>
              <button type="button" onClick={() => setViews((current) => deleteView(current, view.name))} className="p-1.5 text-muted hover:text-danger" aria-label={`${t("deleteView")}: ${view.name}`}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {naming && (
            <form onSubmit={storeView} className="flex gap-2">
              <label className="sr-only" htmlFor="view-name">{t("viewName")}</label>
              <input id="view-name" autoFocus maxLength={40} className="field h-8 w-44 py-1" placeholder={t("viewName")} value={viewName} onChange={(e) => setViewName(e.target.value)} />
              <button type="submit" className="btn-primary h-8 py-1" disabled={!viewName.trim()}>{t("save")}</button>
            </form>
          )}
        </div>
      )}

      {leads.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {leads.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}

      {leads.isSuccess && (
        <div className="card overflow-x-auto" role="table" aria-label={t("inbox")} aria-rowcount={rows.length}>
          <div className="min-w-[66rem]">
            <div role="row" className={`${COLUMNS} border-b border-line py-3 text-xs font-semibold text-muted`}>
              <span role="columnheader"><SortButton k="name" label={t("name")} /></span>
              <span role="columnheader">{t("company")}</span>
              <span role="columnheader"><SortButton k="value" label={t("value")} /></span>
              <span role="columnheader">{t("product")}</span>
              <span role="columnheader"><SortButton k="status" label={t("status")} /></span>
              <span role="columnheader">{t("source")}</span>
              <span role="columnheader"><SortButton k="created_at" label={t("received")} /></span>
            </div>
            {rows.length === 0 ? <p className="p-6 text-sm text-muted">{t("empty")}</p> : (
              <VirtualRows items={rows} rowHeight={60} maxHeight="calc(100dvh - 22rem)" getKey={(lead) => lead.id}
                render={(lead) => <Row lead={lead} duplicate={duplicates.has(lead.id)} workspaceId={workspace.id} />} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ lead, duplicate, workspaceId }: { lead: Lead; duplicate: boolean; workspaceId: string }) {
  const { t, lang, formatDateTime } = useI18n();
  const update = useUpdateLead(workspaceId);
  const product = leadProduct(lead);
  const value = leadValue(lead);
  return (
    <div role="row" className={`${COLUMNS} h-full border-b border-line text-sm hover:bg-surface-2/50`}>
      <span role="cell" className="min-w-0">
        <Link to="/leads/$id" params={{ id: lead.id }} className="block truncate font-semibold hover:text-gold">{lead.name}</Link>
        <span className="flex items-center gap-1 truncate text-xs text-muted">
          {duplicate && <span title={t("duplicate")} className="shrink-0 text-gold"><Copy className="h-3 w-3" aria-hidden="true" /><span className="sr-only">{t("duplicate")}</span></span>}{lead.email}
        </span>
      </span>
      <span role="cell" className="truncate text-muted">{lead.company ?? "—"}</span>
      <span role="cell" className={value?.estimated ? "text-muted" : "font-semibold"} title={value?.estimated ? t("estimated") : undefined}>
        {value ? `${value.estimated ? "≈ " : ""}${formatEur(value.value, lang)}` : "—"}
      </span>
      <span role="cell">
        <select aria-label={`${t("product")}: ${lead.name}`} value={lead.product ?? ""} disabled={update.isPending}
          onChange={(e) => { const main = e.target.value as Product | ""; const rest = (lead.products ?? []).slice(1).filter((x) => x !== main); update.mutate({ id: lead.id, patch: { products: main ? [main, ...rest] : rest } }); }}
          className={`w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-sm hover:border-line ${lead.product ? "" : "italic text-muted"}`}>
          <option value="">{product ? `~ ${productLabel[product.product][lang]}` : productLabel.unknown[lang]}</option>
          {PRODUCTS.map((p) => <option key={p} value={p}>{productLabel[p][lang]}</option>)}
        </select>
        {(lead.products?.length ?? 0) > 1 && <span className="block px-1 text-xs text-muted">{t("moreProducts").replace("{n}", String(lead.products!.length - 1))}</span>}
      </span>
      <span role="cell">
        <select aria-label={`${t("status")}: ${lead.name}`} value={lead.status} disabled={update.isPending}
          onChange={(e) => update.mutate({ id: lead.id, patch: { status: e.target.value as Status } })}
          className="w-full rounded-md border border-line bg-surface-2 px-1.5 py-1 text-sm font-semibold">
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s][lang]}</option>)}
        </select>
      </span>
      <span role="cell" className="truncate text-xs text-muted">{sourceLabel[lead.source]?.[lang] ?? lead.source} · {lead.language.toUpperCase()}</span>
      <span role="cell" className="text-xs text-muted">{formatDateTime(lead.created_at)}</span>
    </div>
  );
}
