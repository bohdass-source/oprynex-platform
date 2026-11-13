import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useI18n, type DictKey } from "@/lib/i18n";

type Check = { id: "site" | "database" | "engine" | "engineDb" | "push"; ok: boolean; ms: number | null };

const LABEL: Record<Check["id"], { name: DictKey; fix: DictKey }> = {
  site: { name: "statusSite", fix: "statusSiteFix" },
  database: { name: "statusDatabase", fix: "statusDatabaseFix" },
  engine: { name: "statusEngine", fix: "statusEngineFix" },
  engineDb: { name: "statusEngineDb", fix: "statusEngineDbFix" },
  push: { name: "statusPush", fix: "statusPushFix" },
};

/** Whether the site, database, bot engine, its database connection and the push key work, checked by the CRM server. */
export function StatusPanel() {
  const { t } = useI18n();
  const status = useQuery({
    queryKey: ["platform-status"],
    queryFn: async () => {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as { checks: Check[] };
    },
    staleTime: 60_000,
  });
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-lg font-bold">{t("statusTitle")}</h2>
        <button type="button" className="btn-ghost" onClick={() => void status.refetch()} disabled={status.isFetching}>
          <RefreshCw className={`h-4 w-4 ${status.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />{t("statusRefresh")}
        </button>
      </div>
      {status.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {status.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {status.data && (
        <ul className="divide-y divide-line">
          {status.data.checks.map((check) => (
            <li key={check.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-sm">
              <span className={`chip ${check.ok ? "border-ok text-ok" : "border-danger text-danger"}`}>{check.ok ? t("statusOk") : t("statusDown")}</span>
              <span className="min-w-0 flex-1 font-semibold">{t(LABEL[check.id].name)}</span>
              {check.ms !== null && <span className="text-xs tabular-nums text-muted">{check.ms} ms</span>}
              {!check.ok && <p className="w-full text-xs text-muted">{t(LABEL[check.id].fix)}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
