import type { L, Offer } from "@/lib/offers";

const x = (ru: string, de: string, en: string): L => ({ ru, de, en });

export type ExampleRow = { kind: "visitor" | "assistant" | "tag"; text: L };
export type Example = {
  id: string;
  caption: L;
  overview: L;
  left: { label: L; rows: ExampleRow[] };
  right: { label: L; title: L; meta: L; steps: L[]; note: L };
};
const row = (kind: ExampleRow["kind"], ru: string, de: string, en: string): ExampleRow => ({ kind, text: x(ru, de, en) });

// Landing copy follows the visual system rules: no hyphens, sentence case, no exclamation marks.
// Prices stay out of the landing until the owner approves them (see roadmap.md).
export const landing = {
  skip: x("Перейти к содержимому", "Zum Inhalt springen", "Skip to content"),
  nav: {
    assistants: x("Ассистенты", "Assistenten", "Assistants"),
    industries: x("Отрасли", "Branchen", "Industries"),
    services: x("Услуги", "Leistungen", "Services"),
    pricing: x("Цены", "Preise", "Pricing"),
    faq: x("FAQ", "FAQ", "FAQ"),
    menu: x("Меню", "Menü", "Menu"),
    close: x("Закрыть меню", "Menü schließen", "Close menu"),
    open: x("Открыть меню", "Menü öffnen", "Open menu"),
    language: x("Язык", "Sprache", "Language"),
    themeLight: x("Включить светлую тему", "Helles Design aktivieren", "Switch to light theme"),
    themeDark: x("Включить тёмную тему", "Dunkles Design aktivieren", "Switch to dark theme"),
    primary: x("Основная навигация", "Hauptnavigation", "Main navigation"),
  },
  cta: x("Обсудить задачу", "Aufgabe besprechen", "Discuss your task"),
  heroExamplesLabel: x("Примеры по продуктам", "Beispiele je Produkt", "Examples by product"),
  carousel: {
    prev: x("Назад", "Zurück", "Previous"),
    next: x("Далее", "Weiter", "Next"),
    pause: x("Остановить автопрокрутку", "Automatischen Wechsel anhalten", "Pause automatic rotation"),
    play: x("Включить автопрокрутку", "Automatischen Wechsel starten", "Start automatic rotation"),
  },
  // Case card in the hero: three views of one case.
  caseCard: {
    tabs: [x("Обзор", "Überblick", "Overview"), x("Основные моменты", "Wichtige Punkte", "Key points"), x("Подробно", "Im Detail", "In detail")],
    views: x("Вид карточки", "Ansicht der Karte", "Card view"),
    steps: x("Ход работы", "Ablauf", "Progress"),
  },
  intro: {
    skip: x("Пропустить заставку", "Intro überspringen", "Skip intro"),
  },

  // The badge, headline and subline are the owner's own wording from the first version of the site, so they keep
  // their hyphens (the copy test leaves them out). The intro slogan is built from the same headline.
  hero: {
    badge: x("Oprynex · Программное обеспечение и цифровые решения", "Oprynex · Software & Digital Solutions", "Oprynex · Software & digital solutions"),
    title: [
      x("AI-чатботы, CRM и", "KI-Chatbots, CRM und", "AI chatbots, CRM and"),
      x("сайты для бизнеса", "Websites für Unternehmen", "websites for business"),
    ],
    sub: x(
      "От сайта с AI-ассистентом до CRM под ваши процессы: мы связываем сайты, AI-ассистентов и работу с клиентами в подходящие цифровые решения.",
      "Von der Website mit KI-Assistent bis zum CRM nach Maß: Wir verbinden Websites, KI-Assistenten und Kundenprozesse in passenden digitalen Lösungen.",
      "From a website with an AI assistant to a CRM built for your workflow: we connect websites, AI assistants and customer processes into fitting digital solutions.",
    ),
  },

  // The illustration in the hero: one pair of windows per product. The left window is what the customer sees, the right
  // one is what happens on your side. Same two windows for every product, in a carousel.
  examples: [
    {
      id: "chatbot",
      caption: x("Пример: от вопроса посетителя до ответа из ваших материалов", "Beispiel: von der Besucherfrage zur Antwort aus Ihren Inhalten", "Example: from a visitor question to an answer from your content"),
      overview: x("Ассистент отвечает только по утверждённым вами материалам, а всё остальное передаёт вашей команде.", "Der Assistent antwortet nur aus Inhalten, die Sie freigegeben haben, und gibt alles andere an Ihr Team weiter.", "The assistant answers only from content you approved and passes everything else to your team."),
      left: { label: x("Ваш сайт", "Ihre Website", "Your website"), rows: [
        row("visitor", "Что входит в пакет?", "Was gehört zum Paket?", "What is included in the package?"),
        row("assistant", "По вашему описанию услуг: анализ, настройка и проверка. Цену я не называю, вопрос уйдёт вашей команде.", "Laut Ihrer Leistungsbeschreibung: Analyse, Einrichtung und Test. Preise nenne ich nicht, die Frage geht an Ihr Team.", "According to your service description: analysis, setup and testing. I do not quote prices, the question goes to your team."),
        row("tag", "Вопрос передан вашей команде", "Frage an Ihr Team übergeben", "Question handed to your team"),
      ] },
      right: {
        label: x("База знаний", "Wissensbasis", "Knowledge base"),
        title: x("Утверждённые материалы", "Freigegebene Inhalte", "Approved content"),
        meta: x("Источник: описание услуг", "Quelle: Leistungsbeschreibung", "Source: service description"),
        steps: [x("Материалы собраны", "Inhalte gesammelt", "Content collected"), x("Границы ответов заданы", "Antwortgrenzen festgelegt", "Answer limits set"), x("Проверка на реальных вопросах", "Test an echten Fragen", "Tested on real questions"), x("Запуск на сайте", "Start auf der Website", "Live on the website")],
        note: x("Ассистент отвечает только по утверждённому", "Der Assistent antwortet nur aus Freigegebenem", "The assistant answers only from approved content"),
      },
    },
    {
      id: "website",
      caption: x("Пример: от нового сайта до заявки", "Beispiel: von der neuen Website zur Anfrage", "Example: from the new website to a request"),
      overview: x("Сайт под ключ: структура, тексты, дизайн и формы, из которых заявки попадают прямо в ваш процесс.", "Eine Website schlüsselfertig: Struktur, Texte, Design und Formulare, aus denen Anfragen direkt in Ihren Ablauf gelangen.", "A website done for you: structure, copy, design and forms that feed requests straight into your workflow."),
      left: { label: x("Ваш новый сайт", "Ihre neue Website", "Your new website"), rows: [
        row("visitor", "Хочу запросить предложение.", "Ich möchte ein Angebot anfragen.", "I would like to request a quote."),
        row("assistant", "Заполните короткую форму, ответ придёт на почту. Согласие на обработку данных нужно один раз.", "Füllen Sie das kurze Formular aus, die Antwort kommt per Mail. Die Einwilligung ist einmalig nötig.", "Fill in the short form, the answer arrives by mail. Consent is needed once."),
        row("tag", "Форма отправлена", "Formular abgeschickt", "Form submitted"),
      ] },
      right: {
        label: x("Проект сайта", "Projektstand", "Project status"),
        title: x("Сайт для вашей компании", "Website für Ihr Unternehmen", "Website for your company"),
        meta: x("Объём согласован до старта", "Umfang vor dem Start vereinbart", "Scope agreed before the start"),
        steps: [x("Структура и тексты", "Struktur und Texte", "Structure and copy"), x("Дизайн для всех устройств", "Design für alle Geräte", "Design for all devices"), x("Формы и поисковая оптимизация", "Formulare und Suchmaschinenoptimierung", "Forms and search optimisation"), x("Проверка и передача", "Prüfung und Übergabe", "Review and handover")],
        note: x("Связывается с CRM и ассистентом", "Lässt sich mit CRM und Assistent verbinden", "Can be connected to CRM and assistant"),
      },
    },
    {
      id: "crm",
      caption: x("Пример: от вашего процесса до подходящей CRM", "Beispiel: von Ihrem Ablauf zum passenden CRM", "Example: from your workflow to a fitting CRM"),
      overview: x("CRM под ваши этапы и роли вместо того, чтобы подгонять процесс под чужую систему.", "Ein CRM für Ihre Phasen und Rollen, statt Ihren Ablauf an ein fremdes System anzupassen.", "A CRM built around your stages and roles instead of bending your workflow to someone else's system."),
      left: { label: x("Ваш процесс", "Ihr Ablauf", "Your workflow"), rows: [
        row("visitor", "У нас четыре этапа: запрос, осмотр, предложение, заказ.", "Bei uns gibt es vier Phasen: Anfrage, Termin vor Ort, Angebot, Auftrag.", "We have four stages: request, site visit, quote, order."),
        row("assistant", "Тогда система повторит именно эти этапы, с ролями для продаж и сервиса.", "Dann bildet das System genau diese Phasen ab, mit Rollen für Vertrieb und Service.", "Then the system mirrors exactly these stages, with roles for sales and service."),
        row("tag", "Этапы и роли заданы", "Phasen und Rollen festgelegt", "Stages and roles defined"),
      ] },
      right: {
        label: x("Ваша CRM", "Ihr CRM", "Your CRM"),
        title: x("Ход проекта", "Projektstand", "Project status"),
        meta: x("Роли: продажи, сервис", "Rollen: Vertrieb, Service", "Roles: sales, service"),
        steps: [x("Анализ процессов", "Prozessanalyse", "Process analysis"), x("Этапы в системе", "Phasen im System", "Stages in the system"), x("Интеграции", "Integrationen", "Integrations"), x("Внедрение и обучение", "Einführung und Schulung", "Rollout and training")],
        note: x("Поэтапный запуск и обучение команды", "Einführung in Etappen mit Schulung", "Staged rollout with team training"),
      },
    },
    {
      id: "consulting",
      caption: x("Пример: от разговора до письменных рекомендаций", "Beispiel: vom Gespräch zu schriftlichen Empfehlungen", "Example: from a conversation to written recommendations"),
      overview: x("Разбор процессов и письменные рекомендации: что нужно, в каком порядке, а что не нужно вовсе.", "Analyse Ihrer Abläufe und schriftliche Empfehlungen: was nötig ist, in welcher Reihenfolge und was gar nicht.", "A review of your workflows and written recommendations: what is needed, in which order and what is not."),
      left: { label: x("По почте", "Per Mail", "By email"), rows: [
        row("visitor", "Не знаем, что нам нужно: CRM, сайт или ассистент.", "Wir wissen nicht, ob wir CRM, Website oder Assistent brauchen.", "We do not know whether we need a CRM, a website or an assistant."),
        row("assistant", "Разберём вашу задачу письменно и честно скажем, что нужно, а что нет.", "Wir prüfen Ihre Aufgabe schriftlich und sagen ehrlich, was nötig ist und was nicht.", "We review your task in writing and say honestly what is needed and what is not."),
        row("tag", "План отправлен на почту", "Plan per Mail verschickt", "Plan sent by email"),
      ] },
      right: {
        label: x("Рекомендации", "Empfehlungen", "Recommendations"),
        title: x("Следующие шаги", "Nächste Schritte", "Next steps"),
        meta: x("Письменно, по электронной почте", "Schriftlich per Mail", "In writing by email"),
        steps: [x("Процессы разобраны", "Abläufe geprüft", "Workflows reviewed"), x("Варианты сравнены", "Optionen verglichen", "Options compared"), x("Рекомендации написаны", "Empfehlungen geschrieben", "Recommendations written"), x("Следующие шаги согласованы", "Nächste Schritte vereinbart", "Next steps agreed")],
        note: x("Если решение не нужно, мы так и скажем", "Wenn keine Lösung nötig ist, sagen wir das", "If no solution is needed, we say so"),
      },
    },
  ] as Example[],

  // Proof signals that the codebase actually supports (see AGENTS.md); no invented customers or numbers.
  trust: [
    { icon: "approved", text: x("Ответы только по материалам, которые вы утвердили", "Antworten nur aus Inhalten, die Sie freigegeben haben", "Answers only from content you approved") },
    { icon: "handover", text: x("Сложные вопросы уходят вашей команде, а не выдумываются", "Komplexe Fragen gehen an Ihr Team, statt erfunden zu werden", "Complex questions go to your team instead of being invented") },
    { icon: "data", text: x("Данные во Франкфурте, тексты чата не сохраняются", "Daten liegen in Frankfurt, Chattexte werden nicht gespeichert", "Data stays in Frankfurt, chat texts are not stored") },
    { icon: "consent", text: x("Согласие перед каждой формой и любым трекингом", "Einwilligung vor jedem Formular und jedem Tracking", "Consent before every form and any tracking") },
  ],

  problem: {
    eyebrow: x("Знакомая ситуация", "Die Ausgangslage", "The starting point"),
    title: x("Обращения теряются между почтой, мессенджерами и таблицами", "Anfragen verschwinden zwischen Postfach, Messenger und Tabellen", "Requests disappear between inbox, messengers and spreadsheets"),
    beforeLabel: x("Сейчас", "Heute", "Today"),
    before: [
      x("Посетитель не находит ответ и уходит с сайта.", "Besucher finden keine Antwort und verlassen die Website.", "Visitors find no answer and leave the website."),
      x("Сотрудники каждый день повторяют одни и те же ответы.", "Ihr Team beantwortet jeden Tag dieselben Fragen.", "Your team answers the same questions every day."),
      x("Никто не знает точно, кто отвечает за запрос.", "Niemand weiß sicher, wer für eine Anfrage zuständig ist.", "Nobody knows for sure who owns a request."),
      x("Сайт живёт отдельно от продаж и обслуживания.", "Die Website lebt getrennt von Vertrieb und Service.", "The website lives apart from sales and service."),
    ],
    afterLabel: x("С Oprynex", "Mit Oprynex", "With Oprynex"),
    flow: [
      { title: x("Вопрос на сайте", "Frage auf der Website", "Question on the website"), text: x("Посетитель спрашивает там, где ему удобно.", "Der Besucher fragt dort, wo er gerade ist.", "The visitor asks right where they are.") },
      { title: x("Ответ или передача", "Antwort oder Übergabe", "Answer or handover"), text: x("Ассистент отвечает по знаниям или передаёт в CRM.", "Der Assistent antwortet aus Ihrem Wissen oder übergibt ans CRM.", "The assistant answers from your knowledge or hands over to the CRM.") },
      { title: x("Обработка", "Bearbeitung", "Handling"), text: x("У запроса есть ответственный, статус и история.", "Die Anfrage hat einen Zuständigen, einen Status und einen Verlauf.", "The request has an owner, a status and a history.") },
      { title: x("Закрытие", "Abschluss", "Closing"), text: x("Результат виден всей команде, ничего не потеряно.", "Das Ergebnis ist für das ganze Team sichtbar, nichts geht verloren.", "The result is visible to the whole team, nothing is lost.") },
    ],
  },

  solutions: {
    eyebrow: x("Решения", "Lösungen", "Solutions"),
    title: x("Четыре решения и один ответственный от начала до конца", "Vier Lösungen und ein Ansprechpartner von Anfang bis Ende", "Four solutions and one point of contact from start to finish"),
    intro: x("Сайт, ассистент к готовому сайту, оба вместе, CRM или консультация. Выберите то, что нужно сейчас, остальное можно добавить позже.", "Website, Assistent für Ihre bestehende Website, beides zusammen, CRM oder Beratung. Wählen Sie, was Sie jetzt brauchen, alles andere lässt sich später ergänzen.", "A website, an assistant for your existing website, both together, a CRM or consulting. Pick what you need now, everything else can be added later."),
    fitLabel: x("Подходит, если", "Passt, wenn", "A fit when"),
    // Landing labels and outcome lines per offer id; description, bullets and CTA come from the offers registry.
    items: {
      chatbot: {
        label: x("Чатбот для сайта", "Chatbot für Ihre Website", "Chatbot for your website"),
        outcome: x("Типовые вопросы закрывает ассистент, остальное остаётся вашей команде", "Wiederkehrende Fragen beantwortet der Assistent, den Rest Ihr Team", "The assistant handles recurring questions, your team handles the rest"),
        fit: x("Сотрудники повторяют одни и те же ответы", "Ihr Team beantwortet immer dieselben Fragen", "Your team keeps answering the same questions"),
      },
      website: {
        label: x("Сайт для бизнеса", "Website für Ihr Unternehmen", "Website for your business"),
        outcome: x("Сайт, который собирает заявки, а не только рассказывает о вас", "Eine Website, die Anfragen sammelt, statt nur zu informieren", "A website that collects requests instead of only informing"),
        fit: x("Нужен новый сайт", "Sie brauchen eine neue Website", "You need a new website"),
      },
      crm: {
        label: x("Индивидуальная CRM", "Individuelles CRM", "Custom CRM"),
        outcome: x("Система подстраивается под ваши процессы, а не наоборот", "Ein System, das Ihren Abläufen folgt und nicht umgekehrt", "A system that follows your workflow, not the other way round"),
        fit: x("Готовая CRM не подходит к процессам", "Ein Standard CRM passt nicht zu Ihren Abläufen", "An off the shelf CRM does not fit your workflow"),
      },
      consulting: {
        label: x("Консультация по AI и CRM", "Beratung zu KI und CRM", "AI and CRM consulting"),
        outcome: x("Ясность, каким должен быть следующий шаг", "Klarheit über den richtigen nächsten Schritt", "Clarity on the right next step"),
        fit: x("Непонятно, с чего начать", "Unklar, wo Sie anfangen sollen", "Not sure where to start"),
      },
    } as Record<string, { label: L; outcome: L; fit: L }>,
    details: x("Подробнее о решении", "Details zur Lösung", "Solution details"),
  },

  tagline: {
    label: x("Что вы получаете", "Was Sie bekommen", "What you get"),
    text: x(
      "Сайт, который отвечает. CRM, которая ничего не забывает. Один партнёр на всё.",
      "Eine Website, die antwortet. Ein CRM, das nichts vergisst. Ein Ansprechpartner für alles.",
      "A website that answers. A CRM that forgets nothing. One partner for all of it.",
    ),
  },

  process: {
    eyebrow: x("Как проходит работа", "Der Ablauf", "How it works"),
    step: x("Шаг", "Schritt", "Step"),
    title: x("Три шага от задачи до результата", "In drei Schritten von der Aufgabe zum Ergebnis", "Three steps from task to result"),
    steps: [
      { title: x("Обсудить задачу", "Aufgabe besprechen", "Discuss the task"), text: x("Вы рассказываете, что мешает работе с клиентами. Мы выясняем процессы, текущие системы и то, что менять нельзя.", "Sie beschreiben, was im Umgang mit Kunden gerade bremst. Wir klären Abläufe, vorhandene Systeme und was sich nicht ändern darf.", "You describe what slows down your customer work. We clarify workflows, existing systems and what must not change.") },
      { title: x("Зафиксировать объём", "Umfang festlegen", "Fix the scope"), text: x("Вы получаете предложение: сайт, ассистент, оба вместе или CRM. Что входит в работу и что нет, мы фиксируем до старта.", "Sie erhalten einen Vorschlag: Website, Assistent, beides zusammen oder CRM. Was enthalten ist und was nicht, halten wir vor dem Start fest.", "You receive a proposal: website, assistant, both together or CRM. What is included and what is not, we fix before work starts.") },
      { title: x("Сделать, проверить, передать", "Umsetzen, prüfen, übergeben", "Build, test, hand over"), text: x("Работаем по этапам, проверяем на ваших реальных сценариях и передаём результат. Дальнейшие улучшения по договорённости.", "Wir bauen in Etappen, prüfen an Ihren echten Szenarien und übergeben das Ergebnis. Weitere Verbesserungen nach Absprache.", "We build in stages, test against your real scenarios and hand over the result. Further improvements by agreement.") },
    ],
  },

  assistants: {
    eyebrow: x("Ассистенты", "Assistenten", "Assistants"),
    title: x("Шесть ассистентов, у каждого своя задача и чёткие границы", "Sechs Assistenten, jeder mit einer Aufgabe und klaren Grenzen", "Six assistants, each with one task and clear limits"),
    intro: x("Не универсальный бот, который делает вид, что знает всё, а инструмент с понятными границами.", "Kein Bot, der vorgibt, alles zu wissen, sondern ein Werkzeug mit klaren Grenzen.", "Not a bot that pretends to know everything, but a tool with clear limits."),
    // Same order as the assistants list in content.ts.
    names: [
      x("Ассистент для сайта", "Assistent für die Website", "Website assistant"),
      x("Ассистент магазина", "Assistent für den Shop", "Shop assistant"),
      x("Ассистент корзины", "Assistent für den Warenkorb", "Cart assistant"),
      x("Ассистент по заявкам", "Assistent für Anfragen", "Request assistant"),
      x("Ассистент записи", "Assistent für Termine", "Booking assistant"),
      x("Ассистент поддержки", "Assistent für den Support", "Support assistant"),
    ],
    task: x("Задача", "Aufgabe", "Task"),
    limit: x("Граница", "Grenze", "Limit"),
    list: x("Выберите ассистента", "Assistent wählen", "Choose an assistant"),
    try: x("Попробовать ассистента на сайте", "Assistenten direkt ausprobieren", "Try the assistant live"),
    all: x("Все границы ассистентов", "Alle Grenzen im Überblick", "All assistant limits"),
  },

  pricing: {
    eyebrow: x("Цены", "Preise", "Pricing"),
    title: x("Три модели оплаты, объём согласуется заранее", "Drei Preismodelle, der Umfang wird vorab vereinbart", "Three pricing models, scope agreed upfront"),
    models: [
      { name: x("Цена проекта", "Projektpreis", "Project price"), who: x("Сайт, чатбот, CRM", "Website, Chatbot, CRM", "Website, chatbot, CRM"), text: x("Называем после знакомства с задачей и согласования объёма, а не заранее наугад.", "Wir nennen ihn nach der Analyse Ihrer Aufgabe und der Abstimmung des Umfangs, nicht vorab geraten.", "We quote it after analysing your task and agreeing the scope, not guessed in advance.") },
      { name: x("Работа ассистента", "Betrieb des Assistenten", "Running the assistant"), who: x("Чатбот на сайте", "Chatbot auf der Website", "Chatbot on the website"), text: x("Небольшая ежемесячная оплата: мы обновляем знания ассистента и следим за его ответами.", "Ein kleiner Monatsbetrag: Wir pflegen das Wissen des Assistenten und behalten seine Antworten im Blick.", "A small monthly fee: we keep the assistant\u2019s knowledge current and watch its answers.") },
      { name: x("Консультации", "Beratung", "Consulting"), who: x("По почте", "Per Mail", "By email"), text: x("Первый ответ бесплатно. Короткая консультация за час или пакет «Анализ и план» с письменным планом. Всё письменно, без звонков.", "Die erste Antwort ist kostenlos. Kurzberatung pro Stunde oder das Paket Analyse & Plan mit schriftlichem Plan. Alles schriftlich, ohne Telefonate.", "The first reply is free. A short consultation by the hour or the Analysis & plan package with a written plan. Everything in writing, no calls.") },
    ],
    note: x("Все цены указываются без НДС. Точный объём согласуется до начала работы.", "Alle Preise zzgl. MwSt. Der genaue Umfang wird vor Beginn vereinbart.", "All prices exclude VAT. Exact scope is agreed before work starts."),
    all: x("Все цены", "Alle Preise", "All prices"),
  },

  faq: {
    eyebrow: x("Вопросы и ответы", "Fragen und Antworten", "Questions and answers"),
    title: x("Частые вопросы", "Häufige Fragen", "Frequently asked questions"),
    more: x("Все вопросы и ответы", "Alle Fragen im Überblick", "See every question"),
  },

  final: {
    title: x("Расскажите, что сейчас мешает работе с клиентами", "Erzählen Sie uns, was bei der Kundenarbeit gerade bremst", "Tell us what is slowing down your customer work"),
    text: x("Мы разберёмся в задаче и предложим подходящий вариант. Или честно скажем, если он вам не нужен.", "Wir klären die Aufgabe und schlagen eine passende Lösung vor. Oder sagen Ihnen ehrlich, wenn Sie keine brauchen.", "We will work through the task and suggest a fitting option. Or tell you honestly if you do not need one."),
    points: [
      x("Личный ответ с понедельника по субботу, с 9 до 20 часов по берлинскому времени", "Persönliche Antwort von Montag bis Samstag, 9 bis 20 Uhr Berliner Zeit", "Personal reply Monday to Saturday, 9 to 20 Berlin time"),
      x("Объём согласуется до начала работы", "Umfang vor Beginn vereinbart", "Scope agreed before work starts"),
      x("Честная оценка без давления", "Ehrliche Einschätzung ohne Druck", "An honest assessment, no pressure"),
    ],
  },

  footer: {
    about: x("Max Mustermann. Сайты, ассистенты на основе ИИ и CRM из одних рук.", "Max Mustermann. Websites, Assistenten mit KI und CRM aus einer Hand.", "Max Mustermann. Websites, AI assistants and CRM from one source."),
    solutions: x("Решения", "Lösungen", "Solutions"),
    company: x("Oprynex", "Oprynex", "Oprynex"),
    legal: x("Правовая информация", "Rechtliches", "Legal"),
    links: {
      assistants: x("Ассистенты", "Assistenten", "Assistants"),
      industries: x("Отрасли", "Branchen", "Industries"),
      services: x("Все услуги", "Alle Leistungen", "All services"),
      pricing: x("Цены", "Preise", "Pricing"),
      faq: x("FAQ", "FAQ", "FAQ"),
      contact: x("Контакты", "Kontakt", "Contact"),
      imprint: x("Сведения об операторе", "Impressum", "Legal notice"),
      privacy: x("Защита данных", "Datenschutz", "Data protection"),
      terms: x("Общие условия", "AGB", "Terms"),
      cookies: x("Настройки cookies", "Cookie Einstellungen", "Cookie settings"),
    },
    toTop: x("Наверх", "Nach oben", "Back to top"),
  },
};

type SolutionCopy = { label: L; outcome: L; fit: L };

/** Landing copy for an offer; falls back to the registry text so a new offer still renders. */
export function solutionCopy(offer: Offer): SolutionCopy {
  return landing.solutions.items[offer.id] ?? { label: offer.name, outcome: offer.short, fit: offer.intro };
}
