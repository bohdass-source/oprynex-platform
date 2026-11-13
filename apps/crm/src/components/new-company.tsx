import { Building2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CLOUD_PLANS, PLANS, type CloudPlan } from "@/lib/crm";
import { useI18n } from "@/lib/i18n";
import { usePlatformChange } from "@/lib/queries";

/** Oprynex admins set up a client's company: name, plan, trial and the client's email, invited as owner. */
export function NewCompany() {
  const { t } = useI18n();
  const { create } = usePlatformChange();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<CloudPlan>("team");
  const [email, setEmail] = useState("");
  const [trialDays, setTrialDays] = useState(14);
  const [done, setDone] = useState<string | null>(null);
  const valid = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    create.mutate({ name: name.trim(), plan, email: email.trim().toLowerCase(), trialDays }, {
      onSuccess: () => { setDone(email.trim().toLowerCase()); setName(""); setEmail(""); },
    });
  }

  const label = "block text-xs font-semibold text-muted";
  return (
    <form onSubmit={submit} noValidate className="card space-y-3 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-gold" aria-hidden="true" />{t("newCompanyTitle")}</h2>
      <p className="text-sm text-muted">{t("newCompanyText")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>{t("newCompanyName")}
          <input className="field mt-1" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Praxis Weber" />
        </label>
        <label className={label}>{t("newCompanyEmail")}
          <input className="field mt-1" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="inhaber@praxis-weber.de" />
        </label>
        <label className={label}>{t("plan")}
          <select className="field mt-1" value={plan} onChange={(e) => setPlan(e.target.value as CloudPlan)}>
            {PLANS.map((p) => <option key={p} value={p}>{`${p[0]!.toUpperCase()}${p.slice(1)} · ${CLOUD_PLANS[p].price} € · ${t("usersUpTo").replace("{n}", String(CLOUD_PLANS[p].users))}`}</option>)}
          </select>
        </label>
        <label className={label}>{t("newCompanyTrial")}
          <select className="field mt-1" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))}>
            {[14, 30, 0].map((d) => <option key={d} value={d}>{d === 0 ? t("newCompanyNoTrial") : t("supportDays").replace("{n}", String(d))}</option>)}
          </select>
        </label>
      </div>
      {create.isError && <p className="text-sm text-danger" role="alert">{t("newCompanyFailed")}</p>}
      {done && !create.isError && <p className="text-sm" role="status">{t("newCompanyDone").replace("{email}", done)}</p>}
      <button type="submit" className="btn-primary" disabled={!valid || create.isPending}>{t("newCompanyCreate")}</button>
    </form>
  );
}
