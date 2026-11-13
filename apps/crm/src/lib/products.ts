// Oprynex offers as CRM products: what a request is about and what it is worth.
import type { Lead } from "@/lib/crm";

// Since 2026-11-07 the site offers only these four products (Cloud, MVP and ERP are gone); older values in the
// database count as "other".
export const PRODUCTS = ["chatbot", "website", "crm", "consulting", "consulting_plan", "other"] as const;
export type Product = (typeof PRODUCTS)[number];

/**
 * Example net starting prices in euros used for estimates (set your own).
 * Consulting is one hour; the chatbot's monthly operation (CHATBOT_MONTHLY) comes on top of its setup price.
 */
export const START_PRICE: Record<Product, number | null> = {
  chatbot: 1000, website: 2000, crm: 10000, consulting: 100, consulting_plan: 300, other: null,
};

/** Monthly operation fee of one client chatbot in euros net (example value). */
export const CHATBOT_MONTHLY = 50;

/** Product colours for charts, readable on the dark and the light surface. */
export const PRODUCT_COLOR: Record<Product, string> = {
  chatbot: "#dba812", website: "#7dd3c0", crm: "#8b9cf7", consulting: "#b3a6f2", consulting_plan: "#e0a6d9", other: "#8a8a92",
};

const BY_TOPIC: Record<string, Product> = { fit_ai: "chatbot", fit_site: "website", fit_crm: "crm", fit_consult: "consulting" };
const BY_PAGE: Record<string, Product> = {
  "/ki-chatbot-website": "chatbot", "/website-erstellen-lassen": "website", "/crm-entwicklung": "crm", "/beratung": "consulting",
  "/ki-chatbot-kosten": "chatbot", "/website-kosten": "website", "/crm-kosten": "crm", "/ki-beratung": "consulting",
};
const BY_WORD: [RegExp, Product][] = [
  [/chat\s?-?bot|assistent|assistant|ассистент|чат-?бот/i, "chatbot"],
  [/\bcrm\b/i, "crm"],
  [/website|webseite|homepage|landing|сайт/i, "website"],
  [/beratung|consult|консультац/i, "consulting"],
];

type ProductFields = Pick<Lead, "product" | "chat_topic" | "page_path" | "message"> & { products?: readonly string[] | null };
const isProduct = (value: string): value is Product => (PRODUCTS as readonly string[]).includes(value);

/** Every product of a request: the list a member set (a request may cover a website and a chatbot), else one guess. */
export function leadProducts(lead: ProductFields): { products: Product[]; guessed: boolean } {
  const chosen = (lead.products ?? []).map((p) => (isProduct(p) ? p : "other" as const)).filter((p, i, all) => all.indexOf(p) === i);
  if (chosen.length) return { products: chosen, guessed: false };
  const one = leadProduct(lead);
  return one ? { products: [one.product], guessed: one.guessed } : { products: [], guessed: false };
}

/** The main product (the first one a member chose), else the chat topic, the page the request came from or a word in the message. */
export function leadProduct(lead: ProductFields): { product: Product; guessed: boolean } | null {
  const first = lead.products?.[0];
  if (first) return { product: isProduct(first) ? first : "other", guessed: false };
  if (lead.product) return { product: (PRODUCTS as readonly string[]).includes(lead.product) ? lead.product : "other", guessed: false };
  const guess = (lead.chat_topic && BY_TOPIC[lead.chat_topic]) || (lead.page_path && BY_PAGE[lead.page_path]) || BY_WORD.find(([re]) => re.test(lead.message))?.[1];
  return guess ? { product: guess, guessed: true } : null;
}

/** The agreed value, else the sum of the products' starting prices as an estimate, else nothing. */
export function leadValue(lead: ProductFields & Pick<Lead, "value_eur">): { value: number; estimated: boolean } | null {
  if (lead.value_eur != null) return { value: lead.value_eur, estimated: false };
  const prices = leadProducts(lead).products.map((p) => START_PRICE[p]).filter((p): p is number => p != null);
  return prices.length ? { value: prices.reduce((a, b) => a + b, 0), estimated: true } : null;
}

/** How a request's value splits over its products: by their starting prices, equally where none is published. */
export function productShares(lead: ProductFields & Pick<Lead, "value_eur">): { product: Product; value: number }[] {
  const products = leadProducts(lead).products;
  const total = leadValue(lead)?.value ?? 0;
  const weights = products.map((p) => START_PRICE[p] ?? 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  return products.map((product, i) => ({ product, value: sum > 0 ? Math.round((total * weights[i]!) / sum) : Math.round(total / products.length) }));
}

const EUR_LOCALE = { de: "de-DE", ru: "ru-RU", en: "en-IE" } as const;
export function formatEur(amount: number, lang: keyof typeof EUR_LOCALE): string {
  return new Intl.NumberFormat(EUR_LOCALE[lang], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

/** Whole euros between 0 and 10 000 000, the range the database accepts; empty means "not agreed yet". */
export function parseValue(input: string): { ok: true; value: number | null } | { ok: false } {
  const raw = input.replace(/[\s  €]/g, "");
  if (!raw) return { ok: true, value: null };
  // "1.500" and "1,500" are thousands; otherwise a comma or dot is the decimal mark.
  const clean = /^\d{1,3}([.,]\d{3})+$/.test(raw) ? raw.replace(/[.,]/g, "") : raw.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return { ok: false };
  const value = Math.round(Number(clean));
  return value <= 10_000_000 ? { ok: true, value } : { ok: false };
}
