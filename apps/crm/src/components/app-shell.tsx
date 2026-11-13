import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Building2, CircleHelp, CreditCard, Database, Plug, CheckSquare, LifeBuoy, UsersRound, ShieldCheck, Columns3, Inbox, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { OPEN_STATUSES, can, isoDate, trialDaysLeft, type Workspace } from "@/lib/crm";
import { useAuthActions, useWorkspace } from "@/lib/auth";
import { UI_LANGUAGES, useI18n } from "@/lib/i18n";
import { useAlertPermission, useLiveRequests } from "@/lib/live";
import { usePushDevice } from "@/lib/push-client";
import { useLeads, usePlatformSettings, useTasks, useTickets } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="Language">
      {UI_LANGUAGES.map((code) => (
        <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={lang === code}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${lang === code ? "bg-text text-bg" : "text-muted hover:text-text"}`}>
          {code}
        </button>
      ))}
    </div>
  );
}

const THEME_KEY = "oprynex-app-theme";

/** Dark unless this browser chose light; applied after hydration so the server never reads storage. */
function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    try { if (localStorage.getItem(THEME_KEY) === "light") setTheme("light"); } catch { /* storage blocked: stay dark */ }
  }, []);
  useEffect(() => {
    if (theme === "light") document.documentElement.dataset["theme"] = "light";
    else delete document.documentElement.dataset["theme"];
  }, [theme]);
  const toggle = () => setTheme((current) => {
    const next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    return next;
  });
  return { theme, toggle };
}

/** Shown when a person belongs to more than one company (for example Oprynex staff or someone invited elsewhere). */
function WorkspaceSwitch({ workspace, workspaces }: { workspace: Workspace; workspaces: Workspace[] }) {
  const { t } = useI18n();
  const { switchTo } = useAuthActions();
  const navigate = useNavigate();
  if (workspaces.length < 2) return null;
  return (
    <label className="block px-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Building2 className="h-3.5 w-3.5" aria-hidden="true" />{t("workspace")}</span>
      <select className="field mt-1 h-9 py-1 text-sm" value={workspace.id} onChange={(e) => { switchTo(e.target.value); void navigate({ to: "/dashboard" }); }}>
        {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
    </label>
  );
}

function Sidebar({ workspace, workspaces }: { workspace: Workspace; workspaces: Workspace[] }) {
  const { t } = useI18n();
  const role = workspace.role;
  const workspaceName = workspace.name;
  const platform = usePlatformSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/pipeline", label: t("pipeline"), icon: Columns3 },
    { to: "/leads", label: t("inbox"), icon: Inbox },
    { to: "/tickets", label: t("tickets"), icon: LifeBuoy },
    { to: "/customers", label: t("customers"), icon: UsersRound },
    { to: "/tasks", label: t("tasks"), icon: CheckSquare },
    { to: "/integrations", label: t("integrations"), icon: Plug },
    ...(workspace.plan !== "internal" ? [{ to: "/team", label: t("team"), icon: Users } as const] : []),
    ...(workspace.plan !== "internal" ? [{ to: "/plan", label: t("plan"), icon: CreditCard } as const] : []),
    ...(can(role, "manageData") ? [{ to: "/data", label: t("data"), icon: Database } as const] : []),
    { to: "/help", label: t("help"), icon: CircleHelp },
    ...(platform.data ? [{ to: "/admin", label: t("admin"), icon: ShieldCheck } as const] : []),
  ] as const;
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" className="flex items-center gap-2.5 px-2 pt-1 font-bold">
        <img src="/emblem.jpg" alt="" className="h-8 w-8 rounded-lg" />
        <span className="leading-tight">Oprynex<span className="block text-xs font-medium text-muted">{workspaceName === "Oprynex" ? "CRM" : workspaceName}</span></span>
      </Link>
      <WorkspaceSwitch workspace={workspace} workspaces={workspaces} />
      <nav className="flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to) || (to === "/integrations" && (path.startsWith("/bots") || path.startsWith("/forms") || path.startsWith("/import")));
          return (
            <Link key={to} to={to} aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-gold text-on-gold shadow-[0_0_24px_-6px_var(--gold)]" : "text-muted hover:bg-surface hover:text-text"}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <button type="button" onClick={() => void supabase().auth.signOut()}
        className="mt-auto flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-surface hover:text-text">
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />{t("signOut")}
      </button>
    </div>
  );
}

/** Closes a popover on Escape or a click outside it. */
function useDismiss(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onEvent = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !box.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onEvent);
    document.addEventListener("keydown", onEvent);
    return () => { document.removeEventListener("mousedown", onEvent); document.removeEventListener("keydown", onEvent); };
  }, [open, close]);
  return box;
}

/** New requests and overdue tasks, the two things that wait for the owner. */
function NotificationBell({ workspaceId }: { workspaceId: string }) {
  const { t } = useI18n();
  const leads = useLeads(workspaceId);
  const tasks = useTasks(workspaceId);
  const tickets = useTickets(workspaceId);
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const alerts = useAlertPermission();
  const push = usePushDevice();
  useLiveRequests(workspaceId, { title: t("appName"), arrival: t("newRequestAlert") });
  const today = isoDate(new Date());
  const fresh = (leads.data ?? []).filter((lead) => lead.status === "new").length;
  const overdue = (tasks.data ?? []).filter((task) => !task.done_at && task.due_date && task.due_date < today).length;
  const openTickets = (tickets.data ?? []).filter((ticket) => ticket.status === "open").length;
  const { userId } = useWorkspace();
  const mine = (leads.data ?? []).filter((lead) => lead.assigned_to === userId && OPEN_STATUSES.includes(lead.status)).length;
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={t("notifications")} title={t("notifications")}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-text">
        <Bell className="h-5 w-5" aria-hidden="true" />
        {fresh + overdue + openTickets > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-on-gold">{fresh + overdue + openTickets}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 top-12 z-30 w-64 space-y-1 p-2 shadow-xl">
          {fresh + overdue + openTickets + mine === 0 && <p className="p-2 text-sm text-muted">{t("allClear")}</p>}
          {fresh > 0 && <Link to="/leads" search={{ status: "new" }} onClick={() => setOpen(false)} className="block rounded-lg p-2 text-sm hover:bg-surface-2"><b>{fresh}</b> {t("newRequests")}</Link>}
          {mine > 0 && <Link to="/leads" search={{ owner: "me" }} onClick={() => setOpen(false)} className="block rounded-lg p-2 text-sm hover:bg-surface-2"><b>{mine}</b> {t("myOpenWork")}</Link>}
          {openTickets > 0 && <Link to="/tickets" search={{ view: "open" }} onClick={() => setOpen(false)} className="block rounded-lg p-2 text-sm hover:bg-surface-2"><b>{openTickets}</b> {t("openTickets")}</Link>}
          {overdue > 0 && <Link to="/tasks" onClick={() => setOpen(false)} className="block rounded-lg p-2 text-sm hover:bg-surface-2"><b>{overdue}</b> {t("overdueTasks")}</Link>}
          {push.state !== "unconfigured" && push.state !== "loading" ? (
            <div className="border-t border-line pt-1">
              {push.state === "off" && <button type="button" disabled={push.busy} onClick={() => void push.enable()} className="block w-full rounded-lg p-2 text-left text-sm font-semibold text-gold hover:bg-surface-2">{t("pushEnable")}</button>}
              {push.state === "on" && (
                <div className="flex items-center gap-2 p-2 text-xs text-muted"><span className="flex-1">{t("pushOn")}</span>
                  <button type="button" disabled={push.busy} onClick={() => void push.disable()} className="underline hover:text-text">{t("pushOff")}</button></div>
              )}
              {push.state === "install" && <p className="p-2 text-xs text-muted">{t("pushInstall")}</p>}
              {push.state === "denied" && <p className="p-2 text-xs text-muted">{t("alertsBlocked")}</p>}
              {push.state === "unsupported" && <p className="p-2 text-xs text-muted">{t("pushUnsupported")}</p>}
              {push.failed && <p className="p-2 text-xs text-danger" role="alert">{t("pushFailed")}</p>}
            </div>
          ) : alerts.permission !== "unsupported" && (
            <div className="border-t border-line pt-1">
              {alerts.permission === "default" && <button type="button" onClick={() => void alerts.request()} className="block w-full rounded-lg p-2 text-left text-sm font-semibold text-gold hover:bg-surface-2">{t("alertsEnable")}</button>}
              {alerts.permission === "granted" && <p className="p-2 text-xs text-muted">{t("alertsOn")}</p>}
              {alerts.permission === "denied" && <p className="p-2 text-xs text-muted">{t("alertsBlocked")}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/leads", search: { q: query.trim() || undefined } });
  }
  return (
    <form onSubmit={submit} role="search" className="relative min-w-0 flex-1 md:max-w-xl">
      <label htmlFor="global-search" className="sr-only">{t("globalSearch")}</label>
      <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted" aria-hidden="true" />
      <input id="global-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("globalSearch")}
        className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm placeholder:text-muted" />
    </form>
  );
}

/** Signed-in frame like a dashboard: navigation on the left, search, notifications and account on top. */
/** Trial days left, an ended trial or a paused account; nothing for active and internal workspaces. */
function TrialBanner({ workspace }: { workspace: Workspace }) {
  const { t } = useI18n();
  const days = trialDaysLeft(workspace);
  if (workspace.status === "paused") return <p className="border-b border-line bg-gold-soft px-4 py-2 text-center text-sm lg:px-8" role="status">{t("paused")}</p>;
  if (days === null) return null;
  const text = days < 0 ? t("trialEnded") : days === 0 ? t("trialLastDay") : t("trialLeft").replace("{n}", String(days));
  return <p className={`border-b border-line px-4 py-2 text-center text-sm lg:px-8 ${days < 0 ? "bg-gold-soft font-semibold" : "text-muted"}`} role="status">{text} <Link to="/plan" className="ml-1 font-semibold text-gold underline">{t("planSeeLink")}</Link></p>;
}

export function AppShell({ workspace, workspaces, email, children }: { workspace: Workspace; workspaces: Workspace[]; email: string; children: ReactNode }) {
  const workspaceId = workspace.id;
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setDrawer(false), [path]);
  const initial = (email.trim()[0] ?? "?").toUpperCase();
  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-sidebar lg:block"><Sidebar workspace={workspace} workspaces={workspaces} /></aside>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("menu")}>
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} aria-label={t("menu")} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-sidebar">
            <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-text" aria-label={t("menu")}><X className="h-5 w-5" /></button>
            <Sidebar workspace={workspace} workspaces={workspaces} />
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3 md:gap-3 lg:px-8">
          <button type="button" onClick={() => setDrawer(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface hover:text-text lg:hidden" aria-label={t("menu")}><Menu className="h-5 w-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
            <div className="hidden sm:block"><LanguageSwitch /></div>
            <button type="button" onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-text"
              aria-label={theme === "dark" ? t("themeLight") : t("themeDark")} title={theme === "dark" ? t("themeLight") : t("themeDark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>
            <NotificationBell workspaceId={workspaceId} />
            <span className="hidden h-10 w-10 place-items-center rounded-full bg-gold-soft font-bold text-gold sm:grid" title={email}>{initial}</span>
          </div>
        </div>
        <div className="flex justify-end px-4 pb-2 sm:hidden"><LanguageSwitch /></div>
      </header>
      <TrialBanner workspace={workspace} />
      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
