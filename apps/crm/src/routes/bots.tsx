import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot as BotIcon, Check, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useWorkspace } from "@/lib/auth";
import { BOT_ENGINE, BOT_KINDS, BOT_LANGUAGES, KNOWLEDGE_MAX, botProblems, hasIntegrations, previewUrl, can, embedCode, emptyBot, parseOrigins, usageSummary, type Bot, type BotDraft, type BotProblem } from "@/lib/crm";
import { botKindLabel, useI18n } from "@/lib/i18n";
import { useBotChange, useBotUsage, useBots, useLeads } from "@/lib/queries";

export const Route = createFileRoute("/bots")({ component: BotsPage });

const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

function BotsPage() {
  const { workspace } = useWorkspace();
  const { t, lang } = useI18n();
  const bots = useBots(workspace.id);
  const usage = useBotUsage(workspace.id);
  const leads = useLeads(workspace.id);
  const allowed = hasIntegrations(workspace);
  const canEdit = can(workspace.role, "manageBots");
  const canCreate = canEdit && allowed;
  // null: nothing chosen yet, "new": the form for a new bot, otherwise a bot id.
  const [chosen, setChosen] = useState<string | null>(null);
  const list = bots.data ?? [];
  useEffect(() => { if (chosen === null && list[0]) setChosen(list[0].id); }, [chosen, list]);
  const current = list.find((bot) => bot.id === chosen) ?? null;
  const today = new Date().toISOString().slice(0, 10); // the engine counts in UTC days
  const leadCount = (id: string) => (leads.data ?? []).filter((lead) => lead.bot_id === id).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{t("bots")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("botsIntro")}</p>
        </div>
        {canCreate && <button type="button" className="btn-primary" onClick={() => setChosen("new")}><Plus className="h-4 w-4" aria-hidden="true" />{t("newBot")}</button>}
      </div>
      {!allowed && <p className="card border-gold/50 p-4 text-sm" role="status">{t("intLockedText")}</p>}
      {!canEdit && <p className="text-sm text-muted">{t("readOnlyBots")}</p>}
      {bots.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {bots.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {bots.data && list.length === 0 && chosen !== "new" && (
        <div className="card flex flex-col items-start gap-3 p-6">
          <BotIcon className="h-8 w-8 text-gold" aria-hidden="true" />
          <p className="text-sm">{t("noBots")}</p>
          {canCreate && <button type="button" className="btn-primary" onClick={() => setChosen("new")}><Plus className="h-4 w-4" aria-hidden="true" />{t("newBot")}</button>}
        </div>
      )}

      {(list.length > 0 || chosen === "new") && (
        <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-2" aria-label={t("bots")}>
            {list.map((bot) => {
              const used = usageSummary(usage.data ?? [], bot.id, today);
              return (
                <li key={bot.id}>
                  <button type="button" onClick={() => setChosen(bot.id)} aria-current={bot.id === chosen ? "true" : undefined}
                    className={`card w-full p-4 text-left transition-colors hover:bg-surface-2 ${bot.id === chosen ? "ring-2 ring-gold" : ""}`}>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: bot.color }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{bot.name}</span>
                      <span className={`chip ${bot.enabled ? "border-gold text-gold" : "border-line text-muted"}`}>{bot.enabled ? t("botOn") : t("botOff")}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">{botKindLabel[bot.kind].name[lang]} · {bot.business}</span>
                    <span className="mt-2 block text-xs text-muted">{t("usageToday")}: <b className="text-text">{used.today}</b> / {bot.daily_limit} · {t("botLeads")}: <b className="text-text">{leadCount(bot.id)}</b></span>
                  </button>
                </li>
              );
            })}
          </ul>
          {chosen === "new" && canCreate
            ? <BotEditor key="new" workspaceId={workspace.id} bot={null} canEdit canEnable onSaved={setChosen} onDeleted={() => setChosen(null)} />
            : current && <BotEditor key={current.id} workspaceId={workspace.id} bot={current} canEdit={canEdit} canEnable={allowed} onSaved={setChosen} onDeleted={() => setChosen(null)}
                usage={usageSummary(usage.data ?? [], current.id, today)} leadCount={leadCount(current.id)} />}
        </div>
      )}
    </section>
  );
}

const fieldOf: Record<BotProblem, string> = {
  name: "bot-name", business: "bot-business", origins: "bot-websites", languages: "bot-languages", greeting: "bot-greeting", knowledge: "bot-knowledge",
  quickReplies: "bot-quick", color: "bot-color", privacyUrl: "bot-privacy", limits: "bot-daily",
};

function BotEditor({ workspaceId, bot, canEdit, canEnable, onSaved, onDeleted, usage, leadCount }: {
  workspaceId: string; bot: Bot | null; canEdit: boolean; canEnable: boolean; onSaved: (id: string) => void; onDeleted: () => void;
  usage?: { today: number; week: number }; leadCount?: number;
}) {
  const { t, lang } = useI18n();
  const change = useBotChange(workspaceId);
  const start: BotDraft = bot ?? emptyBot();
  const [draft, setDraft] = useState<BotDraft>(start);
  const [websites, setWebsites] = useState(start.origins.join("\n"));
  const [quick, setQuick] = useState(start.quick_replies.join("\n"));
  const [privacy, setPrivacy] = useState(start.privacy_url ?? "");
  const [checked, setChecked] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [copied, setCopied] = useState(false);

  const full: BotDraft = useMemo(() => ({
    ...draft, name: draft.name.trim(), business: draft.business.trim(), origins: parseOrigins(websites), quick_replies: lines(quick),
    privacy_url: privacy.trim() || null, color: draft.color.toLowerCase(),
  }), [draft, websites, quick, privacy]);
  const problems = botProblems(full);
  const bad = (p: BotProblem) => checked && problems.includes(p);
  const set = <K extends keyof BotDraft>(key: K, value: BotDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function save(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (problems.length) { document.getElementById(fieldOf[problems[0]!])?.focus(); return; }
    change.save.mutate({ id: bot?.id ?? null, draft: full }, { onSuccess: (id) => { setSavedAt(Date.now()); setWebsites(full.origins.join("\n")); onSaved(id); } });
  }
  function remove() {
    if (!bot || !window.confirm(t("deleteBotConfirm"))) return;
    change.remove.mutate(bot.id, { onSuccess: onDeleted });
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the code stays selectable */ }
  }

  const label = "block text-xs font-semibold text-muted";
  const fieldClass = (p: BotProblem) => `field mt-1 ${bad(p) ? "border-danger" : ""}`;
  const disabled = !canEdit;

  return (
    <div className="space-y-5">
      {bot && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4"><p className="text-xs text-muted">{t("usageToday")}</p><p className="mt-1 text-2xl font-bold">{usage?.today ?? 0}<span className="text-sm font-normal text-muted"> / {bot.daily_limit}</span></p></div>
          <div className="card p-4"><p className="text-xs text-muted">{t("usageWeek")}</p><p className="mt-1 text-2xl font-bold">{usage?.week ?? 0}</p></div>
          <Link to="/leads" search={{ source: "bot_lead" }} className="card p-4 hover:bg-surface-2"><p className="text-xs text-muted">{t("botLeads")}</p><p className="mt-1 text-2xl font-bold text-gold">{leadCount ?? 0}</p></Link>
        </div>
      )}

      {bot && (
        <div className="card p-5">
          <h2 className="text-sm font-bold">{t("botEmbed")}</h2>
          <div className="mt-3 flex flex-wrap items-start gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg border border-line bg-surface p-3 text-xs">{embedCode(bot.id)}</code>
            <button type="button" className="btn-ghost" onClick={() => void copy(embedCode(bot.id))}>
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t("botEmbedHint")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {bot.origins.includes(BOT_ENGINE) ? (
              <a href={previewUrl(bot)} target="_blank" rel="noopener" className="btn-ghost"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t("botPreview")}</a>
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
        <fieldset disabled={disabled} className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={draft.enabled} disabled={!canEnable && !draft.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            {t("botEnabled")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>{t("botName")}
              <input id="bot-name" className={fieldClass("name")} maxLength={60} value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={bad("name")} />
            </label>
            <label className={label}>{t("botBusiness")}
              <input id="bot-business" className={fieldClass("business")} maxLength={120} value={draft.business} onChange={(e) => set("business", e.target.value)} aria-invalid={bad("business")} />
            </label>
          </div>
          <fieldset className={label}>
            <legend>{t("botKind")}</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {BOT_KINDS.map((kind) => (
                <label key={kind} className={`flex cursor-pointer gap-2 rounded-lg border p-3 font-normal text-text ${draft.kind === kind ? "border-gold" : "border-line"}`}>
                  <input type="radio" name="bot-kind" checked={draft.kind === kind} onChange={() => set("kind", kind)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--gold)]" />
                  <span><span className="block text-sm font-semibold">{botKindLabel[kind].name[lang]}</span><span className="block text-xs text-muted">{botKindLabel[kind].text[lang]}</span></span>
                </label>
              ))}
            </div>
            <span className="mt-1 block font-normal">{t("botKindHint")}</span>
          </fieldset>
          <label className={label}>{t("botWebsites")}
            <textarea id="bot-websites" className={fieldClass("origins")} rows={2} value={websites} onChange={(e) => setWebsites(e.target.value)} aria-invalid={bad("origins")} aria-describedby="bot-websites-hint" placeholder="praxis-weber.de" />
            <span id="bot-websites-hint" className="mt-1 block font-normal">{t("botWebsitesHint")}</span>
          </label>
          <fieldset id="bot-languages" tabIndex={-1} className={label}>
            <legend>{t("botLanguages")}</legend>
            <div className="mt-1 flex gap-3">
              {BOT_LANGUAGES.map((code) => (
                <label key={code} className="flex items-center gap-1.5 text-sm font-normal text-text">
                  <input type="checkbox" checked={draft.languages.includes(code)} className="h-4 w-4 accent-[var(--gold)]"
                    onChange={(e) => set("languages", e.target.checked ? BOT_LANGUAGES.filter((c) => c === code || draft.languages.includes(c)) : draft.languages.filter((c) => c !== code))} />
                  {code.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={label}>{t("botGreeting")}
            <input id="bot-greeting" className={fieldClass("greeting")} maxLength={500} value={draft.greeting} onChange={(e) => set("greeting", e.target.value)} placeholder="Guten Tag! Wie kann ich helfen?" />
          </label>
          <label className={label}>{t("botKnowledge")}
            <textarea id="bot-knowledge" className={`${fieldClass("knowledge")} font-normal`} rows={12} value={draft.knowledge} onChange={(e) => set("knowledge", e.target.value)} aria-invalid={bad("knowledge")} aria-describedby="bot-knowledge-hint" />
            <span id="bot-knowledge-hint" className="mt-1 flex flex-wrap justify-between gap-2 font-normal">
              <span>{t("botKnowledgeHint")}</span>
              <span className={draft.knowledge.length > KNOWLEDGE_MAX ? "text-danger" : ""}>{draft.knowledge.length.toLocaleString()} / {KNOWLEDGE_MAX.toLocaleString()} {t("characters")}</span>
            </span>
          </label>
          <label className={label}>{t("botQuickReplies")}
            <textarea id="bot-quick" className={fieldClass("quickReplies")} rows={3} value={quick} onChange={(e) => setQuick(e.target.value)} aria-invalid={bad("quickReplies")} placeholder={"Öffnungszeiten\nTermin vereinbaren"} />
            <span className="mt-1 block font-normal">{t("botQuickRepliesHint")}</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <label className={label}>{t("botColor")}
              <input id="bot-color" type="color" className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface" value={draft.color} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label className={label}>{t("botPrivacy")}
              <input id="bot-privacy" type="url" className={fieldClass("privacyUrl")} value={privacy} onChange={(e) => setPrivacy(e.target.value)} aria-invalid={bad("privacyUrl")} placeholder="https://praxis-weber.de/datenschutz" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>{t("botDailyLimit")}
              <input id="bot-daily" type="number" min={1} max={5000} className={fieldClass("limits")} value={draft.daily_limit} onChange={(e) => set("daily_limit", Number(e.target.value))} />
            </label>
            <label className={label}>{t("botVisitorLimit")}
              <input type="number" min={1} max={200} className={fieldClass("limits")} value={draft.visitor_daily_limit} onChange={(e) => set("visitor_daily_limit", Number(e.target.value))} />
            </label>
          </div>
        </fieldset>

        {checked && problems.length > 0 && <p className="text-sm text-danger" role="alert">{t("fixFields")}</p>}
        {(change.save.isError || change.remove.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={change.save.isPending}>{t("save")}</button>
            {savedAt > 0 && !change.save.isPending && <span className="text-sm text-muted" role="status">{t("saved")}</span>}
            {bot && <button type="button" className="btn-ghost ml-auto text-danger" onClick={remove} disabled={change.remove.isPending}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("deleteBot")}</button>}
          </div>
        )}
      </form>
    </div>
  );
}

