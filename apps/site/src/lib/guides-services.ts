import { prices } from "@/lib/offers";
import { type Guide, money, p, toBeratung, toChatbot, toCrm, toIndustries, toPrices, toWebsite, updated } from "@/lib/guides-base";

const website = money(prices.website);
const crm = money(prices.crm);
const hour = money(prices.consultHour);
const pack = money(prices.consultPackage);
const toWebsiteKosten = { to: "/website-kosten", label: p("Сколько стоит сайт", "Was kostet eine Website?", "What does a website cost?") } as const;
const toCrmKosten = { to: "/crm-kosten", label: p("Сколько стоит своя CRM", "Was kostet ein individuelles CRM?", "What does a custom CRM cost?") } as const;

export const serviceGuides: Guide[] = [
  {
    path: "/website-kosten", offer: "/website-erstellen-lassen", updated,
    meta: {
      ru: { title: "Сколько стоит сайт для компании: цены и состав — Oprynex", description: `Сколько стоит сайт для компании: от ${website.ru} без НДС. Какие сайты мы делаем, что входит в цену и от чего она зависит. Лендинг, корпоративный, многоязычный.` },
      de: { title: "Was kostet eine Website für Unternehmen? Preise — Oprynex", description: `Was eine Website kostet: ab ${website.de} netto. Welche Websites wir erstellen, was im Preis steckt und wovon er abhängt. Firmenseite, Landingpage, mehrsprachig.` },
      en: { title: "What does a business website cost? Prices — Oprynex", description: `What a business website costs: from ${website.en} net. The kinds of sites we build, what the price includes and what it depends on. Company, landing, multilingual.` },
    },
    eyebrow: p("Сайты на заказ", "Websites nach Maß", "Custom websites"),
    name: p("Сколько стоит сайт", "Was kostet eine Website?", "What does a website cost?"),
    h1: p("Сколько стоит сайт для компании?", "Was kostet eine Website für Unternehmen?", "What does a business website cost?"),
    lead: p(
      `Сайт на заказ в Oprynex стоит от ${website.ru} без НДС. Мы делаем сайты любого вида под вашу задачу, от одной посадочной страницы до большого многоязычного сайта. Точная цена зависит от объёма и согласуется письменно до начала работы.`,
      `Eine Website nach Maß kostet bei Oprynex ab ${website.de} netto. Wir erstellen Websites jeder Art für Ihre Aufgabe, von der einzelnen Landingpage bis zum großen mehrsprachigen Auftritt. Der genaue Preis hängt vom Umfang ab und wird vor Beginn schriftlich vereinbart.`,
      `A custom website at Oprynex starts at ${website.en} net. We build websites of any kind for your task, from a single landing page to a large multilingual site. The exact price depends on scope and is agreed in writing before work begins.`,
    ),
    sections: [
      {
        title: p("Какие сайты мы делаем", "Welche Websites wir erstellen", "Which websites we build"),
        text: [p("Отраслевых шаблонов нет: структура строится от вашей задачи. Например:", "Es gibt keine festen Branchenvorlagen: Die Struktur entsteht aus Ihrer Aufgabe. Zum Beispiel:", "There are no fixed industry templates: the structure comes from your task. For example:")],
        list: [
          p("Сайт компании со страницами услуг", "Firmenwebsite mit Leistungsseiten", "A company website with service pages"),
          p("Посадочная страница для одного предложения", "Landingpage für ein Angebot", "A landing page for one offer"),
          p("Многоязычный сайт, доступно 20 языков", "Mehrsprachige Website mit bis zu 20 Sprachen", "A multilingual website with up to 20 languages"),
          p("Сайт с формами заявок и передачей в CRM", "Website mit Anfrageformularen und Übergabe ins CRM", "A website with request forms and CRM handover"),
          p("Сайт с AI-ассистентом", "Website mit KI-Assistent", "A website with an AI assistant"),
          p("Особые функции по согласованию", "Besondere Funktionen nach Absprache", "Special features by agreement"),
        ],
      },
      {
        title: p("Что входит в работу", "Was zum Umfang gehört", "What the work includes"),
        text: [p(
          "Работа идёт от задачи: кто ваша аудитория и что посетитель должен сделать. В объём входят структура и тексты, дизайн, разработка для всех устройств, формы заявок и нужные интеграции, базовая поисковая оптимизация, проверка и передача с исходным кодом.",
          "Die Arbeit beginnt bei der Aufgabe: Wer ist Ihre Zielgruppe, und was soll ein Besucher tun? Zum Umfang gehören Struktur und Texte, Design, Umsetzung für alle Geräte, Anfrageformulare und nötige Integrationen, grundlegende Suchmaschinenoptimierung, Test und Übergabe mit Quellcode.",
          "The work starts with the task: who is your audience, and what should a visitor do? The scope covers structure and copy, design, a build for all devices, request forms and required integrations, basic search optimisation, testing and handover with the source code.",
        )],
      },
      {
        title: p("От чего зависит цена", "Wovon der Preis abhängt", "What the price depends on"),
        text: [p("Больше всего на цену влияют:", "Am stärksten wirken sich aus:", "These have the greatest effect:")],
        list: [
          p("Количество страниц", "Anzahl der Seiten", "The number of pages"),
          p("Готовность текстов, фото и фирменного стиля", "Stand von Texten, Fotos und Markenauftritt", "The state of texts, photos and branding"),
          p("Количество языков", "Anzahl der Sprachen", "The number of languages"),
          p("Интеграции и особые функции", "Integrationen und besondere Funktionen", "Integrations and special features"),
        ],
      },
    ],
    faq: [
      { q: p("Цена указана с НДС?", "Ist der Preis inklusive Mehrwertsteuer?", "Does the price include VAT?"), a: p(`Нет. ${website.ru} это начальная цена без НДС, к ней добавляется 19 %.`, `Nein. ${website.de} ist der Nettostartpreis, dazu kommen 19 % Mehrwertsteuer.`, `No. ${website.en} is the net starting price, plus 19 % VAT.`) },
      { q: p("Вы делаете сайты для любых отраслей?", "Erstellen Sie Websites für jede Branche?", "Do you build websites for every industry?"), a: p("Да. Структура и тексты строятся под вашу задачу и аудиторию.", "Ja. Struktur und Texte entstehen für Ihre Aufgabe und Ihre Zielgruppe.", "Yes. Structure and copy are made for your task and your audience.") },
      { q: p("Получу ли я исходный код?", "Bekomme ich den Quellcode?", "Do I get the source code?"), a: p("Да, он передаётся вместе с готовым сайтом.", "Ja, er wird mit der fertigen Website übergeben.", "Yes, it is handed over with the finished website.") },
      { q: p("Гарантируете ли вы места в Google?", "Garantieren Sie Plätze bei Google?", "Do you guarantee Google rankings?"), a: p("Нет, этого никто не может обещать. Базовая поисковая оптимизация входит в работу.", "Nein, das kann niemand versprechen. Die grundlegende Suchmaschinenoptimierung gehört zum Umfang.", "No, nobody can promise that. Basic search optimisation is part of the work.") },
    ],
    cta: p("Запросить сайт", "Website anfragen", "Request a website"),
    links: [toWebsite, toChatbot, toPrices],
  },
  {
    path: "/crm-kosten", offer: "/crm-entwicklung", updated,
    meta: {
      ru: { title: "Сколько стоит индивидуальная CRM: цены и этапы — Oprynex", description: `Индивидуальная CRM: бюджет проекта от ${crm.ru} без НДС. Что определяет цену, из каких этапов состоит работа и когда хватит готовой системы вместо разработки.` },
      de: { title: "Was kostet ein individuelles CRM? Preise & Ablauf — Oprynex", description: `Ein individuelles CRM kostet ab ${crm.de} netto Projektbudget. Was den Preis bestimmt, wie die Etappen laufen und wann eine fertige Software statt Entwicklung reicht.` },
      en: { title: "What does a custom CRM cost? Prices and process — Oprynex", description: `A custom CRM starts at a project budget of ${crm.en} net. What drives the price, how the stages run and when ready-made software is enough instead of development.` },
    },
    eyebrow: p("CRM под заказ", "CRM nach Maß", "Custom CRM"),
    name: p("Сколько стоит своя CRM", "Was kostet ein individuelles CRM?", "What does a custom CRM cost?"),
    h1: p("Сколько стоит индивидуальная CRM?", "Was kostet ein individuelles CRM?", "What does a custom CRM cost?"),
    lead: p(
      `Бюджет индивидуальной CRM в Oprynex начинается от ${crm.ru} без НДС. Точная сумма зависит от процессов, ролей и интеграций. Если ваши процессы стандартные, готовая система обойдётся дешевле, и мы скажем об этом прямо.`,
      `Das Projektbudget für ein individuelles CRM beginnt bei Oprynex ab ${crm.de} netto. Die genaue Summe hängt von Abläufen, Rollen und Integrationen ab. Sind Ihre Abläufe Standard, ist eine fertige Software günstiger, und das sagen wir Ihnen offen.`,
      `The project budget for a custom CRM at Oprynex starts at ${crm.en} net. The exact amount depends on workflows, roles and integrations. If your workflows are standard, ready-made software costs less, and we will tell you so.`,
    ),
    sections: [
      {
        title: p("Когда нужна своя CRM", "Wann sich ein eigenes CRM lohnt", "When your own CRM makes sense"),
        text: [p("Индивидуальная разработка оправдана, если:", "Eine eigene Entwicklung lohnt sich, wenn:", "Custom development makes sense when:")],
        list: [
          p("Готовые системы не совпадают с вашими этапами работы", "fertige Systeme nicht zu Ihren Arbeitsschritten passen", "ready-made systems do not match your work stages"),
          p("Нужны особые роли и права", "Sie besondere Rollen und Rechte brauchen", "you need special roles and permissions"),
          p("Заявки теряются между почтой, мессенджерами и таблицами", "Anfragen zwischen E-Mail, Messengern und Tabellen verloren gehen", "requests get lost between email, messengers and spreadsheets"),
          p("Нужна связь с системами, которые уже работают", "Sie Anbindungen an bestehende Systeme brauchen", "you need connections to systems already in use"),
        ],
      },
      {
        title: p("От чего зависит бюджет", "Was das Budget bestimmt", "What drives the budget"),
        text: [p(
          "На бюджет влияют количество процессов и ролей, интеграции, перенос данных из старых систем и отчёты. Работа начинается с анализа, идёт по этапам с проверкой на реальных сценариях и заканчивается внедрением и обучением. Так вы видите результат на каждом этапе, а не только в конце.",
          "Das Budget hängt von der Zahl der Abläufe und Rollen, den Integrationen, der Datenübernahme aus Altsystemen und den Auswertungen ab. Die Arbeit beginnt mit einer Analyse, läuft in Etappen mit Tests an echten Szenarien und endet mit Einführung und Schulung. So sehen Sie in jeder Etappe ein Ergebnis und nicht erst am Ende.",
          "The budget depends on the number of workflows and roles, the integrations, the data migration from old systems and the reports. Work starts with an analysis, runs in stages with tests on real scenarios and ends with rollout and training. You see a result at every stage, not only at the end.",
        )],
      },
      {
        title: p("Своя CRM или готовая программа", "Eigenes CRM oder fertige Software", "Your own CRM or ready-made software"),
        text: [p(
          "Если работа устроена просто и готовая программа ей подходит, своя CRM не нужна. Она окупается тогда, когда система должна подстроиться под ваши процессы, а не наоборот. Если вы не уверены, начните с консультации.",
          "Sind Ihre Abläufe einfach und passt eine fertige Software dazu, brauchen Sie kein eigenes CRM. Es lohnt sich, wenn sich das System an Ihre Abläufe anpassen soll und nicht umgekehrt. Wenn Sie unsicher sind, beginnen Sie mit einer Beratung.",
          "If your workflow is simple and ready-made software fits it, you do not need your own CRM. It pays off when the system should adapt to your workflow and not the other way round. If you are unsure, start with a consultation.",
        )],
      },
    ],
    faq: [
      { q: p("Цена указана с НДС?", "Ist der Preis inklusive Mehrwertsteuer?", "Does the price include VAT?"), a: p("Нет, это бюджет проекта без НДС, к нему добавляется 19 %.", "Nein, das ist das Nettobudget, dazu kommen 19 % Mehrwertsteuer.", "No, this is the net budget, plus 19 % VAT.") },
      { q: p("Можно ли перенести данные из старой системы?", "Können Daten aus dem Altsystem übernommen werden?", "Can data move over from the old system?"), a: p("Да, перенос данных планируется в рамках проекта.", "Ja, die Datenübernahme wird im Projekt eingeplant.", "Yes, data migration is planned as part of the project.") },
      { q: p("Можно ли начать с малого?", "Kann ich klein anfangen?", "Can I start small?"), a: p("Да. Система создаётся по этапам, поэтому можно начать с одного процесса.", "Ja. Das System entsteht in Etappen, Sie können mit einem Ablauf beginnen.", "Yes. The system is built in stages, so you can start with one workflow.") },
      { q: p("Обязательно ли сразу заказывать разработку?", "Muss ich direkt die Entwicklung beauftragen?", "Do I have to order development right away?"), a: p("Нет. Можно начать с консультации и письменных рекомендаций.", "Nein. Sie können mit einer Beratung und schriftlichen Empfehlungen beginnen.", "No. You can start with a consultation and written recommendations.") },
    ],
    cta: p("Обсудить CRM", "CRM-Projekt anfragen", "Discuss a CRM project"),
    links: [toCrm, toBeratung, toPrices],
  },
  {
    path: "/ki-beratung", offer: "/beratung", updated,
    meta: {
      ru: { title: "Консультации по AI для бизнеса: автоматизация и CRM — Oprynex", description: `Консультации по AI письменно, по почте: где автоматизация даст результат, а где нет. ${hour.ru} в час или пакет с планом за ${pack.ru}, без НДС.` },
      de: { title: "KI-Beratung für Unternehmen: Automatisierung & CRM — Oprynex", description: `KI-Beratung schriftlich per E-Mail: wo Automatisierung hilft und wo nicht. Kurzberatung für ${hour.de} oder das Paket mit schriftlichem Plan für ${pack.de}, jeweils netto.` },
      en: { title: "AI consulting for businesses: automation and CRM — Oprynex", description: `AI consulting in writing by email: where automation helps and where it does not. ${hour.en} an hour or the package with a plan for ${pack.en}, net.` },
    },
    eyebrow: p("Консультации", "Beratung", "Consulting"),
    name: p("Консультации по AI", "KI-Beratung für Unternehmen", "AI consulting for businesses"),
    h1: p("Консультации по AI для бизнеса", "KI-Beratung für Unternehmen", "AI consulting for businesses"),
    lead: p(
      `Прежде чем платить за разработку, стоит понять, что вашей компании действительно нужно. Консультация проходит письменно, по почте: первый ответ бесплатный, короткая консультация стоит ${hour.ru}, пакет «Анализ и план» ${pack.ru}, без НДС.`,
      `Bevor Sie für Entwicklung bezahlen, sollten Sie wissen, was Ihr Unternehmen wirklich braucht. Die Beratung läuft schriftlich per E-Mail: Die erste Antwort ist kostenlos, die Kurzberatung kostet ${hour.de}, das Paket „Analyse & Plan“ ${pack.de}, jeweils netto.`,
      `Before paying for development, it helps to know what your company really needs. Consulting happens in writing by email: the first reply is free, a short consultation costs ${hour.en} and the “Analysis & plan” package ${pack.en}, net.`,
    ),
    sections: [
      {
        title: p("С какими вопросами приходят", "Womit Unternehmen zu uns kommen", "What companies come to us with"),
        text: [p("Типичные вопросы:", "Typische Fragen:", "Typical questions:")],
        list: [
          p("Где AI действительно сэкономит время", "Wo KI wirklich Zeit spart", "Where AI really saves time"),
          p("Нужен ли чат-бот на сайте", "Ob ein Chatbot auf der Website sinnvoll ist", "Whether a website chatbot makes sense"),
          p("Какую CRM выбрать: готовую или свою", "Welches CRM passt: fertig oder eigen", "Which CRM fits: ready-made or custom"),
          p("Как соединить сайт, продажи и сервис", "Wie Website, Vertrieb und Service zusammenkommen", "How to connect website, sales and service"),
          p("В каком порядке внедрять", "In welcher Reihenfolge Sie einführen", "In what order to roll things out"),
        ],
      },
      {
        title: p("Как проходит консультация", "So läuft die Beratung", "How consulting works"),
        text: [p(
          "Вы описываете задачу в форме или пишете на почту. В пакете вы отвечаете на короткую анкету, а мы разбираем ваш сайт и то, как приходят и где теряются обращения. Затем вы получаете по почте письменный план: варианты (сайт, ассистент, сайт с ассистентом или CRM), их порядок, ограничения и стоимость. Звонков и встреч нет, на уточняющие вопросы мы отвечаем письменно.",
          "Sie beschreiben Ihre Aufgabe im Formular oder per E-Mail. Im Paket beantworten Sie einen kurzen Fragebogen, und wir prüfen Ihre Website und den Weg, auf dem Anfragen hereinkommen und verloren gehen. Danach erhalten Sie per E-Mail einen schriftlichen Plan: Optionen (Website, Assistent, Website mit Assistent oder CRM), Reihenfolge, Grenzen und Kosten. Es gibt keine Telefonate oder Termine, Rückfragen beantworten wir schriftlich.",
          "You describe your task in the form or by email. In the package you answer a short questionnaire, and we review your website and how requests come in and get lost. Then you receive a written plan by email: options (website, assistant, website with assistant or CRM), order, limits and cost. There are no calls or meetings; we answer follow-up questions in writing.",
        )],
      },
      {
        title: p("Честный ответ", "Eine ehrliche Antwort", "An honest answer"),
        text: [p(
          "Если решение вам не нужно, мы скажем об этом прямо. Хорошая консультация может закончиться выводом, что менять ничего не надо или что достаточно простого шага.",
          "Brauchen Sie keine Lösung, sagen wir Ihnen das offen. Eine gute Beratung kann auch mit dem Ergebnis enden, dass nichts geändert werden muss oder ein einfacher Schritt genügt.",
          "If you do not need a solution, we will tell you so. Good consulting can also end with the finding that nothing has to change or that one simple step is enough.",
        )],
      },
    ],
    faq: [
      { q: p("Сколько стоит консультация?", "Was kostet die Beratung?", "What does consulting cost?"), a: p(`Первый ответ бесплатный. Короткая консультация ${hour.ru}, пакет «Анализ и план» ${pack.ru}, без НДС плюс 19 %. Пакет засчитывается в заказ, если вы закажете работу в течение 30 дней.`, `Die erste Antwort ist kostenlos. Kurzberatung ${hour.de}, Paket „Analyse & Plan“ ${pack.de}, netto zzgl. 19 % Mehrwertsteuer. Das Paket wird angerechnet, wenn Sie innerhalb von 30 Tagen einen Auftrag erteilen.`, `The first reply is free. A short consultation costs ${hour.en}, the “Analysis & plan” package ${pack.en}, net plus 19 % VAT. The package is credited if you place an order within 30 days.`) },
      { q: p("Можно ли созвониться?", "Kann ich anrufen oder einen Termin machen?", "Can we have a call?"), a: p("Нет. Консультация проходит только письменно, по электронной почте. Так вы получаете ответ в письменном виде и можете вернуться к нему в любое время.", "Nein. Die Beratung läuft nur schriftlich per E-Mail. So haben Sie die Antwort schriftlich und können jederzeit darauf zurückgreifen.", "No. Consulting happens only in writing by email. That way you have the answer in writing and can return to it at any time.") },
      { q: p("Кто проводит консультацию?", "Wer berät mich?", "Who advises me?"), a: p("Основатель Oprynex Max Mustermann лично.", "Oprynex-Gründer Max Mustermann persönlich.", "Oprynex founder Max Mustermann personally.") },
      { q: p("Обязан ли я потом заказывать разработку?", "Muss ich danach die Umsetzung beauftragen?", "Must I order development afterwards?"), a: p("Нет. Рекомендации остаются у вас и не обязывают к заказу.", "Nein. Die Empfehlungen bleiben bei Ihnen und verpflichten zu nichts.", "No. The recommendations stay with you and commit you to nothing.") },
    ],
    cta: p("Описать задачу", "Aufgabe beschreiben", "Describe your task"),
    links: [toBeratung, toChatbot, toCrmKosten, toWebsiteKosten, toIndustries],
  },
];

