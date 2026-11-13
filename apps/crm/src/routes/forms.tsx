import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useWorkspace } from "@/lib/auth";
import { BOT_ENGINE, BOT_LANGUAGES, FORM_PURPOSES, WEB_FORM_LIMIT, can, emptyForm, formEmbedCode, formPreviewUrl, formProblems, parseOrigins, type FormProblem, type WebForm, type WebFormDraft } from "@/lib/crm";
import { useI18n } from "@/lib/i18n";
import { useFormChange, useForms, useLeads, useTickets } from "@/lib/queries";

export const Route = createFileRoute("/forms")({ component: FormsPage });

function FormsPage() {
  const { workspace } = useWorkspace();
  const { t, lang } = useI18n();
  const forms = useForms(workspace.id);
  const leads = useLeads(workspace.id);
  const tickets = useTickets(workspace.id);
  const canEdit = can(workspace.role, "manageForms");
  const list = forms.data ?? [];
  const canCreate = canEdit && list.length < WEB_FORM_LIMIT;
  // null: nothing chosen yet, "new": the editor for a new form, otherwise a form id.
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => { if (chosen === null && list[0]) setChosen(list[0].id); }, [chosen, list]);
  const current = list.find((form) => form.id === chosen) ?? null;
  // Requests for a request form, tickets for a support form.
  const leadCount = (id: string) => (leads.data ?? []).filter((lead) => lead.form_id === id).length + (tickets.data ?? []).filter((ticket) => ticket.form_id === id).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{t("forms")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("formsIntro")}</p>
        </div>
        {canCreate && <button type="button" className="btn-primary" onClick={() => setChosen("new")}><Plus className="h-4 w-4" aria-hidden="true" />{t("newForm")}</button>}
      </div>
      {!canEdit && <p className="text-sm text-muted">{t("readOnlyForms")}</p>}
      {canEdit && list.length >= WEB_FORM_LIMIT && <p className="text-sm text-muted" role="status">{t("formLimitReached")}</p>}
      {forms.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {forms.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {forms.data && list.length === 0 && chosen !== "new" && (
        <div className="card flex flex-col items-start gap-3 p-6">
          <FileText className="h-8 w-8 text-gold" aria-hidden="true" />
          <p className="text-sm">{t("noForms")}</p>
          {canCreate && <button type="button" className="btn-primary" onClick={() => setChosen("new")}><Plus className="h-4 w-4" aria-hidden="true" />{t("newForm")}</button>}
        </div>
      )}

      {(list.length > 0 || chosen === "new") && (
        <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-2" aria-label={t("forms")}>
            {list.map((form) => (
              <li key={form.id}>
                <button type="button" onClick={() => setChosen(form.id)} aria-current={form.id === chosen ? "true" : undefined}
                  className={`card w-full p-4 text-left transition-colors hover:bg-surface-2 ${form.id === chosen ? "ring-2 ring-gold" : ""}`}>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: form.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{form.name}</span>
                    <span className={`chip ${form.enabled ? "border-gold text-gold" : "border-line text-muted"}`}>{form.enabled ? t("botOn") : t("botOff")}</span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-muted">{form.purpose === "support" ? t("formTypeSupport") : t("formTypeRequest")}</span>
                  <span className="mt-1 block truncate text-xs text-muted">{form.origins.filter((o) => o !== BOT_ENGINE).map((o) => o.replace(/^https?:\/\//, "")).join(", ") || "—"}</span>
                  <span className="mt-2 block text-xs text-muted">{form.purpose === "support" ? t("formTickets") : t("formLeads")}: <b className="text-text">{leadCount(form.id)}</b></span>
                </button>
              </li>
            ))}
          </ul>
          {chosen === "new" && canCreate
            ? <FormEditor key="new" workspaceId={workspace.id} owner={workspace.name} form={null} canEdit onSaved={setChosen} onDeleted={() => setChosen(null)} defaultLanguage={lang} />
            : current && <FormEditor key={current.id} workspaceId={workspace.id} owner={workspace.name} form={current} canEdit={canEdit} onSaved={setChosen} onDeleted={() => setChosen(null)}
                leadCount={leadCount(current.id)} defaultLanguage={lang} />}
        </div>
      )}
    </section>
  );
}

const fieldOf: Record<FormProblem, string> = { name: "form-name", origins: "form-websites", color: "form-color", privacyUrl: "form-privacy", limits: "form-daily" };

function FormEditor({ workspaceId, owner, form, canEdit, onSaved, onDeleted, leadCount, defaultLanguage }: {
  workspaceId: string; owner: string; form: WebForm | null; canEdit: boolean; onSaved: (id: string) => void; onDeleted: () => void; leadCount?: number; defaultLanguage: string;
}) {
  const { t } = useI18n();
  const change = useFormChange(workspaceId);
  const start: WebFormDraft = form ?? emptyForm(BOT_LANGUAGES.find((code) => code === defaultLanguage) ?? "de");
  const [draft, setDraft] = useState<WebFormDraft>(start);
  const [websites, setWebsites] = useState(start.origins.join("\n"));
  const [privacy, setPrivacy] = useState(start.privacy_url ?? "");
  const [checked, setChecked] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [copied, setCopied] = useState(false);

  const full: WebFormDraft = useMemo(() => ({
    ...draft, name: draft.name.trim(), origins: parseOrigins(websites), privacy_url: privacy.trim() || null, color: draft.color.toLowerCase(),
  }), [draft, websites, privacy]);
  const problems = formProblems(full);
  const bad = (p: FormProblem) => checked && problems.includes(p);
  const set = <K extends keyof WebFormDraft>(key: K, value: WebFormDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function save(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (problems.length) { document.getElementById(fieldOf[problems[0]!])?.focus(); return; }
    change.save.mutate({ id: form?.id ?? null, draft: full }, { onSuccess: (id) => { setSavedAt(Date.now()); setWebsites(full.origins.join("\n")); onSaved(id); } });
  }
  function remove() {
    if (!form || !window.confirm(t("deleteFormConfirm"))) return;
    change.remove.mutate(form.id, { onSuccess: onDeleted });
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the code stays selectable */ }
  }

  const label = "block text-xs font-semibold text-muted";
  const fieldClass = (p: FormProblem) => `field mt-1 ${bad(p) ? "border-danger" : ""}`;

  return (
    <div className="space-y-5">
      {form && (
        <div className="card p-5">
          <div className="flex flex-wrap items-start gap-3">
            <h2 className="min-w-0 flex-1 text-sm font-bold">{t("botEmbed")}</h2>
            {form.purpose === "support"
              ? <Link to="/tickets" className="text-sm text-muted hover:text-text">{t("formTickets")}: <b className="text-gold">{leadCount ?? 0}</b></Link>
              : <Link to="/leads" search={{ source: "web_form" }} className="text-sm text-muted hover:text-text">{t("formLeads")}: <b className="text-gold">{leadCount ?? 0}</b></Link>}
          </div>
          <div className="mt-3 flex flex-wrap items-start gap-2">
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-all rounded-lg border border-line bg-surface p-3 text-xs">{formEmbedCode(form.id)}</code>
            <button type="button" className="btn-ghost" onClick={() => void copy(formEmbedCode(form.id))}>
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t("formEmbedHint")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {form.origins.includes(BOT_ENGINE) ? (
              <a href={formPreviewUrl(form.id)} target="_blank" rel="noopener" className="btn-ghost"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t("botPreview")}</a>
            ) : (
              <>
                <p className="min-w-0 flex-1 text-xs text-muted">{t("botPreviewOff")}</p>
                {canEdit && <button type="button" className="btn-ghost" onClick={() => setWebsites((w) => `${w.trim()}\n${BOT_ENGINE}`.trim())}>{t("botPreviewAllow")}</button>}
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={save} noValidate className="card space-y-4 p-5">
        <fieldset disabled={!canEdit} className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            {t("botEnabled")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>{t("formName")}
              <input id="form-name" className={fieldClass("name")} maxLength={60} value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={bad("name")} placeholder="Kontakt Startseite" />
            </label>
            <label className={label}>{t("formLanguage")}
              <select className="field mt-1" value={draft.language} onChange={(e) => set("language", e.target.value as WebFormDraft["language"])}>
                {BOT_LANGUAGES.map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}
              </select>
            </label>
          </div>
          <fieldset className={label}>
            <legend>{t("formPurpose")}</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {FORM_PURPOSES.map((purpose) => (
                <label key={purpose} className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-normal text-text ${draft.purpose === purpose ? "border-gold" : "border-line"}`}>
                  <input type="radio" name="form-purpose" checked={draft.purpose === purpose} onChange={() => set("purpose", purpose)} className="h-4 w-4 accent-[var(--gold)]" />
                  {purpose === "support" ? t("formPurposeSupport") : t("formPurposeRequest")}
                </label>
              ))}
            </div>
            <span className="mt-1 block font-normal">{t("formPurposeHint")}</span>
          </fieldset>
          <label className={label}>{t("botWebsites")}
            <textarea id="form-websites" className={fieldClass("origins")} rows={2} value={websites} onChange={(e) => setWebsites(e.target.value)} aria-invalid={bad("origins")} aria-describedby="form-websites-hint" placeholder="ihre-firma.de" />
            <span id="form-websites-hint" className="mt-1 block font-normal">{t("formWebsitesHint")}</span>
          </label>
          <label className={label}>{t("formPrivacy")}
            <input id="form-privacy" type="url" className={fieldClass("privacyUrl")} value={privacy} onChange={(e) => setPrivacy(e.target.value)} aria-invalid={bad("privacyUrl")} aria-describedby="form-privacy-hint" placeholder="https://ihre-firma.de/datenschutz" />
            <span id="form-privacy-hint" className="mt-1 block font-normal">{t("formPrivacyHint")} {t("formConsentPreview").replace("{name}", owner)}</span>
          </label>
          {draft.purpose === "request" && <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.ask_company} onChange={(e) => set("ask_company", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            {t("formAskCompany")}
          </label>}
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <label className={label}>{t("botColor")}
              <input id="form-color" type="color" className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface" value={draft.color} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label className={label}>{t("formDailyLimit")}
              <input id="form-daily" type="number" min={1} max={2000} className={fieldClass("limits")} value={draft.daily_limit} onChange={(e) => set("daily_limit", Number(e.target.value))} />
            </label>
          </div>
        </fieldset>

        {checked && problems.length > 0 && <p className="text-sm text-danger" role="alert">{t("fixFields")}</p>}
        {(change.save.isError || change.remove.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={change.save.isPending}>{t("save")}</button>
            {savedAt > 0 && !change.save.isPending && <span className="text-sm text-muted" role="status">{t("saved")}</span>}
            {form && <button type="button" className="btn-ghost ml-auto text-danger" onClick={remove} disabled={change.remove.isPending}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("deleteForm")}</button>}
          </div>
        )}
      </form>
    </div>
  );
}
