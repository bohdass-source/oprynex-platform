import { createFileRoute } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuthActions, useWorkspace } from "@/lib/auth";
import { can } from "@/lib/crm";
import { LEAD_EXPORT_COLUMNS, TICKET_EXPORT_COLUMNS, download, readCompany, toCsv } from "@/lib/export";
import { useI18n } from "@/lib/i18n";
import { useDataChange, useRetention } from "@/lib/queries";

export const Route = createFileRoute("/data")({ component: DataPage });

const RETENTION_CHOICES = [3, 6, 12, 24, 36] as const;

/** Export, retention and deleting the company: the company's own data protection controls. */
function DataPage() {
  const { workspace } = useWorkspace();
  const { reload } = useAuthActions();
  const { t } = useI18n();
  const retention = useRetention(workspace.id);
  const change = useDataChange(workspace.id);
  const allowed = can(workspace.role, "manageData");
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "oprynex";

  async function exportAs(kind: "leads" | "tickets" | "json") {
    setBusy(kind);
    setFailed(false);
    try {
      const data = await readCompany(workspace.id);
      if (kind === "leads") download(`${slug}-anfragen-${stamp}.csv`, `﻿${toCsv(data.leads, LEAD_EXPORT_COLUMNS)}`, "text/csv;charset=utf-8");
      else if (kind === "tickets") download(`${slug}-tickets-${stamp}.csv`, `﻿${toCsv(data.tickets, TICKET_EXPORT_COLUMNS)}`, "text/csv;charset=utf-8");
      else download(`${slug}-export-${stamp}.json`, JSON.stringify({ company: workspace.name, exportedAt: new Date().toISOString(), ...data }, null, 2), "application/json");
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  function remove() {
    change.deleteCompany.mutate(confirmName, { onSuccess: () => void reload() });
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("data")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("dataIntro")}</p>
      </div>
      {!allowed && <p className="text-sm text-muted">{t("dataReadOnly")}</p>}

      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">{t("dataExport")}</h2>
        <p className="text-sm text-muted">{t("dataExportText")}</p>
        <div className="flex flex-wrap gap-2">
          {([["leads", "dataLeadsCsv"], ["tickets", "dataTicketsCsv"], ["json", "dataAllJson"]] as const).map(([kind, label]) => (
            <button key={kind} type="button" className="btn-ghost" disabled={!allowed || busy !== null} onClick={() => void exportAs(kind)}>
              <Download className="h-4 w-4" aria-hidden="true" />{busy === kind ? t("dataExporting") : t(label)}
            </button>
          ))}
        </div>
        {failed && <p className="text-sm text-danger" role="alert">{t("dataExportFailed")}</p>}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">{t("dataRetention")}</h2>
        <p className="text-sm text-muted">{t("dataRetentionText")}</p>
        <label className="block max-w-xs text-xs font-semibold text-muted">{t("dataRetention")}
          <select className="field mt-1" disabled={!allowed || retention.isPending || change.setRetention.isPending} value={retention.data ?? ""}
            onChange={(e) => change.setRetention.mutate(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t("dataKeep")}</option>
            {RETENTION_CHOICES.map((n) => <option key={n} value={n}>{t("dataMonths").replace("{n}", String(n))}</option>)}
          </select>
        </label>
        {change.setRetention.isError && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
      </div>

      <div className="card space-y-3 border-danger/40 p-5">
        <h2 className="text-lg font-bold text-danger">{t("dataDelete")}</h2>
        <p className="text-sm text-muted">{t("dataDeleteText")}</p>
        {workspace.plan === "internal" ? <p className="text-sm text-muted">{t("dataDeleteInternal")}</p>
          : workspace.role !== "owner" ? <p className="text-sm text-muted">{t("dataDeleteOwnerOnly")}</p>
          : (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); remove(); }}>
              <label className="block min-w-0 flex-1 text-xs font-semibold text-muted">{t("dataDeleteConfirm").replace("{name}", workspace.name)}
                <input className="field mt-1" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
              </label>
              <button type="submit" className="btn-ghost text-danger" disabled={confirmName !== workspace.name || change.deleteCompany.isPending}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />{t("dataDeleteButton")}
              </button>
            </form>
          )}
        {change.deleteCompany.isError && <p className="text-sm text-danger" role="alert">{t("dataDeleteFailed")}</p>}
      </div>
    </section>
  );
}
