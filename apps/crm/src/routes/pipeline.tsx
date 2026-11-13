import { Link, createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { STAGE_COLOR } from "@/components/status-pill";
import { useWorkspace } from "@/lib/auth";
import { BOARD_STATUSES, replyMailto, type Lead, type Status } from "@/lib/crm";
import { productLabel, statusLabel, useI18n } from "@/lib/i18n";
import { PRODUCT_COLOR, formatEur, leadProduct, leadValue } from "@/lib/products";
import { useLeads, useUpdateLead } from "@/lib/queries";

export const Route = createFileRoute("/pipeline")({ component: Pipeline });

const DRAG_TYPE = "application/x-oprynex-lead";

function Pipeline() {
  const { workspace } = useWorkspace();
  const { t, lang } = useI18n();
  const leads = useLeads(workspace.id);
  const update = useUpdateLead(workspace.id);
  const [over, setOver] = useState<Status | null>(null);
  const columns = useMemo(() => {
    const byStatus = Object.fromEntries(BOARD_STATUSES.map((s) => [s, [] as Lead[]])) as Record<Status, Lead[]>;
    for (const lead of leads.data ?? []) byStatus[lead.status]?.push(lead);
    return byStatus;
  }, [leads.data]);

  const move = (lead: Pick<Lead, "id" | "status">, status: Status) => { if (lead.status !== status) update.mutate({ id: lead.id, patch: { status } }); };
  function drop(event: DragEvent, status: Status) {
    event.preventDefault();
    setOver(null);
    const id = event.dataTransfer.getData(DRAG_TYPE);
    const lead = leads.data?.find((l) => l.id === id);
    if (lead) move(lead, status);
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("pipeline")}</h1>
        <p className="text-sm text-muted">{t("boardHint")}</p>
      </div>
      {leads.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {leads.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {update.isError && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
      {leads.isSuccess && (
        <div className="relative -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
          {BOARD_STATUSES.map((status) => {
            const items = columns[status];
            const total = items.reduce((sum, lead) => sum + (leadValue(lead)?.value ?? 0), 0);
            return (
              <section key={status} aria-label={statusLabel[status][lang]}
                onDragOver={(e) => { if (e.dataTransfer.types.includes(DRAG_TYPE)) { e.preventDefault(); setOver(status); } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                onDrop={(e) => drop(e, status)}
                className={`flex w-72 shrink-0 snap-start flex-col xl:w-auto xl:min-w-56 xl:flex-1 xl:shrink rounded-2xl border bg-surface/60 p-3 transition-colors ${over === status ? "border-gold bg-gold-soft/40" : "border-line"}`}>
                <header className="mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[status] }} aria-hidden="true" />
                    <h2 className="font-bold">{statusLabel[status][lang]}</h2>
                    <span className="ml-auto rounded-full bg-surface-2 px-2 text-xs font-bold">{items.length}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatEur(total, lang)}</p>
                </header>
                <ul className="flex min-h-24 flex-1 flex-col gap-2">
                  {items.map((lead) => <BoardCard key={lead.id} lead={lead} onMove={(s) => move(lead, s)} />)}
                  {items.length === 0 && <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-line p-4 text-xs text-muted">{t("dropHere")}</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BoardCard({ lead, onMove }: { lead: Lead; onMove: (status: Status) => void }) {
  const { t, lang, formatDateTime } = useI18n();
  const { workspace } = useWorkspace();
  const product = leadProduct(lead);
  const value = leadValue(lead);
  return (
    <li draggable onDragStart={(e) => { e.dataTransfer.setData(DRAG_TYPE, lead.id); e.dataTransfer.effectAllowed = "move"; }}
      className="relative cursor-grab rounded-xl border border-line bg-surface p-3 shadow-sm transition-colors hover:border-gold/60 active:cursor-grabbing">
      <Link to="/leads/$id" params={{ id: lead.id }} className="block font-semibold hover:text-gold" aria-label={`${t("openRequest")}: ${lead.name}`}>{lead.name}</Link>
      {lead.company && <p className="truncate text-xs text-muted">{lead.company}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {product && (
          <span className={`rounded-md px-1.5 py-0.5 font-semibold ${product.guessed ? "italic" : ""}`}
            style={{ color: PRODUCT_COLOR[product.product], background: `color-mix(in srgb, ${PRODUCT_COLOR[product.product]} 14%, transparent)` }}>
            {productLabel[product.product][lang]}
          </span>
        )}
        {(lead.products?.length ?? 0) > 1 && <span className="text-muted">{t("moreProducts").replace("{n}", String(lead.products!.length - 1))}</span>}
        {value && <span className={value.estimated ? "text-muted" : "font-bold"}>{value.estimated ? "≈ " : ""}{formatEur(value.value, lang)}</span>}
      </div>
      <p className="mt-2 text-[11px] text-muted">{formatDateTime(lead.created_at)}</p>
      <div className="mt-2 flex items-center gap-1.5 border-t border-line pt-2">
        <label className="sr-only" htmlFor={`move-${lead.id}`}>{t("moveTo")}</label>
        <select id={`move-${lead.id}`} value={lead.status} onChange={(e) => onMove(e.target.value as Status)}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface-2 px-1.5 py-1 text-xs font-semibold">
          {BOARD_STATUSES.map((s) => <option key={s} value={s}>{t("moveTo")}: {statusLabel[s][lang]}</option>)}
          <option value="spam">{t("moveTo")}: {statusLabel.spam[lang]}</option>
        </select>
        <a href={replyMailto(lead, workspace.name)} className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted hover:text-text" aria-label={`${t("reply")}: ${lead.name}`} title={t("reply")}>
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}
