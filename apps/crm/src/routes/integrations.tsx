import { Link, createFileRoute } from "@tanstack/react-router";
import { Bot, FileUp, Globe, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useWorkspace } from "@/lib/auth";
import { can, hasIntegrations } from "@/lib/crm";
import { useI18n } from "@/lib/i18n";
import { useBots, useForms, useLeads, useSites } from "@/lib/queries";

export const Route = createFileRoute("/integrations")({ component: IntegrationsPage });

function Tile({ icon: Icon, title, text, badge, locked = false, children }: { icon: typeof Bot; title: string; text: string; badge: string; locked?: boolean; children?: ReactNode }) {
  return (
    <div className={`card flex flex-col gap-3 p-5 ${locked ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">{locked ? <Lock className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{text}</p>
        </div>
        <span className={`chip ${locked ? "border-line text-muted" : "border-gold text-gold"}`}>{badge}</span>
      </div>
      {children}
    </div>
  );
}

function IntegrationsPage() {
  const { workspace } = useWorkspace();
  const { t } = useI18n();
  const sites = useSites(workspace.id);
  const bots = useBots(workspace.id);
  const leads = useLeads(workspace.id);
  const allowed = hasIntegrations(workspace);
  const admin = can(workspace.role, "manageBots");
  const forms = useForms(workspace.id);
  const fromSite = (id: string) => (leads.data ?? []).filter((lead) => lead.site_id === id).length;
  const fromForm = (id: string) => (leads.data ?? []).filter((lead) => lead.form_id === id).length;
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("integrations")}</h1>
        <p className="mt-1 text-sm text-muted">{t("integrationsIntro")}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Tile icon={Globe} title={t("intForms")} text={t("intFormsText")} badge={t("intActive")}>
          {forms.data && sites.data && forms.data.length + sites.data.length === 0 && <p className="text-sm text-muted">{t("intFormsNone")}</p>}
          <ul className="divide-y divide-line">
            {(forms.data ?? []).map((form) => (
              <li key={form.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold">{form.name}</span>
                <span className={`chip ${form.enabled ? "border-gold text-gold" : "border-line text-muted"}`}>{form.enabled ? t("botOn") : t("botOff")}</span>
                <span className="text-xs text-muted">{t("formLeads")}: <b className="text-text">{fromForm(form.id)}</b></span>
              </li>
            ))}
            {(sites.data ?? []).map((site) => (
              <li key={site.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold">{site.name}</span>
                {site.url && <a href={site.url} target="_blank" rel="noopener" className="truncate text-muted underline">{site.url.replace(/^https:\/\//, "")}</a>}
                <span className="chip border-line text-muted">{t("intFormsByOprynex")}</span>
                <span className="text-xs text-muted">{t("formLeads")}: <b className="text-text">{fromSite(site.id)}</b></span>
              </li>
            ))}
          </ul>
          <Link to="/forms" className="btn-ghost self-start">{t("intFormsManage")}</Link>
        </Tile>

        <Tile icon={Bot} title={t("intBots")} text={allowed ? t("intBotsText") : t("intLockedText")} badge={allowed ? t("intActive") : t("intLocked")} locked={!allowed}>
          {allowed && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">{t("bots")}: <b className="text-text">{bots.data?.length ?? 0}</b> · {t("botOn")}: <b className="text-text">{(bots.data ?? []).filter((b) => b.enabled).length}</b></span>
              <Link to="/bots" className="btn-ghost ml-auto">{t("intOpen")}</Link>
            </div>
          )}
        </Tile>

        <Tile icon={FileUp} title={t("intImport")} text={t("intImportText")} badge={t("intActive")}>
          {admin ? <Link to="/import" className="btn-ghost self-start">{t("intOpen")}</Link> : <p className="text-xs text-muted">{t("intAdminOnly")}</p>}
        </Tile>
      </div>
    </section>
  );
}
