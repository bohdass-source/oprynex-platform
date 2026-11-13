import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeEuro, Inbox, Minus, Percent, Trophy, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AreaChart, Pillars, ShareBar } from "@/components/charts";
import { OnboardingCard } from "@/components/onboarding";
import { STAGE_COLOR, StatusPill } from "@/components/status-pill";
import { TaskList } from "@/components/task-list";
import { PERIODS, delta, kpis, languageStats, leadSeries, productStats, stageCounts, type Period } from "@/lib/analytics";
import { useWorkspace } from "@/lib/auth";
import { BOARD_STATUSES, sortTasks, ticketStats } from "@/lib/crm";
import { periodLabel, productLabel, statusLabel, useI18n } from "@/lib/i18n";
import { PRODUCT_COLOR, formatEur } from "@/lib/products";
import { useLeads, useTasks, useTickets } from "@/lib/queries";
import type { LeadSearch } from "@/lib/views";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Card({ title, sub, action, className = "", children }: { title: string; sub?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start gap-2">
        <div className="min-w-[10rem] flex-1"><h2 className="text-lg font-bold">{title}</h2>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Trend({ value }: { value: number | null }) {
  const { t } = useI18n();
  if (value === null) return <span className="font-semibold text-gold">{t("noComparison")}</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <>
      <span className={`whitespace-nowrap font-bold ${value > 0 ? "text-ok" : value < 0 ? "text-danger" : "text-muted"}`}>
        <Icon className="mr-0.5 inline h-3 w-3 align-[-2px]" aria-hidden="true" />{value > 0 ? "+" : ""}{value}{"\u00a0"}%
      </span>{" "}
      <span className="text-muted">{t("vsPrevious")}</span>
    </>
  );
}

/** Support at a glance: open, waiting, done in 30 days and how long the oldest open ticket has waited. */
function SupportCard({ tickets }: { tickets: Parameters<typeof ticketStats>[0] | undefined }) {
  const { t } = useI18n();
  if (!tickets || tickets.length === 0) return null;
  const s = ticketStats(tickets);
  const figures = [
    { label: t("supportOpen"), value: String(s.open) },
    { label: t("supportPending"), value: String(s.pending) },
    { label: t("supportDone30"), value: String(s.done30) },
    { label: t("supportOldest"), value: s.oldestOpenDays === null ? "—" : t("supportDays").replace("{n}", String(s.oldestOpenDays)) },
  ];
  return (
    <Card title={t("support")} className="lg:col-span-12" action={<Link to="/tickets" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-text">{t("showAll")}<ArrowRight className="h-3 w-3" /></Link>}>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {figures.map((f) => <div key={f.label}><dt className="text-xs text-muted">{f.label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{f.value}</dd></div>)}
      </dl>
    </Card>
  );
}

/** A key figure that opens the requests behind it (drill-down). */
function Kpi({ icon: Icon, color, value, label, foot, to, search }: { icon: LucideIcon; color: string; value: string; label: string; foot: ReactNode; to: "/leads" | "/pipeline"; search?: LeadSearch }) {
  const className = "group rounded-xl border border-line bg-surface-2/60 p-4 transition-colors hover:border-gold/60";
  const body = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-[11px]">{foot}</p>
    </>
  );
  return to === "/pipeline" ? <Link to="/pipeline" className={className}>{body}</Link> : <Link to="/leads" search={search ?? {}} className={className}>{body}</Link>;
}

function Dashboard() {
  const { workspace } = useWorkspace();
  const { t, lang, formatShort, languageName } = useI18n();
  const leads = useLeads(workspace.id);
  const tasks = useTasks(workspace.id);
  const tickets = useTickets(workspace.id);
  const [period, setPeriod] = useState<Period>(30);
  const now = useMemo(() => new Date(), [leads.dataUpdatedAt]);
  const all = leads.data ?? [];
  const k = useMemo(() => kpis(all, period, now), [all, period, now]);
  const series = useMemo(() => leadSeries(all, period, now), [all, period, now]);
  const products = useMemo(() => productStats(all, period, now), [all, period, now]);
  const stages = useMemo(() => stageCounts(all, period, now), [all, period, now]);
  const languages = useMemo(() => languageStats(all, period, now), [all, period, now]);
  const openTasks = sortTasks((tasks.data ?? []).filter((task) => !task.done_at)).slice(0, 5);
  const latest = all.filter((lead) => lead.status !== "spam").slice(0, 5);
  const maxLanguage = Math.max(1, ...languages.map((l) => l.count));

  if (leads.isPending) return <p className="text-sm text-muted" role="status">{t("loading")}</p>;
  if (leads.isError) return <p className="text-sm text-danger" role="alert">{t("loadError")}</p>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <OnboardingCard workspace={workspace} />
      <Card title={t("overview")} sub={t("overviewSub")} className="lg:col-span-8" action={
        <div className="flex flex-wrap gap-1" role="group" aria-label={t("period")}>
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${period === p ? "bg-text text-bg" : "text-muted hover:bg-surface-2 hover:text-text"}`}>{periodLabel[p][lang]}</button>
          ))}
        </div>
      }>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi icon={Inbox} color="var(--gold)" value={String(k.newLeads)} label={t("kpiNew")} foot={<Trend value={delta(k.newLeads, k.newLeadsPrev)} />} to="/leads" search={{ status: "all" }} />
          <Kpi icon={BadgeEuro} color="var(--chart-a)" value={formatEur(k.pipelineValue, lang)} label={t("kpiPipeline")} to="/pipeline"
            foot={<span className="text-muted">{k.pipelineCount} {t("openDeals")}{k.pipelineEstimated ? ` · ${t("estimateHint")}` : ""}</span>} />
          <Kpi icon={Trophy} color="var(--ok)" value={formatEur(k.wonValue, lang)} label={t("kpiWon")} foot={k.chatbotMonthly > 0 ? <span className="text-muted">{t("chatbotMonthlyFoot").replace("{x}", formatEur(k.chatbotMonthly, lang))}</span> : <Trend value={delta(k.wonValue, k.wonValuePrev)} />} to="/leads" search={{ status: "won" }} />
          <Kpi icon={Percent} color="#8b9cf7" value={k.winRate === null ? "—" : `${k.winRate} %`} label={t("kpiWinRate")} to="/leads" search={{ status: "won" }}
            foot={<span className="text-muted">{k.wonCount} {t("dealsWon")} · {k.closedCount} {t("closedDeals")}</span>} />
        </div>
      </Card>

      <Card title={t("stages")} sub={periodLabel[period][lang]} className="lg:col-span-4">
        <Pillars items={BOARD_STATUSES.map((status) => ({
          key: status, label: statusLabel[status][lang], value: stages[status] ?? 0, color: STAGE_COLOR[status],
          labelNode: <Link to="/leads" search={{ status }} className="hover:text-text hover:underline">{statusLabel[status][lang]}</Link>,
        }))} />
      </Card>

      <Card title={t("topProducts")} sub={periodLabel[period][lang]} className="lg:col-span-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:min-w-[34rem]">
            <thead><tr className="text-left text-xs text-muted">
              <th className="pb-3 font-semibold">#</th><th className="pb-3 font-semibold">{t("product")}</th>
              <th className="hidden w-[35%] pb-3 font-semibold sm:table-cell">{t("popularity")}</th><th className="pb-3 text-right font-semibold">{t("requests")}</th><th className="pb-3 text-right font-semibold">{t("value")}</th>
            </tr></thead>
            <tbody>
              {products.map((row, i) => {
                const color = row.product === "unknown" ? "var(--muted)" : PRODUCT_COLOR[row.product];
                return (
                  <tr key={row.product} className="border-t border-line">
                    <td className="py-3 pr-3 font-bold text-muted">{String(i + 1).padStart(2, "0")}</td>
                    <td className="py-3 pr-3"><Link to="/leads" search={{ status: "all", product: row.product }} className="font-semibold hover:underline">{productLabel[row.product][lang]}</Link></td>
                    <td className="hidden py-3 pr-3 sm:table-cell"><ShareBar value={row.share} color={color} /></td>
                    <td className="py-3 pr-3 text-right">
                      <span className="inline-block min-w-12 rounded-md border px-2 py-0.5 text-center text-xs font-bold" style={{ borderColor: color, color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{row.share} %</span>
                      <span className="ml-2 font-semibold">{row.count}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">{row.value ? formatEur(row.value, lang) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t("languages")} sub={periodLabel[period][lang]} className="lg:col-span-4">
        {languages.length === 0 ? <p className="text-sm text-muted">{t("noData")}</p> : (
          <ul className="space-y-3">
            {languages.slice(0, 8).map((row) => (
              <li key={row.language}>
                <div className="mb-1 flex justify-between text-sm"><span>{languageName(row.language)}</span><b>{row.count}</b></div>
                <ShareBar value={(row.count / maxLanguage) * 100} color="var(--chart-a)" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t("requestsOverTime")} sub={periodLabel[period][lang]} className="lg:col-span-8">
        <AreaChart
          labels={series.map((b) => formatShort(b.start, period === 365 ? "month" : "day"))}
          series={[
            { label: t("viaForm"), color: "var(--chart-a)", values: series.map((b) => b.form) },
            { label: t("viaChat"), color: "var(--chart-b)", values: series.map((b) => b.chat) },
          ]}
          summary={series.map((b) => `${formatShort(b.start, period === 365 ? "month" : "day")}: ${b.form + b.chat}`).join(", ")}
        />
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:col-span-4">
        <Card title={t("latestRequests")} action={<Link to="/leads" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-text">{t("showAll")}<ArrowRight className="h-3 w-3" /></Link>}>
          {latest.length === 0 ? <p className="text-sm text-muted">{t("empty")}</p> : (
            <ul className="space-y-2">
              {latest.map((lead) => (
                <li key={lead.id}>
                  <Link to="/leads/$id" params={{ id: lead.id }} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{lead.name}</span>
                    <StatusPill status={lead.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t("nextTasks")} action={<Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-text">{t("allTasks")}<ArrowRight className="h-3 w-3" /></Link>}>
          <TaskList tasks={openTasks} workspaceId={workspace.id} showLead />
        </Card>
      </div>
      <SupportCard tickets={tickets.data} />
    </div>
  );
}
