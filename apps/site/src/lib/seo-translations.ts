import { seoPages } from "@/lib/seo";

export const seoTranslations: Record<string, { en: string; de: string }> = {
  ...Object.fromEntries(Object.values(seoPages).flatMap((p) => [[p.title, { de: p.de.title, en: p.en.title }], [p.description, { de: p.de.description, en: p.en.description }]])),
  "Oprynex — сайты, CRM и AI-решения для бизнеса": { en: "Oprynex — websites, CRM and AI solutions for business", de: "Oprynex — Websites, CRM und KI-Lösungen für Unternehmen" },
  "AI-ассистенты для сайта, магазина и поддержки": { en: "AI assistants for websites, shops and support", de: "KI-Assistenten für Websites, Shops und Support" },
  "Решения для работы с клиентами по отраслям": { en: "Customer workflow solutions by industry", de: "Lösungen für Kundenprozesse nach Branche" },
  "Консультация по сайту, CRM и автоматизации": { en: "Website, CRM and automation consulting", de: "Beratung zu Website, CRM und Automatisierung" },
  "Частые вопросы о сайтах, ассистентах и проектах Oprynex": { en: "Frequently asked questions about websites, assistants and Oprynex projects", de: "Häufige Fragen zu Websites, Assistenten und Projekten von Oprynex" },
};
