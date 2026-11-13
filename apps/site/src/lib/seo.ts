import { faq } from "@/lib/content";
import { guides, type Guide, type GuidePath } from "@/lib/guides";
import { eur, offers, prices } from "@/lib/offers";
import { siteUrl } from "@/lib/site-url";
import { translations } from "@/lib/translations";

export { siteUrl };
export const ogImage = { url: `${siteUrl}/brand/oprynex-og.jpg`, width: 1200, height: 630, alt: "Oprynex – One Platform. Endless Possibilities." };

type Meta = { title: string; description: string };
type Page = Meta & { label: string; de: Meta & { label: string }; en: Meta };
const page = (label: string, ru: Meta, deLabel: string, de: Meta, en: Meta): Page => ({ ...ru, label, de: { ...de, label: deLabel }, en });

const guidePages = Object.fromEntries(guides.map((g) => [g.path, page(g.name.ru, g.meta.ru, g.name.de, g.meta.de, g.meta.en)])) as Record<GuidePath, Page>;

// Russian is the dictionary source; German is the SSR/default output.
// Commercial pages target title 50-65 chars and description 140-165 chars (GEO checklist).
export const seoPages = {
  ...guidePages,
  "/": page("Oprynex",
    { title: "AI-чатботы, CRM и сайты для бизнеса | Oprynex", description: "AI-чатботы для сайтов, сайты под ключ и индивидуальная разработка CRM для небольших компаний. Лично консультирует Max Mustermann." }, "Oprynex",
    { title: "KI-Chatbots, CRM & Websites für Unternehmen | Oprynex", description: "KI-Chatbots für Ihre Website, Websites schlüsselfertig und individuelle CRM-Entwicklung für kleine Unternehmen. Persönlich beraten von Max Mustermann." },
    { title: "AI chatbots, CRM & websites for business | Oprynex", description: "AI chatbots for your website, turnkey websites and custom CRM development for small businesses. Personal advice from Max Mustermann." }),
  "/ki-chatbot-website": page("AI-чатбот",
    { title: "AI-чатбот для сайта под ключ — Oprynex", description: "AI-чатбот для вашего сайта: ответы по утверждённым знаниям, встраивание в существующий сайт и передача сложных вопросов вашей команде." }, "KI-Chatbot",
    { title: "KI-Chatbot für die eigene Website erstellen lassen — Oprynex", description: "KI-Chatbot für Ihre Website: Antworten aus freigegebenen Inhalten, Einbindung in die bestehende Website und Übergabe komplexer Fragen an Ihr Team." },
    { title: "AI chatbot for your website, built for you — Oprynex", description: "AI chatbot for your website: answers from approved content, embedding into your existing site and handover of complex questions to your team." }),
  "/website-erstellen-lassen": page("Сайты",
    { title: "Разработка сайта для бизнеса под ключ — Oprynex", description: "Сайт для вашей компании под ключ: структура, тексты, дизайн, формы заявок, базовая SEO-оптимизация и передача — всё из одних рук." }, "Website",
    { title: "Website erstellen lassen für Ihr Unternehmen — Oprynex", description: "Website für Ihr Unternehmen erstellen lassen: Struktur, Texte, Design, Anfrageformulare, grundlegende SEO und Übergabe — alles aus einer Hand." },
    { title: "Business website development, done for you — Oprynex", description: "A website for your company, done for you: structure, copy, design, request forms, basic SEO and handover — everything from one source." }),
  "/crm-entwicklung": page("Разработка CRM",
    { title: "Индивидуальная разработка CRM под процессы — Oprynex", description: "Индивидуальная CRM под ваши этапы продаж и обслуживания: анализ процессов, поэтапная разработка, интеграции, внедрение и обучение команды." }, "CRM-Entwicklung",
    { title: "Individuelle CRM-Entwicklung für Ihre Prozesse — Oprynex", description: "Individuelle CRM-Entwicklung für Ihre Vertriebs- und Serviceabläufe: Prozessanalyse, Entwicklung in Etappen, Integrationen, Einführung und Schulung des Teams." },
    { title: "Custom CRM development for your workflows — Oprynex", description: "Custom CRM development for your sales and service workflows: process analysis, staged development, integrations, rollout and team training." }),
  "/beratung": page("Консультации",
    { title: "Консультации по сайту, CRM и AI по почте — Oprynex", description: `Письменные консультации по сайту, CRM и AI: бесплатный первый ответ, короткая консультация за ${eur(prices.consultHour, "ru")} или пакет «Анализ и план» за ${eur(prices.consultPackage, "ru")} с зачётом в заказ.` }, "Beratung",
    { title: "Beratung zu Website, CRM & KI per E-Mail — Oprynex", description: `Schriftliche Beratung zu Website, CRM und KI: erste Antwort kostenlos, Kurzberatung für ${eur(prices.consultHour, "de")} oder Paket Analyse & Plan für ${eur(prices.consultPackage, "de")}, anrechenbar auf Ihren Auftrag.` },
    { title: "Website, CRM & AI consulting by email — Oprynex", description: `Written consulting on websites, CRM and AI: a free first reply, a short consultation for ${eur(prices.consultHour, "en")} or the Analysis & plan package for ${eur(prices.consultPackage, "en")}, credited to your order.` }),
  "/preise": page("Цены",
    { title: "Цены на сайты, AI-чатботы и CRM — Oprynex", description: "Обзор цен Oprynex: сайт, AI-чатбот с ежемесячной работой, индивидуальная CRM и консультации. Стартовые цены без НДС, объём согласуется заранее." }, "Preise",
    { title: "Preise für Websites, KI-Chatbots und CRM — Oprynex", description: "Preisübersicht von Oprynex: Website, KI-Chatbot mit monatlichem Betrieb, individuelles CRM und Beratung. Netto-Startpreise, der Umfang wird vorab vereinbart." },
    { title: "Prices for websites, AI chatbots and CRM — Oprynex", description: "Oprynex price overview: website, AI chatbot with monthly operation, custom CRM and consulting. Net starting prices, scope agreed upfront." }),
  "/assistants": page("Ассистенты",
    { title: "AI-ассистенты для сайта и магазина — Oprynex", description: "Шесть типов AI-ассистентов для вопросов, заявок, магазина, записи и поддержки. Индивидуальное внедрение с базой знаний и правилами передачи человеку." }, "KI-Assistenten",
    { title: "KI-Assistenten für Websites und Shops — Oprynex", description: "Sechs KI-Assistenten für Fragen, Anfragen, Shops, Termine und Support. Individuelle Umsetzung mit Wissensbasis und Regeln für die Übergabe an Menschen." },
    { title: "AI assistants for websites and shops — Oprynex", description: "Six AI assistant types for questions, leads, shops, appointments and support. Custom implementation with a knowledge base and human handover rules." }),
  "/industries": page("Отрасли",
    { title: "Автоматизация работы с клиентами по отраслям — Oprynex", description: "Сценарии обработки обращений для недвижимости, ремесла, автосалонов, практик и магазинов. Подбор сайта, CRM и AI-ассистента под процессы вашего бизнеса." }, "Branchen",
    { title: "Kundenprozesse nach Branche automatisieren — Oprynex", description: "Anfragebearbeitung für Immobilien, Handwerk, Autohäuser, Praxen und Shops. Auswahl von Website, CRM und KI-Assistent passend zu Ihren Geschäftsprozessen." },
    { title: "Customer workflow automation by industry — Oprynex", description: "Request handling for property, trades, car dealerships, practices and shops. Website, CRM and AI assistant selection to suit your business processes." }),
  "/services": page("Услуги",
    { title: "Услуги: сайты, AI-чатботы и CRM — Oprynex", description: "Все предложения Oprynex: сайт под ключ, AI-чатбот для готового сайта или оба вместе, индивидуальная CRM и консультации." }, "Leistungen",
    { title: "Leistungen: Websites, KI-Chatbots und CRM — Oprynex", description: "Alle Angebote von Oprynex: Website schlüsselfertig, KI-Chatbot für Ihre bestehende Website oder beides zusammen, individuelles CRM und Beratung." },
    { title: "Services: websites, AI chatbots and CRM — Oprynex", description: "All Oprynex offers: a turnkey website, an AI chatbot for your existing website or both together, a custom CRM and consulting." }),
  "/contact": page("Консультация",
    { title: "Консультация по сайту, CRM и AI — Max Mustermann", description: "Обсудите задачи сайта, CRM или AI-ассистента с Max Mustermann. Опишите проект в форме: Max Mustermann лично изучит заявку и ответит по email." }, "Kontakt",
    { title: "Website-, CRM- und KI-Beratung — Max Mustermann", description: "Website, CRM oder KI-Assistent mit Max Mustermann besprechen: Beschreiben Sie Ihr Projekt im Formular, die Antwort kommt persönlich per E-Mail." },
    { title: "Website, CRM and AI consulting — Max Mustermann", description: "Discuss your website, CRM or AI assistant with Max Mustermann. Describe your project in the form: Max Mustermann reviews it personally and replies by email." }),
  "/faq": page("FAQ",
    { title: "Частые вопросы о сайтах, AI-ассистентах и проектах — Oprynex", description: "Ответы об AI-ассистентах, сайтах, стартовых ценах, языках и ходе проектов: что входит в работу и как начать." }, "FAQ",
    { title: "FAQ zu Websites, KI-Assistenten und Projekten — Oprynex", description: "Antworten zu KI-Assistenten, Websites, Startpreisen, Sprachen und Projektablauf: was enthalten ist und wie Sie mit Oprynex starten." },
    { title: "Website, AI assistant and project FAQ — Oprynex", description: "Answers about AI assistants, websites, starting prices, languages and project delivery: what is included and how to start with Oprynex." }),
  "/impressum": page("Сведения об операторе",
    { title: "Сведения об операторе — Oprynex", description: "Сведения об операторе сайта Oprynex по § 5 DDG: имя, адрес и контакт." }, "Impressum",
    { title: "Impressum — Oprynex", description: "Angaben zum Betreiber der Website Oprynex gemäß § 5 DDG: Name, Anschrift und Kontakt." },
    { title: "Legal notice — Oprynex", description: "Information about the operator of the Oprynex website under section 5 DDG: name, address and contact." }),
  "/datenschutz": page("Защита данных",
    { title: "Защита данных — Oprynex", description: "Статус публикации информации о защите персональных данных на сайте Oprynex." }, "Datenschutz",
    { title: "Datenschutz — Oprynex", description: "Datenschutzhinweise der Website Oprynex: Verantwortlicher, Kontaktformular, KI-Assistent und Ihre Rechte." },
    { title: "Data protection — Oprynex", description: "Data protection information of the Oprynex website: controller, contact form, AI assistant and your rights." }),
  "/agb": page("Общие условия",
    { title: "Общие условия — Oprynex", description: "Общие условия работы Oprynex с предпринимателями." }, "AGB",
    { title: "AGB — Oprynex", description: "Allgemeine Geschäftsbedingungen von Oprynex für Unternehmer: Leistungen, Preise, Haftung und Kündigung." },
    { title: "Terms and conditions — Oprynex", description: "Oprynex terms and conditions for businesses: services, prices, liability and termination." }),
  "/avv": page("Обработка данных по поручению",
    { title: "Договор обработки данных — Oprynex", description: "Договор обработки данных Oprynex по статье 28 DSGVO." }, "AVV",
    { title: "Auftragsverarbeitungsvertrag — Oprynex", description: "Auftragsverarbeitungsvertrag von Oprynex nach Art. 28 DSGVO mit Maßnahmen und Unterauftragsverarbeitern." },
    { title: "Data processing agreement — Oprynex", description: "Oprynex data processing agreement under Art. 28 GDPR with measures and subprocessors." }),
} as const satisfies Record<string, Page>;

export type SeoPath = keyof typeof seoPages;

// FAQPage schema (SSR default language). Built from the visible FAQ in content.ts so the markup can never differ from the page text.
const faqSchemaDe: [string, string][] = faq.map(([q, a]) => [translations[q]?.de ?? q, translations[a]?.de ?? a]);

const jsonLd = (data: Record<string, unknown>) => ({ type: "application/ld+json", children: JSON.stringify(data) });

const faqSchema = () => jsonLd({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "de",
  mainEntity: faqSchemaDe.map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  })),
});

// A guide is an article by the founder; its FAQPage is built from the visible questions.
const guideSchemas = (guide: Guide, url: string, title: string, description: string) => [
  jsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.h1.de,
    name: title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "de",
    datePublished: guide.updated,
    dateModified: guide.updated,
    image: ogImage.url,
    author: { "@type": "Person", name: "Max Mustermann" },
    publisher: { "@id": `${siteUrl}/#business` },
  }),
  jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "de",
    mainEntity: guide.faq.map((f) => ({ "@type": "Question", name: f.q.de, acceptedAnswer: { "@type": "Answer", text: f.a.de } })),
  }),
];

// Net starting prices (excl. 19 % VAT) shown on the pages, from the same registry.
const startNetPrice: Record<string, number | undefined> = {
  chatbot: prices.chatbot || undefined,
  website: prices.website || undefined,
  crm: prices.crm || undefined,
  consulting: prices.consultHour || undefined,
};

// Service markup for the offer pages.
const serviceSchema = (offer: (typeof offers)[number], url: string, description: string) => {
  const minPrice = startNetPrice[offer.id];
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: offer.name.de,
    description,
    url,
    serviceType: offer.h1.de,
    inLanguage: "de",
    provider: { "@id": `${siteUrl}/#business` },
    ...(minPrice !== undefined && {
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EUR",
        priceSpecification: { "@type": "PriceSpecification", minPrice, priceCurrency: "EUR", valueAddedTaxIncluded: false },
        seller: { "@id": `${siteUrl}/#business` },
      },
    }),
  });
};

export function pageHead(path: SeoPath) {
  const p: Page = seoPages[path];
  const { title, description, label } = p.de; // German is the default site language
  const url = `${siteUrl}${path}`;
  const offer = offers.find((o) => o.path === path);
  const guide = guides.find((g) => g.path === path);
  const scripts = path === "/"
    ? [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          name: "Oprynex",
          url,
          description,
          inLanguage: "de",
          publisher: { "@id": `${siteUrl}/#business` },
        }),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": `${siteUrl}/#business`,
          name: "Oprynex",
          url: siteUrl,
          description,
          logo: { "@type": "ImageObject", url: `${siteUrl}/brand/oprynex-logo.png`, width: 640, height: 554 },
          image: ogImage.url,
          slogan: "One Platform. Endless Possibilities.",
          founder: { "@type": "Person", name: "Max Mustermann" },
          inLanguage: "de",
        }),
        faqSchema(),
      ]
    : [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Oprynex", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: label, item: url },
          ],
        }),
        ...(path === "/faq" ? [faqSchema()] : []),
        ...(offer ? [serviceSchema(offer, url, description)] : []),
        ...(guide ? guideSchemas(guide, url, title, description) : []),
      ];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Oprynex" },
      { property: "og:url", content: url },
      { property: "og:locale", content: "de_DE" },
      { property: "og:image", content: ogImage.url },
      { property: "og:image:width", content: String(ogImage.width) },
      { property: "og:image:height", content: String(ogImage.height) },
      { property: "og:image:alt", content: ogImage.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage.url },
      { name: "twitter:image:alt", content: ogImage.alt },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}
