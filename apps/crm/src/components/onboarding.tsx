import { Link } from "@tanstack/react-router";
import { Bell, Check, FileUp, Globe, Users, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ONBOARDING_STEPS, can, onboardingDone, type OnboardingStep, type Workspace } from "@/lib/crm";
import { useI18n, type DictKey } from "@/lib/i18n";
import { pushIsOn } from "@/lib/push-client";
import { useForms, useInvites, useLeads, useSites, useTeam } from "@/lib/queries";

const HIDDEN = "oprynex-onboarding-hidden-";

const STEP: Record<OnboardingStep, { icon: LucideIcon; title: DictKey; text: DictKey; to?: "/forms" | "/team" | "/import" }> = {
  form: { icon: Globe, title: "onbFormTitle", text: "onbFormText", to: "/forms" },
  team: { icon: Users, title: "onbTeamTitle", text: "onbTeamText", to: "/team" },
  data: { icon: FileUp, title: "onbDataTitle", text: "onbDataText", to: "/import" },
  push: { icon: Bell, title: "onbPushTitle", text: "onbPushText" },
};

/** The first steps of a company, for owners and admins: it disappears once everything is done or when hidden. */
export function OnboardingCard({ workspace }: { workspace: Workspace }) {
  const { t } = useI18n();
  const admin = can(workspace.role, "inviteMembers");
  const forms = useForms(workspace.id);
  const sites = useSites(workspace.id);
  const team = useTeam(workspace.id);
  const invites = useInvites(workspace.id, admin);
  const leads = useLeads(workspace.id);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(HIDDEN + workspace.id) === "1"; } catch { return false; } });
  if (workspace.plan === "internal" || !admin || hidden || !forms.data || !sites.data || !team.data || !leads.data) return null;
  const done = onboardingDone({ forms: forms.data.length, sites: sites.data.length, members: team.data.length, invites: invites.data?.length ?? 0, leads: leads.data.length, push: pushIsOn() });
  const count = ONBOARDING_STEPS.filter((step) => done[step]).length;
  if (count === ONBOARDING_STEPS.length) return null;
  function hide() {
    try { localStorage.setItem(HIDDEN + workspace.id, "1"); } catch { /* storage blocked: hidden until the page reloads */ }
    setHidden(true);
  }
  return (
    <section className="card p-5 lg:col-span-12" aria-labelledby="onboarding-title">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 id="onboarding-title" className="text-lg font-bold">{t("onbTitle")}</h2>
          <p className="text-xs text-muted">{t("onbSub").replace("{done}", String(count)).replace("{all}", String(ONBOARDING_STEPS.length))}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={hide}><X className="h-4 w-4" aria-hidden="true" />{t("onbHide")}</button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(count / ONBOARDING_STEPS.length) * 100}%` }} />
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ONBOARDING_STEPS.map((step) => {
          const { icon: Icon, title, text, to } = STEP[step];
          return (
            <li key={step} className={`flex gap-3 rounded-xl border p-3 ${done[step] ? "border-line opacity-70" : "border-gold/50"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${done[step] ? "bg-surface text-muted" : "bg-gold-soft text-gold"}`}>
                {done[step] ? <Check className="h-4 w-4" aria-label="✓" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${done[step] ? "line-through" : ""}`}>{t(title)}</span>
                <span className="block text-xs text-muted">{t(text)}</span>
                {!done[step] && to && <Link to={to} className="mt-1 inline-block text-xs font-semibold text-gold hover:underline">{t("onbGo")}</Link>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
