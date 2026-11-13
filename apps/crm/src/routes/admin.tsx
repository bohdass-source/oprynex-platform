import { createFileRoute } from "@tanstack/react-router";
import { NewCompany } from "@/components/new-company";
import { StatusPanel } from "@/components/status-panel";
import { useState } from "react";
import { PLANS, type Plan, type WorkspaceStatus } from "@/lib/crm";
import { useI18n, type DictKey } from "@/lib/i18n";
import { usePlatformChange, usePlatformSettings, usePlatformWorkspaces, type PlatformWorkspace } from "@/lib/queries";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const ALL_PLANS: Plan[] = ["internal", ...PLANS];
const STATUSES: WorkspaceStatus[] = ["trial", "active", "paused"];
const statusKey: Record<WorkspaceStatus, DictKey> = { trial: "statusTrial", active: "statusActive", paused: "statusPaused" };
const planName = (plan: Plan, t: (key: DictKey) => string) => (plan === "internal" ? t("planInternal") : plan[0]!.toUpperCase() + plan.slice(1));

/** Oprynex staff only: every company, its plan, status and trial, and the switch for self sign-up. */
function AdminPage() {
  const { t } = useI18n();
  const settings = usePlatformSettings();
  const isAdmin = !!settings.data;
  const spaces = usePlatformWorkspaces(isAdmin);
  const change = usePlatformChange();

  if (settings.isPending) return <p className="text-sm text-muted" role="status">{t("loading")}</p>;
  if (!isAdmin) return <p className="text-sm text-muted">{t("noAccessTitle")}</p>;
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("admin")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("adminIntro")}</p>
      </div>

      <StatusPanel />

      <NewCompany />

      <div className="card flex flex-wrap items-center gap-3 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={settings.data!.signupOpen} disabled={change.setSignup.isPending}
            onChange={(e) => change.setSignup.mutate(e.target.checked)} />
          {t("signupSwitch")}
        </label>
        <p className="w-full text-xs text-muted">{t("signupSwitchHint")}</p>
      </div>

      {(change.update.isError || change.setSignup.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
      {spaces.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="p-3 font-semibold" scope="col">{t("workspace")}</th>
              <th className="p-3 font-semibold" scope="col">{t("owner")}</th>
              <th className="p-3 font-semibold" scope="col">{t("plan")}</th>
              <th className="p-3 font-semibold" scope="col">{t("status")}</th>
              <th className="p-3 font-semibold" scope="col">{t("trialEnds")}</th>
              <th className="p-3 text-right font-semibold" scope="col">{t("team")}</th>
              <th className="p-3 text-right font-semibold" scope="col">{t("requestsCount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(spaces.data ?? []).map((w) => <Row key={w.id} w={w} />)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ w }: { w: PlatformWorkspace }) {
  const { t, formatDate } = useI18n();
  const { update } = usePlatformChange();
  const [trialEnd, setTrialEnd] = useState(w.trial_ends_at?.slice(0, 10) ?? "");
  const save = (patch: Partial<Pick<PlatformWorkspace, "plan" | "status" | "trial_ends_at">>) =>
    update.mutate({ id: w.id, plan: w.plan, status: w.status, trial_ends_at: w.trial_ends_at, ...patch });
  return (
    <tr>
      <td className="p-3"><span className="font-semibold">{w.name}</span><span className="block text-xs text-muted">{formatDate(w.created_at.slice(0, 10))}</span></td>
      <td className="p-3 text-muted">{w.owner_email ?? "—"}</td>
      <td className="p-3">
        <select className="field h-9 w-auto py-1" aria-label={`${t("plan")}: ${w.name}`} value={w.plan} disabled={update.isPending} onChange={(e) => save({ plan: e.target.value as Plan })}>
          {ALL_PLANS.map((p) => <option key={p} value={p}>{planName(p, t)}</option>)}
        </select>
      </td>
      <td className="p-3">
        <select className="field h-9 w-auto py-1" aria-label={`${t("status")}: ${w.name}`} value={w.status} disabled={update.isPending} onChange={(e) => save({ status: e.target.value as WorkspaceStatus })}>
          {STATUSES.map((s) => <option key={s} value={s}>{t(statusKey[s])}</option>)}
        </select>
      </td>
      <td className="p-3">
        <input type="date" className="field h-9 w-auto py-1" aria-label={`${t("trialEnds")}: ${w.name}`} value={trialEnd} disabled={update.isPending}
          onChange={(e) => setTrialEnd(e.target.value)}
          onBlur={() => { const next = trialEnd ? new Date(`${trialEnd}T23:59:59`).toISOString() : null; if (next?.slice(0, 10) !== w.trial_ends_at?.slice(0, 10)) save({ trial_ends_at: next }); }} />
      </td>
      <td className="p-3 text-right tabular-nums">{w.members}{w.invites > 0 && <span className="text-muted"> +{w.invites}</span>}</td>
      <td className="p-3 text-right tabular-nums">{w.leads}</td>
    </tr>
  );
}
