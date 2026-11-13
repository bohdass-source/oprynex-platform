import { readCookieConsent } from "@/lib/cookie-consent";

export type L = { ru: string; de: string; en: string };
export type Category = "software" | "ai" | "custom" | "consulting";
export type OfferPath = "/ki-chatbot-website" | "/website-erstellen-lassen" | "/crm-entwicklung" | "/beratung";

/** Net prices in euros excluding 19 % VAT. In this public demo every amount is hidden: `eur()` prints "XXX €".
 *  To use the site for real, set the amounts here and restore the number format in `eur()`; never write a price into a single string. */
export const prices = {
  chatbot: 0,
  chatbotMonthly: 0, // monthly operation of a client chatbot
  website: 0,
  crm: 0,
  consultHour: 0,
  consultPackage: 0, // package "Analyse & Plan", credited to a project ordered within consultCreditDays
  consultCreditDays: 30,
} as const;

type Lang = keyof L;
const locales: Record<Lang, string> = { ru: "ru-RU", de: "de-DE", en: "en-IE" };
/** Prices are hidden in the public demo. The real formatter was:
 *  new Intl.NumberFormat(locales[l], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount) */
export const eur = (_amount: number, _l: Lang): string => "XXX €";
export const priceLocales = locales;
/** One price in the three languages: the template receives the formatted net amount. */
const money = (net: number, text: Record<Lang, (amount: string) => string>): L => ({ ru: text.ru(eur(net, "ru")), de: text.de(eur(net, "de")), en: text.en(eur(net, "en")) });

export const categoryLabel: Record<Category, L> = {
  software: { ru: "Программное обеспечение", de: "Software", en: "Software" },
  ai: { ru: "AI-решение", de: "KI-Lösung", en: "AI solution" },
  custom: { ru: "Индивидуальная разработка", de: "Individuelle Entwicklung", en: "Custom development" },
  consulting: { ru: "Консультации", de: "Beratung", en: "Consulting" },
};

export type Offer = {
  id: string;
  path: OfferPath;
  category: Category;
  name: L;
  h1: L;
  short: L;
  intro: L;
  price: L;
  /** A second price line under the main price (the chatbot's monthly fee, the consulting package), on the card back and /preise. */
  priceNote?: L;
  /** Variants of one offer with their own price, shown on the offer page (consulting). */
  options?: { name: L; price: L; items: L[] }[];
  /** A note under the variants, e.g. how the package is credited to a project. */
  optionsNote?: L;
  included: L[];
  steps: L[];
  cta: L;
  ctaTo: "/preise" | "/contact";
};

const p = (ru: string, de: string, en: string): L => ({ ru, de, en });

export const offers: Offer[] = [
  {
    id: "chatbot", path: "/ki-chatbot-website", category: "ai",
    name: p("AI-чатбот для вашего сайта", "KI-Chatbot für Ihre Website", "AI chatbot for your website"),
    h1: p("AI-чатбот для вашего сайта под ключ", "KI-Chatbot für Ihre Website erstellen lassen", "Get an AI chatbot built for your website"),
    short: p("Ассистент отвечает по утверждённым знаниям и передаёт сложные вопросы человеку.", "Der Assistent antwortet auf Basis freigegebener Inhalte und übergibt komplexe Fragen an Ihr Team.", "The assistant answers from approved content and hands complex questions to your team."),
    intro: p("AI-чатбот для сайта отвечает посетителям на типовые вопросы — по материалам, которые вы утвердили: описаниям услуг, условиям, документам. Сложные или нестандартные вопросы он передаёт вашему сотруднику, а не выдумывает ответ. Внедрение включает сбор базы знаний, настройку границ ответов, встраивание в ваш действующий сайт и проверку на реальных сценариях. Менять сайт не обязательно: если платформа допускает интеграцию, ассистент работает на ней.", "Ein KI-Chatbot für Ihre Website beantwortet wiederkehrende Besucherfragen — auf Basis der Inhalte, die Sie freigegeben haben: Leistungsbeschreibungen, Konditionen, Dokumente. Komplexe oder ungewöhnliche Fragen übergibt er an Ihr Team, statt Antworten zu erfinden. Die Einrichtung umfasst den Aufbau der Wissensbasis, die Festlegung der Antwortgrenzen, die Einbindung in Ihre bestehende Website und den Test an echten Szenarien. Ihre Website muss nicht ersetzt werden: Lässt die Plattform eine Integration zu, arbeitet der Assistent darauf.", "An AI chatbot for your website answers recurring visitor questions — based on content you have approved: service descriptions, terms, documents. Complex or unusual questions are handed to your team instead of being made up. Setup includes building the knowledge base, defining answer limits, embedding into your existing website and testing against real scenarios. Your site does not need to be replaced: if the platform allows integration, the assistant runs on it."),
    price: money(prices.chatbot, { ru: (a) => `внедрение от ${a}, без НДС`, de: (a) => `Einrichtung ab ${a} netto`, en: (a) => `setup from ${a}, net` }),
    priceNote: money(prices.chatbotMonthly, { ru: (a) => `плюс ${a} в месяц за работу бота, без НДС`, de: (a) => `zzgl. ${a} pro Monat für den Betrieb, netto`, en: (a) => `plus ${a} per month for operation, net` }),
    included: [
      p("База знаний по вашим материалам", "Wissensbasis aus Ihren Inhalten", "Knowledge base from your content"),
      p("Встраивание в существующий сайт", "Einbindung in Ihre bestehende Website", "Embedding in your existing website"),
      p("Правила передачи человеку", "Regeln zur Übergabe an Mitarbeitende", "Human handover rules"),
      p("Ежемесячная работа бота: обновление знаний и наблюдение", "Monatlicher Betrieb: Pflege des Wissens und Überwachung", "Monthly operation: knowledge updates and monitoring"),
    ],
    steps: [
      p("Сбор материалов и границ ответов", "Inhalte und Antwortgrenzen festlegen", "Collect content and answer limits"),
      p("Настройка и проверка", "Einrichtung und Test", "Setup and testing"),
      p("Запуск на сайте", "Start auf Ihrer Website", "Launch on your website"),
    ],
    cta: p("Обсудить чатбот", "Chatbot anfragen", "Request a chatbot"), ctaTo: "/contact",
  },
  {
    id: "website", path: "/website-erstellen-lassen", category: "custom",
    name: p("Сайт для бизнеса под ключ", "Website erstellen lassen", "Business website, done for you"),
    h1: p("Разработка сайта для вашей компании", "Website erstellen lassen für Ihr Unternehmen", "Website development for your company"),
    short: p("От структуры и текстов до разработки, интеграций и передачи.", "Von Struktur und Texten bis zu Umsetzung, Integrationen und Übergabe.", "From structure and copy to build, integrations and handover."),
    intro: p("Сайт для бизнеса под ключ — это структура, тексты, дизайн, разработка и передача готового результата. Работа начинается с задачи: что сайт должен продавать или объяснять и какие заявки собирать. Затем — структура страниц, тексты, дизайн в вашем стиле, адаптивная вёрстка, формы заявок и базовая поисковая оптимизация. Перед передачей проверяем сайт на реальных сценариях. После запуска сайт можно связать с CRM и AI-ассистентом.", "Eine Website für Ihr Unternehmen schlüsselfertig: Struktur, Texte, Design, Umsetzung und Übergabe des fertigen Ergebnisses. Die Arbeit beginnt mit dem Ziel: Was soll die Website verkaufen oder erklären, und welche Anfragen soll sie sammeln? Dann folgen Seitenstruktur, Texte, Design in Ihrem Stil, Umsetzung für alle Geräte, Anfrageformulare und grundlegende Suchmaschinenoptimierung. Vor der Übergabe prüfen wir die Website an echten Szenarien. Nach dem Start lässt sie sich mit CRM und KI-Assistent verbinden.", "A business website done for you: structure, copy, design, build and handover of the finished result. The work starts with the goal: what should the website sell or explain, and which requests should it collect? Then come page structure, copy, design in your style, a build for all devices, request forms and basic search optimisation. Before handover we test the site against real scenarios. After launch it can be connected to your CRM and AI assistant."),
    price: money(prices.website, { ru: (a) => `от ${a}, без НДС`, de: (a) => `ab ${a} netto`, en: (a) => `from ${a}, net` }),
    included: [
      p("Структура и тексты страниц", "Seitenstruktur und Texte", "Page structure and copy"),
      p("Дизайн и адаптивная вёрстка", "Design und Umsetzung für alle Geräte", "Design and build for all devices"),
      p("Базовая поисковая оптимизация", "Grundlegende Suchmaschinenoptimierung", "Basic search optimisation"),
      p("Формы заявок и нужные интеграции", "Anfrageformulare und benötigte Integrationen", "Request forms and required integrations"),
    ],
    steps: [
      p("Задача и структура", "Ziel und Struktur", "Goal and structure"),
      p("Дизайн и разработка", "Design und Entwicklung", "Design and development"),
      p("Проверка и передача", "Prüfung und Übergabe", "Review and handover"),
    ],
    cta: p("Запросить сайт", "Website anfragen", "Request a website"), ctaTo: "/contact",
  },
  {
    id: "crm", path: "/crm-entwicklung", category: "custom",
    name: p("Индивидуальная разработка CRM", "Individuelle CRM-Entwicklung", "Custom CRM development"),
    h1: p("Индивидуальная CRM под ваши процессы", "Individuelles CRM entwickeln lassen", "Have a custom CRM developed"),
    short: p("Система под ваши реальные этапы продаж, обслуживания и внутренних операций.", "Ein System für Ihre tatsächlichen Abläufe in Vertrieb, Service und Organisation.", "A system built around your real sales, service and internal workflows."),
    intro: p("Индивидуальная CRM нужна, когда готовые системы не совпадают с вашими процессами: этапы продаж другие, роли особые, отчёты не те. Разработка начинается с анализа: как устроена работа, какие системы уже есть и что нельзя менять. Затем система создаётся поэтапно — с проверкой на ваших реальных сценариях. В объём входят интеграции с существующими инструментами, внедрение и обучение команды.", "Ein individuelles CRM ist sinnvoll, wenn Standard-Systeme nicht zu Ihren Abläufen passen: andere Vertriebsphasen, besondere Rollen, unpassende Berichte. Die Entwicklung beginnt mit der Analyse: Wie ist die Arbeit organisiert, welche Systeme gibt es bereits, was darf sich nicht ändern? Danach entsteht das System in Etappen — geprüft an Ihren echten Szenarien. Umfasst sind Integrationen mit vorhandenen Werkzeugen, die Einführung und die Schulung Ihres Teams.", "A custom CRM makes sense when off-the-shelf systems don't match your workflows: different sales stages, special roles, unsuitable reports. Development starts with analysis: how work is organised, which systems already exist and what must not change. The system is then built in stages — tested against your real scenarios. Included are integrations with existing tools, rollout and team training."),
    price: money(prices.crm, { ru: (a) => `бюджет проекта от ${a}, без НДС`, de: (a) => `Projektbudget ab ${a} netto`, en: (a) => `project budget from ${a}, net` }),
    included: [
      p("Анализ процессов и ролей", "Analyse von Abläufen und Rollen", "Process and role analysis"),
      p("Функции под ваши этапы работы", "Funktionen für Ihre Arbeitsschritte", "Features for your workflow stages"),
      p("Интеграции с существующими системами", "Integration bestehender Systeme", "Integration with existing systems"),
      p("Внедрение и обучение команды", "Einführung und Schulung des Teams", "Rollout and team training"),
    ],
    steps: [
      p("Анализ процессов", "Prozessanalyse", "Process analysis"),
      p("Поэтапная разработка", "Entwicklung in Etappen", "Staged development"),
      p("Внедрение и обучение", "Einführung und Schulung", "Rollout and training"),
    ],
    cta: p("Обсудить проект", "Projekt besprechen", "Discuss your project"), ctaTo: "/contact",
  },
  {
    id: "consulting", path: "/beratung", category: "consulting",
    name: p("Консультации по AI, CRM и цифровизации", "KI-, CRM- & Digitalberatung", "AI, CRM & digital consulting"),
    h1: p("Консультации по сайту, CRM и AI", "Beratung zu Website, CRM und KI", "Consulting on websites, CRM and AI"),
    short: p("Письменная консультация по почте: что нужно вашему бизнесу и в каком порядке.", "Schriftliche Beratung per E-Mail: was Ihr Unternehmen braucht und in welcher Reihenfolge.", "Written consulting by email: what your business needs and in which order."),
    intro: {
      ru: `Консультация помогает понять, что нужно вашему бизнесу, прежде чем тратить бюджет на разработку. Всё проходит письменно, по электронной почте: без звонков и встреч, в удобное для вас время. Первый ответ на вашу заявку бесплатный. Для одного вопроса есть короткая консультация за ${eur(prices.consultHour, "ru")}, для полного разбора пакет «Анализ и план» за ${eur(prices.consultPackage, "ru")}. Если в течение ${prices.consultCreditDays} дней после плана вы закажете сайт, чатбота или CRM, стоимость пакета засчитывается в этот заказ.`,
      de: `Eine Beratung zeigt, was Ihr Unternehmen wirklich braucht, bevor Budget in die Entwicklung fließt. Alles läuft schriftlich per E-Mail: ohne Telefonate und Termine, wann es Ihnen passt. Die erste Antwort auf Ihre Anfrage ist kostenlos. Für eine einzelne Frage gibt es die Kurzberatung für ${eur(prices.consultHour, "de")}, für eine vollständige Analyse das Paket „Analyse & Plan“ für ${eur(prices.consultPackage, "de")}. Beauftragen Sie innerhalb von ${prices.consultCreditDays} Tagen nach dem Plan eine Website, einen Chatbot oder ein CRM, wird der Paketpreis darauf angerechnet.`,
      en: `Consulting shows what your business really needs before budget goes into development. Everything happens in writing by email: no calls and no meetings, at a time that suits you. The first reply to your request is free. For a single question there is a short consultation for ${eur(prices.consultHour, "en")}, for a full review the “Analysis & plan” package for ${eur(prices.consultPackage, "en")}. If you order a website, a chatbot or a CRM within ${prices.consultCreditDays} days of the plan, the package price is credited to that order.`,
    },
    price: money(prices.consultHour, { ru: (a) => `${a} / час, без НДС`, de: (a) => `${a} / Stunde netto`, en: (a) => `${a} / hour, net` }),
    priceNote: money(prices.consultPackage, { ru: (a) => `Пакет «Анализ и план»: ${a}, засчитывается в заказ`, de: (a) => `Paket „Analyse & Plan“: ${a} netto, anrechenbar auf Ihren Auftrag`, en: (a) => `“Analysis & plan” package: ${a} net, credited to your order` }),
    included: [
      p("Первый ответ на заявку бесплатно", "Erste Antwort auf Ihre Anfrage kostenlos", "First reply to your request free of charge"),
      p("Короткая консультация: один вопрос, письменный ответ", "Kurzberatung: eine Frage, eine schriftliche Antwort", "Short consultation: one question, one written answer"),
      p("Пакет «Анализ и план»: письменный план на 3–5 страниц", "Paket „Analyse & Plan“: schriftlicher Plan auf 3 bis 5 Seiten", "“Analysis & plan” package: a written plan of 3 to 5 pages"),
      p("Всё по электронной почте, без звонков и встреч", "Alles per E-Mail, ohne Telefonate und Termine", "Everything by email, no calls and no meetings"),
    ],
    steps: [
      p("Вы описываете задачу в форме", "Sie beschreiben Ihre Aufgabe im Formular", "You describe your task in the form"),
      p("Бесплатный первый ответ и выбор варианта", "Kostenlose erste Antwort und Wahl der Variante", "Free first reply and choice of option"),
      p("Письменный ответ или план по почте", "Schriftliche Antwort oder Plan per E-Mail", "Written answer or plan by email"),
    ],
    options: [
      {
        name: p("Первый ответ", "Erste Antwort", "First reply"),
        price: p("Бесплатно", "Kostenlos", "Free"),
        items: [
          p("Вы описываете задачу в форме или пишете на почту", "Sie beschreiben Ihre Aufgabe im Formular oder per E-Mail", "You describe your task in the form or by email"),
          p("Короткий ответ, что вам подходит: сайт, чатбот, оба вместе или CRM", "Eine kurze Antwort, was zu Ihnen passt: Website, Chatbot, beides zusammen oder CRM", "A short reply on what fits you: website, chatbot, both together or CRM"),
        ],
      },
      {
        name: p("Короткая консультация", "Kurzberatung", "Short consultation"),
        price: money(prices.consultHour, { ru: (a) => `${a} без НДС`, de: (a) => `${a} netto`, en: (a) => `${a} net` }),
        items: [
          p("Один конкретный вопрос, например подойдёт ли чатбот к вашему сайту", "Eine konkrete Frage, zum Beispiel ob ein Chatbot zu Ihrer Website passt", "One specific question, for example whether a chatbot fits your website"),
          p("Мы смотрим ваш сайт и материалы", "Wir sehen uns Ihre Website und Unterlagen an", "We look at your website and materials"),
          p("Письменный ответ с рекомендацией, до 1 часа работы", "Schriftliche Antwort mit Empfehlung, bis zu 1 Stunde Arbeit", "A written answer with a recommendation, up to 1 hour of work"),
        ],
      },
      {
        name: p("Пакет «Анализ и план»", "Paket „Analyse & Plan“", "“Analysis & plan” package"),
        price: money(prices.consultPackage, { ru: (a) => `${a} без НДС`, de: (a) => `${a} netto`, en: (a) => `${a} net` }),
        items: [
          p("Короткая анкета по почте о вашей фирме, клиентах и задаче", "Ein kurzer Fragebogen per E-Mail zu Ihrem Unternehmen, Ihren Kunden und Ihrer Aufgabe", "A short questionnaire by email about your company, customers and task"),
          p("Разбор вашего сайта и того, как к вам приходят заявки", "Prüfung Ihrer Website und des Wegs, auf dem Anfragen zu Ihnen kommen", "A review of your website and how requests reach you"),
          p("Письменный план на 3–5 страниц: что мешает, варианты, порядок и стоимость", "Ein schriftlicher Plan auf 3 bis 5 Seiten: was bremst, Optionen, Reihenfolge und Kosten", "A written plan of 3 to 5 pages: what holds you back, options, order and cost"),
          p("Один раунд уточняющих вопросов по почте", "Eine Runde Rückfragen per E-Mail", "One round of follow-up questions by email"),
        ],
      },
    ],
    optionsNote: {
      ru: `Зачёт пакета: если в течение ${prices.consultCreditDays} дней после получения плана вы закажете сайт, чатбота или CRM, ${eur(prices.consultPackage, "ru")} вычитаются из цены заказа. Пример: сайт от ${eur(prices.website, "ru")}, после зачёта вы доплачиваете ${eur(prices.website - prices.consultPackage, "ru")}. Если вы закажете позже или не закажете, пакет остаётся оплатой за консультацию. Все цены без НДС.`,
      de: `Anrechnung: Beauftragen Sie innerhalb von ${prices.consultCreditDays} Tagen nach Erhalt des Plans eine Website, einen Chatbot oder ein CRM, ziehen wir ${eur(prices.consultPackage, "de")} vom Auftragspreis ab. Beispiel: Website ab ${eur(prices.website, "de")}, nach der Anrechnung zahlen Sie ${eur(prices.website - prices.consultPackage, "de")}. Beauftragen Sie später oder gar nicht, bleibt das Paket die Vergütung für die Beratung. Alle Preise netto.`,
      en: `Credit: if you order a website, a chatbot or a CRM within ${prices.consultCreditDays} days of receiving the plan, we deduct ${eur(prices.consultPackage, "en")} from the order price. Example: a website from ${eur(prices.website, "en")}, after the credit you pay ${eur(prices.website - prices.consultPackage, "en")}. If you order later or not at all, the package remains the fee for the consultation. All prices net.`,
    },
    cta: p("Описать задачу", "Aufgabe beschreiben", "Describe your task"), ctaTo: "/contact",
  },
];

export const offerByPath = (path: OfferPath) => offers.find((o) => o.path === path)!;

/** Records a per-service conversion event for Google Ads / Tag Manager (dataLayer). */
export function trackConversion(service: string, action: string) {
  if (typeof window === "undefined" || readCookieConsent() !== "accepted") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event: "oprynex_conversion", service, action });
}
