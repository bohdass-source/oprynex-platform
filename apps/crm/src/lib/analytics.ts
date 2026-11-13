// Dashboard figures, computed in the browser from the workspace's leads. Spam never counts.
import { BOARD_STATUSES, OPEN_STATUSES, isoDate, type Lead, type Status } from "@/lib/crm";
import { CHATBOT_MONTHLY, PRODUCTS, leadProducts, leadValue, productShares, type Product } from "@/lib/products";

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

const DAY = 86_400_000;
const real = (leads: Lead[]) => leads.filter((lead) => lead.status !== "spam");
const between = (iso: string, from: number, to: number) => { const t = Date.parse(iso); return t >= from && t < to; };
const sum = (leads: Lead[]) => leads.reduce((total, lead) => total + (leadValue(lead)?.value ?? 0), 0);

/** Change against the previous period of the same length, in whole percent; null when there is nothing to compare. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export type Kpis = {
  newLeads: number; newLeadsPrev: number;
  pipelineValue: number; pipelineCount: number; pipelineEstimated: boolean;
  wonValue: number; wonValuePrev: number; wonCount: number;
  winRate: number | null; closedCount: number;
  /** Monthly operation fees of every chatbot ever won (not limited to the period), in euros net. */
  chatbotMonthly: number;
};

/** Won and lost use the last change of the lead as the closing day. */
export function kpis(all: Lead[], days: Period, now: Date): Kpis {
  const leads = real(all);
  const end = now.getTime(), start = end - days * DAY, prevStart = start - days * DAY;
  const open = leads.filter((lead) => OPEN_STATUSES.includes(lead.status));
  const closedIn = (from: number, to: number) => leads.filter((lead) => (lead.status === "won" || lead.status === "lost") && between(lead.updated_at, from, to));
  const closed = closedIn(start, end);
  const won = closed.filter((lead) => lead.status === "won");
  return {
    newLeads: leads.filter((lead) => between(lead.created_at, start, end)).length,
    newLeadsPrev: leads.filter((lead) => between(lead.created_at, prevStart, start)).length,
    pipelineValue: sum(open), pipelineCount: open.length,
    pipelineEstimated: open.some((lead) => leadValue(lead)?.estimated),
    wonValue: sum(won), wonValuePrev: sum(closedIn(prevStart, start).filter((lead) => lead.status === "won")), wonCount: won.length,
    winRate: closed.length ? Math.round((won.length / closed.length) * 100) : null, closedCount: closed.length,
    chatbotMonthly: leads.filter((lead) => lead.status === "won" && leadProducts(lead).products.includes("chatbot")).length * CHATBOT_MONTHLY,
  };
}

export type Bucket = { key: string; start: Date; form: number; chat: number };

/** New leads per day (7 days), per 3 days (30), per week (90) or per month (365), split into contact form and chat. */
export function leadSeries(all: Lead[], days: Period, now: Date): Bucket[] {
  const step = days === 7 ? 1 : days === 30 ? 3 : 7;
  const buckets: Bucket[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const count = days === 365 ? 12 : Math.ceil(days / step);
  for (let i = count - 1; i >= 0; i--) {
    const start = days === 365 ? new Date(today.getFullYear(), today.getMonth() - i, 1) : new Date(today.getTime() - (i * step + step - 1) * DAY);
    buckets.push({ key: isoDate(start), start, form: 0, chat: 0 });
  }
  for (const lead of real(all)) {
    const t = Date.parse(lead.created_at);
    if (t > now.getTime()) continue;
    const bucket = [...buckets].reverse().find((b) => t >= b.start.getTime());
    // Website forms (the site's own and customers' forms) count as forms, the site chat and website bots as chat; imports are not incoming.
    if (bucket && lead.source !== "import") { if (lead.source === "contact_form" || lead.source === "web_form") bucket.form += 1; else bucket.chat += 1; }
  }
  return buckets;
}

export type ProductRow = { product: Product | "unknown"; count: number; share: number; value: number; won: number };

/** Requests per product in the period, most asked first; products without requests are listed after them. Share is of all requests. */
export function productStats(all: Lead[], days: Period, now: Date): ProductRow[] {
  const start = now.getTime() - days * DAY;
  const leads = real(all).filter((lead) => Date.parse(lead.created_at) >= start);
  const rows = new Map<ProductRow["product"], ProductRow>();
  for (const product of [...PRODUCTS, "unknown" as const]) rows.set(product, { product, count: 0, share: 0, value: 0, won: 0 });
  for (const lead of leads) {
    // A request for a website and a chatbot counts for both; its value is split by the starting prices.
    const shares = productShares(lead);
    if (!shares.length) { const row = rows.get("unknown")!; row.count += 1; row.value += leadValue(lead)?.value ?? 0; if (lead.status === "won") row.won += 1; continue; }
    for (const share of shares) {
      const row = rows.get(share.product)!;
      row.count += 1;
      row.value += share.value;
      if (lead.status === "won") row.won += 1;
    }
  }
  return [...rows.values()]
    .map((row) => ({ ...row, share: leads.length ? Math.round((row.count / leads.length) * 100) : 0 }))
    .filter((row) => row.count > 0 || row.product !== "unknown")
    .sort((a, b) => b.count - a.count || b.value - a.value);
}

/** How many of the period's leads reached each pipeline stage at the moment. */
export function stageCounts(all: Lead[], days: Period, now: Date): Record<Status, number> {
  const start = now.getTime() - days * DAY;
  const counts = Object.fromEntries(BOARD_STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const lead of real(all)) if (Date.parse(lead.created_at) >= start) counts[lead.status] = (counts[lead.status] ?? 0) + 1;
  return counts;
}

/** Visitor languages of the period's leads, most frequent first. */
export function languageStats(all: Lead[], days: Period, now: Date): { language: string; count: number }[] {
  const start = now.getTime() - days * DAY;
  const counts = new Map<string, number>();
  for (const lead of real(all)) if (Date.parse(lead.created_at) >= start) counts.set(lead.language, (counts.get(lead.language) ?? 0) + 1);
  return [...counts].map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count);
}
