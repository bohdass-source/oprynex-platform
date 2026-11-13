import { offers, type L } from "@/lib/offers";

// What a request is about, shown as a dropdown in the contact form and the chat. The ids are the CRM's product values.
export const PRODUCT_IDS = ["chatbot", "website", "crm", "consulting", "other"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

const OFFER_PATH: Record<Exclude<ProductId, "other">, string> = {
  chatbot: "/ki-chatbot-website", website: "/website-erstellen-lassen",
  crm: "/crm-entwicklung", consulting: "/beratung",
};

const personal: L = { ru: "Лично обсудить задачу", de: "Persönlich besprechen", en: "Talk in person" };

/** Names come from the offers registry, so a renamed offer changes here too. */
export function productLabel(id: ProductId): L {
  return id === "other" ? personal : offers.find((offer) => offer.path === OFFER_PATH[id])!.name;
}

export const productPlaceholder: L = { ru: "Выбрать продукт", de: "Produkt auswählen", en: "Choose a product" };
