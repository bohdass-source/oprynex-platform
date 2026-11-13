import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, UserPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useWorkspace } from "@/lib/auth";
import { PERMISSIONS, ROLES, can, rolesForPlan, seatLimit, type Role } from "@/lib/crm";
import { permissionLabel, roleLabel, useI18n, type DictKey } from "@/lib/i18n";
import { useInvites, useTeam, useTeamChange, type TeamMember } from "@/lib/queries";

export const Route = createFileRoute("/team")({ component: TeamPage });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Postgres raises 23514 from the keep-an-owner trigger, 23505 for an address that is already invited and the plan triggers of 0107 by name. */
const errorText = (error: unknown): DictKey => {
  const { code, message = "" } = (error as { code?: string; message?: string } | null) ?? {};
  if (message.includes("plan_user_limit")) return "seatsFull";
  if (message.includes("plan_no_admin")) return "planNoAdmin";
  return code === "23514" ? "ownerNeeded" : code === "23505" ? "alreadyInvited" : "saveError";
};

function TeamPage() {
  const { workspace, userId } = useWorkspace();
  const { t, lang, formatDate } = useI18n();
  const team = useTeam(workspace.id);
  const isAdmin = can(workspace.role, "inviteMembers");
  const invites = useInvites(workspace.id, isAdmin);
  const change = useTeamChange(workspace.id);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [touched, setTouched] = useState(false);
  const cleanEmail = email.trim().toLowerCase();
  const emailOk = EMAIL.test(cleanEmail) && cleanEmail.length <= 255;
  const failed = [change.invite, change.cancelInvite, change.setRole, change.remove].find((m) => m.isError);

  function invite(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!emailOk) return;
    change.invite.mutate({ email: cleanEmail, role }, { onSuccess: () => { setEmail(""); setTouched(false); } });
  }
  const canRemove = (member: TeamMember) => member.user_id !== userId && (workspace.role === "owner" || (isAdmin && member.role === "member"));
  const allowed = rolesForPlan(workspace.plan, ROLES);
  const roleChoices = workspace.role === "owner" ? allowed : allowed.filter((r) => r !== "owner");
  const limit = seatLimit(workspace.plan);
  const used = (team.data?.length ?? 0) + (invites.data?.length ?? 0);
  const full = limit !== null && used >= limit;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("team")}</h1>
        <p className="mt-1 text-sm text-muted">{t("teamIntro")}</p>
        {limit !== null && team.data && <p className="mt-1 text-sm font-semibold">{t("seats").replace("{used}", String(used)).replace("{max}", String(limit))}</p>}
      </div>
      {failed && <p className="text-sm text-danger" role="alert">{t(errorText(failed.error))}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-bold">{t("members")}</h2>
          {team.isPending && <p className="mt-3 text-sm text-muted" role="status">{t("loading")}</p>}
          {team.isError && <p className="mt-3 text-sm text-danger" role="alert">{t("loadError")}</p>}
          <ul className="mt-3 divide-y divide-line">
            {(team.data ?? []).map((member) => (
              <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft font-bold text-gold">{(member.email[0] ?? "?").toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{member.email}{member.user_id === userId && <span className="font-normal text-muted"> ({t("you")})</span>}</span>
                  <span className="text-xs text-muted">{t("since")} {formatDate(member.created_at.slice(0, 10))}</span>
                </span>
                {workspace.role === "owner" ? (
                  <select className="field h-9 w-auto py-1" aria-label={`${t("role")}: ${member.email}`} value={member.role} disabled={change.setRole.isPending}
                    onChange={(e) => change.setRole.mutate({ userId: member.user_id, role: e.target.value as Role })}>
                    {rolesForPlan(workspace.plan, ROLES).concat(member.role === "admin" && workspace.plan === "start" ? ["admin"] : []).map((r) => <option key={r} value={r}>{roleLabel[r][lang]}</option>)}
                  </select>
                ) : <span className="chip border-line text-muted">{roleLabel[member.role][lang]}</span>}
                {canRemove(member) && (
                  <button type="button" className="rounded-md p-1.5 text-muted hover:text-danger" disabled={change.remove.isPending}
                    onClick={() => change.remove.mutate(member.user_id)} aria-label={`${t("removeMember")}: ${member.email}`} title={t("removeMember")}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isAdmin && (
          <div className="card p-5">
            <h2 className="text-sm font-bold">{t("invite")}</h2>
            <form onSubmit={invite} noValidate className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="sr-only" htmlFor="invite-email">{t("email")}</label>
              <input id="invite-email" type="email" className="field" placeholder="name@firma.de" value={email} autoComplete="off"
                aria-invalid={touched && !emailOk} aria-describedby="invite-hint"
                onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(email !== "")} />
              <select className="field w-auto" aria-label={t("role")} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {roleChoices.map((r) => <option key={r} value={r}>{roleLabel[r][lang]}</option>)}
              </select>
              <button type="submit" className="btn-primary" disabled={change.invite.isPending || full}><UserPlus className="h-4 w-4" aria-hidden="true" />{t("invite")}</button>
            </form>
            {touched && !emailOk && <p className="mt-1 text-xs text-danger">{t("invalidEmail")}</p>}
            {full && <p className="mt-1 text-xs text-muted">{t("seatsFull")}</p>}
            <p id="invite-hint" className="mt-2 text-xs text-muted">{t("inviteHint")}</p>
            <h3 className="mt-5 text-xs font-semibold text-muted">{t("invites")}</h3>
            {(invites.data ?? []).length === 0 && !invites.isPending && <p className="mt-2 text-sm text-muted">{t("noInvites")}</p>}
            <ul className="mt-2 divide-y divide-line">
              {(invites.data ?? []).map((inv) => (
                <li key={inv.email} className="flex items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{inv.email}</span>
                  <span className="chip border-line text-muted">{roleLabel[inv.role][lang]}</span>
                  <button type="button" className="rounded-md p-1.5 text-muted hover:text-danger" onClick={() => change.cancelInvite.mutate(inv.email)}
                    aria-label={`${t("cancelInvite")}: ${inv.email}`} title={t("cancelInvite")}><X className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold">{t("permissions")}</h2>
        <p className="mt-1 text-xs text-muted">{t("permissionsHint")}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <thead><tr className="border-b border-line text-xs text-muted">
              <th className="py-2 pr-3 text-left font-semibold" scope="col"><span className="sr-only">{t("permissions")}</span></th>
              {ROLES.map((r) => <th key={r} scope="col" className={`w-[4.5rem] py-2 text-center text-[11px] hyphens-auto break-words sm:w-28 sm:text-xs font-semibold ${r === workspace.role ? "text-gold" : ""}`}>{roleLabel[r][lang]}</th>)}
            </tr></thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-line">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">{permissionLabel[p][lang]}</th>
                  {ROLES.map((r) => (
                    <td key={r} className="py-2 text-center">
                      {can(r, p) ? <Check className="mx-auto h-4 w-4 text-ok" role="img" aria-label={t("allowed")} /> : <Minus className="mx-auto h-4 w-4 text-muted" role="img" aria-label={t("notAllowed")} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
