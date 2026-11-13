import { describe, expect, it } from "vitest";
import { delta, kpis, leadSeries, productStats, stageCounts } from "@/lib/analytics";
import { duplicatesOf, type Lead } from "@/lib/crm";
import { leadProduct, leadProducts, leadValue, parseValue } from "@/lib/products";

const NOW = new Date("2026-10-31T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const lead = (over: Partial<Lead>): Lead => ({
  id: "1", workspace_id: "w", created_at: daysAgo(1), updated_at: daysAgo(1), name: "Anna", email: "anna@x.de", company: null,
  message: "Hallo", source: "contact_form", chat_topic: null, language: "de", page_path: "/contact", consent_at: daysAgo(1),
  status: "new", assigned_to: null, product: null, value_eur: null, ...over,
});

describe("product and value", () => {
  it("prefers the chosen product, then chat topic, page and words in the message", () => {
    expect(leadProduct(lead({ product: "crm", chat_topic: "fit_ai" }))).toEqual({ product: "crm", guessed: false });
    expect(leadProduct(lead({ chat_topic: "fit_ai" }))).toEqual({ product: "chatbot", guessed: true });
    expect(leadProduct(lead({ page_path: "/website-erstellen-lassen" }))?.product).toBe("website");
    expect(leadProduct(lead({ message: "Нужен новый сайт для салона" }))?.product).toBe("website");
    expect(leadProduct(lead({ message: "Guten Tag" }))).toBeNull();
  });
  it("uses the agreed value, else the published starting price as an estimate", () => {
    expect(leadValue(lead({ product: "website", value_eur: 2500 }))).toEqual({ value: 2500, estimated: false });
    expect(leadValue(lead({ product: "chatbot" }))).toEqual({ value: 1000, estimated: true });
    expect(leadValue(lead({ product: "other" }))).toBeNull();
    // A value from before 2026-11-07 (ERP, MVP, Cloud) counts as "other".
    expect(leadProduct(lead({ product: "mvp" as never }))).toEqual({ product: "other", guessed: false });
  });
  it("reads amounts the way people type them and rejects the rest", () => {
    expect(parseValue("1.500")).toEqual({ ok: true, value: 1500 });
    expect(parseValue("1 500 €")).toEqual({ ok: true, value: 1500 });
    expect(parseValue("900,50")).toEqual({ ok: true, value: 901 });
    expect(parseValue("")).toEqual({ ok: true, value: null });
    expect(parseValue("abc")).toEqual({ ok: false });
    expect(parseValue("-5")).toEqual({ ok: false });
    expect(parseValue("20000000")).toEqual({ ok: false });
  });
});

describe("dashboard figures", () => {
  const leads = [
    lead({ id: "a", product: "website", value_eur: 2000, status: "won", updated_at: daysAgo(2) }),
    lead({ id: "b", product: "chatbot", status: "proposal" }),
    lead({ id: "c", product: "crm", status: "lost", updated_at: daysAgo(3) }),
    lead({ id: "d", status: "spam", product: "crm", value_eur: 99999 }),
    lead({ id: "e", created_at: daysAgo(40), source: "chat_lead", chat_topic: "fit_ai" }),
  ];
  it("counts new leads, open value, won revenue and win rate without spam", () => {
    const k = kpis(leads, 30, NOW);
    expect(k.newLeads).toBe(3);
    expect(k.newLeadsPrev).toBe(1);
    expect(k.pipelineValue).toBe(1000 + 1000);
    expect(k.pipelineCount).toBe(2);
    expect(k.wonValue).toBe(2000);
    expect(k.winRate).toBe(50);
    expect(k.chatbotMonthly).toBe(0);
  });
  it("adds 50 euros a month for every won chatbot, whenever it was won", () => {
    const k = kpis([...leads, lead({ id: "f", product: "chatbot", status: "won", updated_at: daysAgo(200) }), lead({ id: "g", chat_topic: "fit_ai", status: "won", updated_at: daysAgo(1) })], 30, NOW);
    expect(k.chatbotMonthly).toBe(2 * 50);
  });
  it("ranks products and puts the period's stages in columns", () => {
    const rows = productStats(leads, 30, NOW);
    expect(rows.slice(0, 3).map((r) => r.product).sort()).toEqual(["chatbot", "crm", "website"]);
    expect(rows.find((r) => r.product === "website")).toMatchObject({ count: 1, share: 33, value: 2000, won: 1 });
    expect(stageCounts(leads, 30, NOW)).toMatchObject({ won: 1, proposal: 1, lost: 1, new: 0 });
  });
  it("counts customer website forms as forms, bots as chat and leaves imports out", () => {
    const base = leads[0]!;
    const extra = (["web_form", "bot_lead", "import"] as const).map((source, i) => ({ ...base, id: `x${i}`, source, status: "new" as const, created_at: new Date(NOW.getTime() - 3_600_000).toISOString() }));
    const sum = (list: typeof leads) => leadSeries(list, 7, NOW).reduce((acc, b) => ({ form: acc.form + b.form, chat: acc.chat + b.chat }), { form: 0, chat: 0 });
    const before = sum(leads);
    const after = sum([...leads, ...extra]);
    expect({ form: after.form - before.form, chat: after.chat - before.chat }).toEqual({ form: 1, chat: 1 });
  });
  it("splits leads over time into form and chat", () => {
    const days = leadSeries(leads, 7, NOW);
    expect(days).toHaveLength(7);
    expect(leadSeries(leads, 30, NOW)).toHaveLength(10);
    expect(days.reduce((n, b) => n + b.form + b.chat, 0)).toBe(3);
    const months = leadSeries(leads, 365, NOW);
    expect(months).toHaveLength(12);
    expect(months.reduce((n, b) => n + b.chat, 0)).toBe(1);
  });
  it("compares with the previous period", () => {
    expect(delta(3, 1)).toBe(200);
    expect(delta(0, 0)).toBe(0);
    expect(delta(2, 0)).toBeNull();
  });
});

describe("data hygiene", () => {
  it("finds requests from the same address regardless of case", () => {
    const dups = duplicatesOf([{ id: "1", email: "A@x.de" }, { id: "2", email: "a@x.de " }, { id: "3", email: "b@x.de" }]);
    expect(dups.get("1")).toEqual(["2"]);
    expect(dups.has("3")).toBe(false);
  });
});

describe("several products in one request", () => {
  const both = lead({ id: "m", products: ["website", "chatbot"], status: "won", updated_at: daysAgo(1) });
  it("keeps the first chosen product as the main one and adds up the starting prices", () => {
    expect(leadProduct(both)).toEqual({ product: "website", guessed: false });
    expect(leadProducts(both)).toEqual({ products: ["website", "chatbot"], guessed: false });
    expect(leadValue(both)).toEqual({ value: 2000 + 1000, estimated: true });
    expect(leadValue({ ...both, value_eur: 3000 })).toEqual({ value: 3000, estimated: false });
    expect(leadValue(lead({ products: ["consulting_plan"] }))).toEqual({ value: 300, estimated: true });
  });
  it("counts the request for each product, splits its value and adds the chatbot's monthly fee", () => {
    const rows = productStats([both], 30, NOW);
    expect(rows.find((r) => r.product === "website")).toMatchObject({ count: 1, value: 2000, won: 1 });
    expect(rows.find((r) => r.product === "chatbot")).toMatchObject({ count: 1, value: 1000, won: 1 });
    expect(kpis([both], 30, NOW).chatbotMonthly).toBe(50);
  });
});

