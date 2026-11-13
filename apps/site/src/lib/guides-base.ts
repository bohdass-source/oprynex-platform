import { eur, type L, type OfferPath } from "@/lib/offers";

export type GuidePath =
  | "/ki-chatbot-kosten" | "/ki-chatbot-dsgvo"
  | "/ki-chatbot-immobilien" | "/ki-chatbot-handwerk" | "/ki-chatbot-autohaus" | "/ki-chatbot-kanzlei" | "/ki-chatbot-saas"
  | "/ki-chatbot-arztpraxis" | "/ki-chatbot-onlineshop" | "/ki-chatbot-dienstleister" | "/ki-chatbot-gastronomie-hotel"
  | "/website-kosten" | "/crm-kosten" | "/ki-beratung";
export type GuideSection = { title: L; text: L[]; list?: L[] };
export type Meta = { title: string; description: string };
export type Guide = {
  path: GuidePath;
  offer: OfferPath;
  updated: string;
  meta: { ru: Meta; de: Meta; en: Meta };
  eyebrow: L;
  name: L;
  h1: L;
  lead: L;
  sections: GuideSection[];
  faq: { q: L; a: L }[];
  cta: L;
  links: { to: GuidePath | OfferPath | "/avv" | "/datenschutz" | "/preise" | "/industries"; label: L }[];
};

export const updated = "2026-11-06";
export const p = (ru: string, de: string, en: string): L => ({ ru, de, en });
export const money = (net: number): L => ({ ru: eur(net, "ru"), de: eur(net, "de"), en: eur(net, "en") });

export const toKosten = { to: "/ki-chatbot-kosten", label: p("Сколько стоит AI-чатбот", "Was kostet ein KI-Chatbot?", "What does an AI chatbot cost?") } as const;
export const toDsgvo = { to: "/ki-chatbot-dsgvo", label: p("AI-чатбот и DSGVO", "KI-Chatbot und DSGVO", "AI chatbots and GDPR") } as const;
export const toChatbot = { to: "/ki-chatbot-website", label: p("AI-чатбот для сайта", "KI-Chatbot für Ihre Website", "AI chatbot for your website") } as const;
export const toWebsite = { to: "/website-erstellen-lassen", label: p("Сайт под ключ", "Website erstellen lassen", "Business website, done for you") } as const;
export const toCrm = { to: "/crm-entwicklung", label: p("Индивидуальная CRM", "Individuelle CRM-Entwicklung", "Custom CRM development") } as const;
export const toBeratung = { to: "/beratung", label: p("Консультации", "Beratung", "Consulting") } as const;
export const toAvv = { to: "/avv", label: p("Договор об обработке данных (AVV)", "Auftragsverarbeitungsvertrag (AVV)", "Data processing agreement (AVV)") } as const;
export const toPrices = { to: "/preise", label: p("Все цены", "Alle Preise", "All prices") } as const;
export const toIndustries = { to: "/industries", label: p("Все отрасли", "Alle Branchen", "All industries") } as const;
