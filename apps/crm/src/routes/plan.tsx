import { createFileRoute } from "@tanstack/react-router";
import { Check, Mail } from "lucide-react";
import { useWorkspace } from "@/lib/auth";
import { CLOUD_PLANS, PLANS, planRequestMailto, seatLimit, trialDaysLeft, type CloudPlan } from "@/lib/crm";
import { useI18n } from "@/lib/i18n";
import { useTeam } from "@/lib/queries";

export const Route = createFileRoute("/plan")({ component: PlanPage });

/** The company's plan, seats and status, the three plans side by side, and how to continue or switch (by email for now). */
function PlanPage() {
  const { workspace } = useWorkspace();
  const { t, lang, formatDate } = useI18n();
  const team = useTeam(workspace.id);
  const euro = new Intl.NumberFormat(lang === "en" ? "en-GB" : lang === "ru" ? "ru-RU" : "de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const plan = workspace.plan;
  const limit = seatLimit(plan);
  const days = trialDaysLeft(workspace);
  const status = workspace.status === "paused" ? t("planPausedNote")
    : workspace.status === "trial" && workspace.trial_ends_at ? `${t("planTrialUntil").replace("{date}", formatDate(workspace.trial_ends_at.slice(0, 10)))}${days !== null && days >= 0 ? ` · ${t("trialLeft").replace("{n}", String(days))}` : ""}`
    : t("planActive");
  const features = (p: CloudPlan) => [
    t("planRequestsTickets"),
    t("usersUpTo").replace("{n}", String(CLOUD_PLANS[p].users)),
    ...(CLOUD_PLANS[p].roles ? [t("planRoles")] : []),
    ...(CLOUD_PLANS[p].integrations ? [t("planIntegrations")] : []),
  ];

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("plan")}</h1>
        <p className="mt-1 text-sm text-muted">{t("planIntro")}</p>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-muted">{t("planCurrent")}</p>
          <p className="mt-1 text-2xl font-bold capitalize">{plan === "internal" ? "Oprynex" : plan}</p>
          {plan !== "internal" && <p className="text-sm text-muted">{t("planPerMonth").replace("{price}", euro.format(CLOUD_PLANS[plan].price))}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted">{t("status")}</p>
          <p className={`mt-1 text-sm ${workspace.status === "paused" || (days !== null && days < 0) ? "font-semibold text-danger" : ""}`} role="status">
            {plan === "internal" ? t("planInternalNote") : days !== null && days < 0 ? t("trialEnded") : status}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted">{t("team")}</p>
          <p className="mt-1 text-sm">{limit === null ? team.data?.length ?? "…" : t("planSeatsUsed").replace("{used}", String(team.data?.length ?? "…")).replace("{max}", String(limit))}</p>
        </div>
      </div>

      {plan !== "internal" && (
        <>
          <h2 className="text-lg font-bold">{t("planCompare")}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => {
              const mine = p === plan;
              return (
                <li key={p} className={`card flex flex-col gap-3 p-5 ${mine ? "ring-2 ring-gold" : ""}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="flex-1 text-lg font-bold capitalize">{p}</h3>
                    {mine && <span className="chip border-gold text-gold">{t("planYours")}</span>}
                  </div>
                  <p className="text-sm"><b className="text-xl">{euro.format(CLOUD_PLANS[p].price)}</b> <span className="text-muted">{t("perMonthNet")}</span></p>
                  <ul className="flex-1 space-y-1.5 text-sm">
                    {features(p).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />{f}</li>)}
                  </ul>
                  <a href={planRequestMailto(workspace.name, p, t("planMailSubject"))} className={mine ? "btn-primary justify-center" : "btn-ghost justify-center"}>
                    <Mail className="h-4 w-4" aria-hidden="true" />{mine ? t("planContinue") : t("planChoose")}
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted">{t("planHow")}</p>
        </>
      )}
    </section>
  );
}
