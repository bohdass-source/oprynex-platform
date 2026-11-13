import { prices, type L } from "@/lib/offers";
import { type Guide, type GuidePath, type GuideSection, type Meta, money, p, toChatbot, toDsgvo, toIndustries, toKosten, updated } from "@/lib/guides-base";

const price = money(prices.chatbot);
const monthly = money(prices.chatbotMonthly);

type Industry = {
  path: GuidePath;
  meta: { ru: Meta; de: Meta; en: Meta };
  eyebrow: L;
  name: L;
  h1: L;
  lead: L;
  topics: L[];
  flow: { title: L; text: L };
  limits: L[];
  extra?: GuideSection;
  faq: { q: L; a: L }[];
};

/** Every industry page has its own questions, flow and limits; only the setup and price paragraph is shared. */
const industry = (i: Industry): Guide => ({
  path: i.path, offer: "/ki-chatbot-website", updated, meta: i.meta, eyebrow: i.eyebrow, name: i.name, h1: i.h1, lead: i.lead,
  sections: [
    {
      title: p("Какие вопросы он берёт на себя", "Welche Fragen der Assistent übernimmt", "Which questions the assistant takes on"),
      text: [p("Ассистент отвечает только по материалам, которые вы утвердили. Типичные темы:", "Der Assistent antwortet nur aus Inhalten, die Sie freigegeben haben. Typische Themen:", "The assistant only answers from content you have approved. Typical topics:")],
      list: i.topics,
    },
    { title: i.flow.title, text: [i.flow.text] },
    {
      title: p("Чётко заданные границы", "Klare Grenzen", "Clear limits"),
      text: [p("Чего ассистент не делает:", "Das macht der Assistent nicht:", "What the assistant does not do:")],
      list: i.limits,
    },
    ...(i.extra ? [i.extra] : []),
    {
      title: p("Внедрение и стоимость", "Einrichtung und Kosten", "Setup and cost"),
      text: [p(
        `Вы передаёте материалы и самые частые вопросы. Мы собираем знания, проверяем ответы на реальных вопросах и встраиваем ассистента в ваш сайт. Внедрение стоит от ${price.ru} без НДС, работа бота ${monthly.ru} в месяц. Языки вы выбираете сами, доступно 20.`,
        `Sie geben uns Ihre Inhalte und die häufigsten Fragen. Wir bauen daraus das Wissen auf, testen die Antworten mit echten Fragen und binden den Assistenten in Ihre Website ein. Die Einrichtung kostet ab ${price.de} netto, der Betrieb ${monthly.de} pro Monat. Die Sprachen wählen Sie selbst, 20 stehen zur Verfügung.`,
        `You give us your content and the most common questions. We build the knowledge from them, test the answers with real questions and embed the assistant in your website. Setup starts at ${price.en} net, and operation is ${monthly.en} per month. You choose the languages, 20 are available.`,
      )],
    },
  ],
  faq: i.faq,
  cta: p("Обсудить ассистента", "Assistent anfragen", "Request an assistant"),
  links: [toChatbot, toKosten, toDsgvo, toIndustries],
});

export const industryGuides: Guide[] = [
  industry({
    path: "/ki-chatbot-immobilien",
    meta: {
      ru: { title: "AI-ассистент для недвижимости и управляющих компаний — Oprynex", description: "AI-ассистент для управления недвижимостью: отвечает на вопросы по объектам и документам и принимает новые обращения. Без юридических советов и обещаний." },
      de: { title: "KI-Chatbot für Immobilien und Hausverwaltung — Oprynex", description: "KI-Chatbot für Hausverwaltung und Immobilienbüros: beantwortet Fragen zu Objekten und Unterlagen und nimmt neue Anliegen geordnet auf. Ohne Rechtsauskunft." },
      en: { title: "AI chatbot for real estate and property management — Oprynex", description: "AI chatbot for property managers and agencies: answers questions on properties and documents and records new requests in order. No legal advice given." },
    },
    eyebrow: p("Недвижимость", "Immobilien", "Real estate"),
    name: p("Ассистент для недвижимости", "KI-Chatbot für Immobilien", "AI chatbot for real estate"),
    h1: p("AI-ассистент для недвижимости и управляющих компаний", "KI-Chatbot für Immobilien und Hausverwaltung", "AI chatbot for real estate and property management"),
    lead: p(
      "AI-ассистент на сайте управляющей компании или агентства отвечает на повторяющиеся вопросы по объектам и документам и принимает новые обращения в понятном виде. Телефон и почта разгружаются от типовых запросов.",
      "Ein KI-Assistent auf der Website einer Hausverwaltung oder eines Immobilienbüros beantwortet wiederkehrende Fragen zu Objekten und Unterlagen und nimmt neue Anliegen geordnet auf. Telefon und Postfach werden von Standardanfragen entlastet.",
      "An AI assistant on the website of a property manager or agency answers recurring questions about properties and documents and records new requests in a clear form. Phone and inbox get relief from standard enquiries.",
    ),
    topics: [
      p("Вопросы по объектам из утверждённых сведений", "Fragen zu Objekten aus freigegebenen Angaben", "Questions about properties from approved details"),
      p("Какие документы нужны и как их подать", "Welche Unterlagen nötig sind und wie man sie einreicht", "Which documents are needed and how to submit them"),
      p("Контактные лица и часы работы", "Ansprechpartner und Erreichbarkeit", "Contacts and availability"),
      p("Приём обращения: объект, тема, контакт", "Aufnahme eines Anliegens: Objekt, Thema, Kontakt", "Taking a request: property, topic, contact"),
      p("Пожелание по просмотру объекта", "Wunsch nach einer Besichtigung", "A wish to view a property"),
    ],
    flow: {
      title: p("От вопроса к оформленному обращению", "Vom Anliegen zur geordneten Anfrage", "From a question to a clear request"),
      text: p(
        "Вместо письма без деталей вы получаете заявку с объектом, темой и контактом. Она сразу приходит к вам, и никто не тратит время на первый звонок. Первичная регистрация обращения больше не требует звонка.",
        "Statt einer Nachricht ohne Details erhalten Sie eine Anfrage mit Objekt, Thema und Kontakt. Sie kommt direkt bei Ihnen an, ohne dass jemand zuerst anrufen muss. Die erste Aufnahme braucht keinen Anruf mehr.",
        "Instead of a message without details you get a request with the property, topic and contact. It reaches you directly, without anyone having to call first. The first intake no longer needs a phone call.",
      ),
    },
    limits: [
      p("Не даёт юридических советов по аренде или расчётам", "Keine Rechtsauskunft zu Miete oder Nebenkosten", "No legal advice on rent or service charges"),
      p("Не обещает объект и условия от вашего имени", "Keine Zusagen zu Objekten oder Konditionen in Ihrem Namen", "No promises on properties or terms in your name"),
      p("Не называет наличие, которого нет в данных", "Keine Angaben zur Verfügbarkeit, die nicht in den Daten stehen", "No availability claims that are not in the data"),
      p("В аварийном случае называет номер, который вы задали", "Im Notfall nennt er die Nummer, die Sie festlegen", "In an emergency it names the number you set"),
    ],
    faq: [
      { q: p("Может ли ассистент принимать сообщения об ущербе?", "Kann der Assistent Schadensmeldungen aufnehmen?", "Can the assistant take damage reports?"), a: p("Да, как заявку с объектом, темой и контактом. Дальше ею занимается ваша команда.", "Ja, als Anfrage mit Objekt, Thema und Kontakt. Die Bearbeitung liegt dann bei Ihrem Team.", "Yes, as a request with the property, topic and contact. Your team then handles it.") },
      { q: p("Знает ли он актуальные объекты?", "Kennt er die aktuellen Objekte?", "Does it know the current properties?"), a: p("Он знает то, что есть в утверждённых материалах. Постоянно актуальные данные требуют подключения.", "Er kennt, was in den freigegebenen Inhalten steht. Laufend aktuelle Daten brauchen eine Anbindung.", "It knows what is in the approved content. Constantly current data needs a connection.") },
      { q: p("Консультирует ли он по вопросам аренды?", "Berät er zu Mietrecht?", "Does it advise on tenancy law?"), a: p("Нет. Такие вопросы он передаёт вашей команде.", "Nein. Solche Fragen gibt er an Ihr Team weiter.", "No. It passes such questions to your team.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-handwerk",
    meta: {
      ru: { title: "AI-ассистент для ремесленных компаний: заявки и сметы — Oprynex", description: "AI-ассистент для ремесленной компании: собирает описание работ, место и срок и передаёт заявку на смету. Цены не называет, пока их нельзя оценить на месте." },
      de: { title: "KI-Chatbot für Handwerksbetriebe: Anfragen & Angebote — Oprynex", description: "KI-Chatbot für Handwerksbetriebe: sammelt Art der Arbeit, Ort und Zeitraum und bereitet die Angebotsanfrage vor. Er nennt keine Preise ohne Besichtigung." },
      en: { title: "AI chatbot for trades businesses: requests and quotes — Oprynex", description: "AI chatbot for trades businesses: collects the type of work, place and timing and prepares the quote request. It names no prices without an on-site visit." },
    },
    eyebrow: p("Ремесло", "Handwerk", "Trades"),
    name: p("Ассистент для ремесла", "KI-Chatbot für Handwerksbetriebe", "AI chatbot for trades"),
    h1: p("AI-ассистент для ремесленных компаний", "KI-Chatbot für Handwerksbetriebe", "AI chatbot for trades businesses"),
    lead: p(
      "Пока вы на объекте, AI-ассистент на сайте отвечает на вопросы и собирает всё, что нужно для первой сметы: вид работ, место и желаемый срок. Вечером вас ждёт готовая заявка, а не пропущенный звонок.",
      "Während Sie auf der Baustelle sind, beantwortet der KI-Assistent auf Ihrer Website Fragen und sammelt, was Sie für ein erstes Angebot brauchen: Art der Arbeit, Ort und gewünschter Zeitraum. Am Abend wartet eine fertige Anfrage statt eines verpassten Anrufs.",
      "While you are on site, the AI assistant on your website answers questions and collects what you need for a first quote: the type of work, the place and the desired time. In the evening a finished request waits for you instead of a missed call.",
    ),
    topics: [
      p("Какие работы вы выполняете", "Welche Arbeiten Sie ausführen", "Which work you carry out"),
      p("В каком районе вы работаете", "In welchem Gebiet Sie arbeiten", "Which area you work in"),
      p("Описание работ и исходные данные", "Beschreibung der Arbeit und Ausgangsdaten", "A description of the work and initial details"),
      p("Запрос сметы и следующий шаг", "Angebotsanfrage und nächster Schritt", "A quote request and the next step"),
      p("Как с вами связаться", "Wie man Sie erreicht", "How to reach you"),
    ],
    flow: {
      title: p("Заявка, с которой можно работать", "Eine Anfrage, mit der Sie arbeiten können", "A request you can work with"),
      text: p(
        "Ассистент уточняет то, о чём вы всё равно спросили бы по телефону. Заявка приходит к вам со всеми данными, и вы отвечаете, когда есть время. Для вас это меньше обратных звонков ради уточнений.",
        "Der Assistent klärt, was Sie am Telefon ohnehin fragen würden. Die Anfrage kommt mit allen Angaben bei Ihnen an, und Sie antworten, wenn Sie Zeit haben. Das bedeutet weniger Rückrufe für Rückfragen.",
        "The assistant clarifies what you would ask on the phone anyway. The request reaches you with all details, and you reply when you have time. That means fewer callbacks just to ask for details.",
      ),
    },
    limits: [
      p("Не называет цену, которая зависит от осмотра", "Keine Preise, die von einer Besichtigung abhängen", "No prices that depend on an on-site visit"),
      p("Не обещает сроки от вашего имени", "Keine Terminzusagen in Ihrem Namen", "No time promises in your name"),
      p("Не даёт технических или строительных заключений", "Keine fachlichen Gutachten", "No technical assessments"),
      p("В аварийном случае называет ваш телефон или службу, которую вы задали", "Im Notfall nennt er Ihre Nummer oder den festgelegten Dienst", "In an emergency it names your number or the service you set"),
    ],
    faq: [
      { q: p("Нужно ли мне постоянно быть в чате?", "Muss ich ständig im Chat sein?", "Do I have to be in the chat all the time?"), a: p("Нет. Ассистент работает сам, а вы получаете готовую заявку и отвечаете в удобное время.", "Nein. Der Assistent arbeitet selbstständig, Sie erhalten die fertige Anfrage und antworten, wenn es passt.", "No. The assistant works on its own, you receive the finished request and reply when it suits you.") },
      { q: p("Может ли он называть цены?", "Kann er Preise nennen?", "Can it name prices?"), a: p("Только те, что вы утвердили. Если цена зависит от осмотра, он так и скажет.", "Nur solche, die Sie freigegeben haben. Hängt der Preis von einer Besichtigung ab, sagt er das.", "Only those you have approved. If the price depends on a visit, it says so.") },
      { q: p("Подойдёт ли он моему нынешнему сайту?", "Passt er zu meiner bestehenden Website?", "Does it fit my existing website?"), a: p("Да, если платформа сайта допускает встраивание. Менять сайт не нужно.", "Ja, wenn die Plattform der Website eine Einbindung zulässt. Sie müssen die Website nicht ersetzen.", "Yes, if the website's platform allows embedding. You do not have to replace the website.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-autohaus",
    meta: {
      ru: { title: "AI-ассистент для автосалона: вопросы и тест-драйв — Oprynex", description: "AI-ассистент для автосалона: отвечает на вопросы об автомобилях и принимает пожелания о консультации или тест-драйве. Цены и наличие только из ваших данных." },
      de: { title: "KI-Chatbot fürs Autohaus: Fahrzeuge & Probefahrten — Oprynex", description: "KI-Chatbot fürs Autohaus: beantwortet Fragen zu Fahrzeugen und nimmt Wünsche für Beratung oder Probefahrt auf. Preise und Bestand nur aus Ihren Daten." },
      en: { title: "AI chatbot for car dealerships: vehicles and test drives — Oprynex", description: "AI chatbot for car dealerships: answers questions about vehicles and takes wishes for advice or a test drive. Prices and stock only come from your data." },
    },
    eyebrow: p("Автосалоны", "Autohäuser", "Car dealerships"),
    name: p("Ассистент для автосалона", "KI-Chatbot fürs Autohaus", "AI chatbot for car dealerships"),
    h1: p("AI-ассистент для автосалона", "KI-Chatbot fürs Autohaus", "AI chatbot for car dealerships"),
    lead: p(
      "Интерес к автомобилю часто возникает вечером, когда салон закрыт. AI-ассистент на сайте отвечает на вопросы по утверждённым данным и принимает пожелание о консультации или тест-драйве, а продавец продолжает разговор на следующий день.",
      "Das Interesse an einem Auto entsteht oft abends, wenn das Autohaus geschlossen hat. Der KI-Assistent auf der Website beantwortet Fragen aus freigegebenen Daten und nimmt den Wunsch nach Beratung oder Probefahrt auf, und der Verkauf führt das Gespräch am nächsten Tag weiter.",
      "Interest in a car often arises in the evening when the dealership is closed. The AI assistant on the website answers questions from approved data and takes the wish for advice or a test drive, and sales continues the conversation the next day.",
    ),
    topics: [
      p("Вопросы по моделям и комплектациям из ваших данных", "Fragen zu Modellen und Ausstattung aus Ihren Daten", "Questions about models and equipment from your data"),
      p("Запись на консультацию", "Wunschtermin für eine Beratung", "A preferred time for advice"),
      p("Пожелание по тест-драйву", "Wunsch nach einer Probefahrt", "A wish for a test drive"),
      p("Сервис: часы работы и порядок записи", "Werkstatt: Öffnungszeiten und Terminablauf", "Workshop: opening hours and how booking works"),
      p("Адрес и контакты отделов", "Adresse und Ansprechpartner", "Address and contacts"),
    ],
    flow: {
      title: p("Тест-драйв и календарь", "Probefahrt und Kalender", "Test drive and calendar"),
      text: p(
        "Без подключённого календаря ассистент принимает пожелание, а подтверждает его ваша команда. С подключённым расписанием возможно подтверждённое бронирование. Заявка в любом случае приходит к вам с интересующим автомобилем и контактом.",
        "Ohne angebundenen Kalender nimmt der Assistent den Wunsch auf, und Ihr Team bestätigt ihn. Mit angebundenem Kalender ist eine bestätigte Buchung möglich. In beiden Fällen kommt die Anfrage mit Fahrzeug und Kontakt bei Ihnen an.",
        "Without a connected calendar the assistant takes the wish and your team confirms it. With a connected calendar a confirmed booking is possible. Either way the request reaches you with the vehicle and contact.",
      ),
    },
    limits: [
      p("Актуальные цены и наличие только при подключении к вашим данным", "Aktuelle Preise und Bestand nur mit Anbindung an Ihre Daten", "Current prices and stock only with a connection to your data"),
      p("Не обещает финансирование и условия лизинга", "Keine Zusagen zu Finanzierung oder Leasing", "No promises on financing or leasing"),
      p("Не оценивает автомобиль при обмене", "Keine Bewertung für die Inzahlungnahme", "No trade-in valuations"),
      p("Не подтверждает скидки", "Keine Bestätigung von Rabatten", "No confirmation of discounts"),
    ],
    faq: [
      { q: p("Может ли он сам записать на тест-драйв?", "Kann er selbst eine Probefahrt buchen?", "Can it book a test drive itself?"), a: p("Подтверждённая запись возможна только при подключённом календаре. Без него он принимает пожелание для вашей команды.", "Eine bestätigte Buchung ist nur mit angebundenem Kalender möglich. Ohne ihn nimmt er den Wunsch für Ihr Team auf.", "A confirmed booking is only possible with a connected calendar. Without one it takes the wish for your team.") },
      { q: p("Откуда он знает автомобили в наличии?", "Woher kennt er den Fahrzeugbestand?", "How does it know the stock?"), a: p("Из утверждённых материалов или из подключения к вашим данным. Постоянно актуальный склад требует подключения.", "Aus freigegebenen Inhalten oder einer Anbindung an Ihre Daten. Ein laufend aktueller Bestand braucht die Anbindung.", "From approved content or a connection to your data. A constantly current stock needs the connection.") },
      { q: p("Заменяет ли он продавца?", "Ersetzt er den Verkauf?", "Does it replace sales staff?"), a: p("Нет. Он принимает интерес и передаёт его продавцу.", "Nein. Er nimmt das Interesse auf und gibt es an den Verkauf weiter.", "No. It takes the interest and passes it to sales.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-kanzlei",
    meta: {
      ru: { title: "AI-ассистент для юристов и налоговых консультантов — Oprynex", description: "AI-ассистент для адвокатской или налоговой практики: организационные вопросы, приём обращения и подготовка консультации. Без юридических и налоговых заключений." },
      de: { title: "KI-Chatbot für Kanzleien und Steuerberater — Oprynex", description: "KI-Chatbot für Kanzleien und Steuerberater: organisatorische Fragen, Erstaufnahme und Vorbereitung des Beratungstermins. Keine Rechts- oder Steuerauskunft." },
      en: { title: "AI chatbot for law firms and tax advisers — Oprynex", description: "AI chatbot for law firms and tax advisers: organisational questions, first intake and preparing the consultation. No automatic legal or tax opinions given." },
    },
    eyebrow: p("Право и налоги", "Kanzleien", "Law and tax firms"),
    name: p("Ассистент для юристов и налоговых", "KI-Chatbot für Kanzleien", "AI chatbot for law and tax firms"),
    h1: p("AI-ассистент для юристов и налоговых консультантов", "KI-Chatbot für Kanzleien und Steuerberater", "AI chatbot for law firms and tax advisers"),
    lead: p(
      "AI-ассистент на сайте отвечает на организационные вопросы, принимает первое обращение и помогает подготовиться к консультации. Он не даёт юридических или налоговых заключений: это остаётся вашей работой.",
      "Der KI-Assistent auf der Website beantwortet organisatorische Fragen, nimmt die erste Anfrage auf und hilft bei der Vorbereitung des Beratungstermins. Er gibt keine rechtliche oder steuerliche Auskunft: Das bleibt Ihre Arbeit.",
      "The AI assistant on the website answers organisational questions, takes the first request and helps prepare the consultation. It gives no legal or tax opinions: that remains your work.",
    ),
    topics: [
      p("Направления работы и контактные лица", "Tätigkeitsgebiete und Ansprechpartner", "Practice areas and contacts"),
      p("Как проходит первая консультация", "Wie das Erstgespräch abläuft", "How the first consultation works"),
      p("Какие документы подготовить", "Welche Unterlagen vorzubereiten sind", "Which documents to prepare"),
      p("Организационные сведения о гонорарах по вашим правилам", "Organisatorisches zu Honoraren nach Ihren Vorgaben", "Organisational points on fees under your rules"),
      p("Пожелание по времени встречи", "Wunschtermin für ein Gespräch", "A preferred time for a meeting"),
    ],
    flow: {
      title: p("Подготовка консультации", "Vorbereitung des Beratungstermins", "Preparing the consultation"),
      text: p(
        "Ассистент спрашивает общую тему и контакт и передаёт заявку команде. Так вы заранее понимаете, подходит ли запрос вашему направлению, а клиент знает, что взять с собой.",
        "Der Assistent fragt nach dem allgemeinen Thema und dem Kontakt und gibt die Anfrage an Ihr Team weiter. So sehen Sie vorab, ob die Anfrage zu Ihrem Gebiet passt, und der Mandant weiß, was er mitbringen soll.",
        "The assistant asks for the general topic and the contact and passes the request to your team. You see in advance whether the request fits your field, and the client knows what to bring.",
      ),
    },
    limits: [
      p("Нет юридических и налоговых заключений", "Keine rechtliche oder steuerliche Auskunft", "No legal or tax opinions"),
      p("Нет оценки шансов дела", "Keine Einschätzung von Erfolgsaussichten", "No assessment of a case's prospects"),
      p("Нет расчёта сроков по конкретному делу", "Keine Berechnung von Fristen im Einzelfall", "No calculation of deadlines for a specific case"),
      p("Не принимает мандат: это делает ваша команда", "Keine Mandatsannahme: Das entscheidet Ihr Team", "No taking on of mandates: your team decides that"),
    ],
    extra: {
      title: p("Конфиденциальность", "Verschwiegenheit", "Confidentiality"),
      text: [p(
        "Чат предназначен для организационных вопросов, поэтому посетителям не следует вводить подробности дела. Текст сообщения передаётся поставщику AI в США. Проверьте использование со своими профессиональными обязанностями до запуска.",
        "Der Chat ist für organisatorische Fragen gedacht, Besucher sollten daher keine Einzelheiten ihres Falls eingeben. Der Nachrichtentext geht an den KI-Anbieter in den USA. Prüfen Sie den Einsatz vor dem Start anhand Ihrer Berufspflichten.",
        "The chat is meant for organisational questions, so visitors should not enter details of their case. The message text goes to the AI provider in the USA. Check the use against your professional duties before launch.",
      )],
    },
    faq: [
      { q: p("Даёт ли ассистент юридические советы?", "Gibt der Assistent Rechtsauskunft?", "Does the assistant give legal advice?"), a: p("Нет. Он отвечает на организационные вопросы, а содержательные передаёт вашей команде.", "Nein. Er beantwortet organisatorische Fragen und gibt inhaltliche an Ihr Team weiter.", "No. It answers organisational questions and passes substantive ones to your team.") },
      { q: p("Сохраняются ли сообщения?", "Werden Nachrichten gespeichert?", "Are messages stored?"), a: p("Тексты чата Oprynex не сохраняет. Сохраняется только отправленная форма заявки.", "Chattexte speichert Oprynex nicht. Gespeichert wird nur das abgeschickte Anfrageformular.", "Oprynex does not store chat texts. Only the submitted request form is stored.") },
      { q: p("Может ли он записывать на встречу?", "Kann er Termine vergeben?", "Can it book meetings?"), a: p("Он принимает пожелание, а подтверждает ваша команда. Подтверждённая запись требует подключения календаря.", "Er nimmt den Wunsch auf, Ihr Team bestätigt ihn. Eine bestätigte Buchung braucht einen angebundenen Kalender.", "It takes the wish and your team confirms it. A confirmed booking needs a connected calendar.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-saas",
    meta: {
      ru: { title: "AI-ассистент поддержки для SaaS и программ: документация — Oprynex", description: "AI-ассистент для SaaS: отвечает по вашей документации на вопросы о настройке, интеграциях и работе с продуктом, а сложные случаи передаёт поддержке." },
      de: { title: "KI-Chatbot für SaaS: Support aus Ihrer Dokumentation — Oprynex", description: "KI-Chatbot für SaaS und Software: beantwortet Fragen zu Einrichtung, Integrationen und Nutzung aus Ihrer Dokumentation und übergibt schwierige Fälle ans Team." },
      en: { title: "AI chatbot for SaaS: support from your documentation — Oprynex", description: "AI chatbot for SaaS and software: answers questions on setup, integrations and use from your documentation and hands difficult cases to your support team." },
    },
    eyebrow: p("Программы и SaaS", "Software und SaaS", "Software and SaaS"),
    name: p("Ассистент для SaaS", "KI-Chatbot für SaaS", "AI chatbot for SaaS"),
    h1: p("AI-ассистент поддержки для SaaS и программ", "KI-Chatbot für SaaS und Software", "AI support chatbot for SaaS and software"),
    lead: p(
      "Большая часть обращений в поддержку повторяется, а ответ уже есть в документации. AI-ассистент находит его сразу и передаёт команде только то, что требует человека.",
      "Viele Support-Anfragen wiederholen sich, und die Antwort steht längst in der Dokumentation. Der KI-Assistent findet sie sofort und gibt nur an Ihr Team weiter, was wirklich einen Menschen braucht.",
      "Many support requests repeat themselves, and the answer is already in the documentation. The AI assistant finds it at once and passes on only what truly needs a person.",
    ),
    topics: [
      p("Первые шаги и настройка", "Erste Schritte und Einrichtung", "First steps and setup"),
      p("Интеграции и их подключение", "Integrationen und ihre Anbindung", "Integrations and how to connect them"),
      p("Работа с функциями продукта", "Nutzung der Produktfunktionen", "Using product features"),
      p("Типовые ошибки из документации", "Typische Fehler aus der Dokumentation", "Common errors from the documentation"),
      p("Тарифы и условия из ваших материалов", "Tarife und Bedingungen aus Ihren Inhalten", "Plans and terms from your content"),
    ],
    flow: {
      title: p("От вопроса к тикету", "Von der Frage zum Ticket", "From a question to a ticket"),
      text: p(
        "Если ответа нет в документации или у ассистента недостаточно полномочий, он создаёт обращение с описанием вопроса вместо того, чтобы угадывать. Поддержка получает контекст и не спрашивает всё заново.",
        "Steht die Antwort nicht in der Dokumentation oder fehlen dem Assistenten die Berechtigungen, übergibt er eine Anfrage mit der Fragestellung, statt zu raten. Der Support bekommt den Kontext und muss nicht alles neu erfragen.",
        "If the answer is not in the documentation or the assistant lacks permission, it hands over a request with the question instead of guessing. Support gets the context and does not have to ask everything again.",
      ),
    },
    limits: [
      p("Отвечает только по утверждённой документации", "Antwortet nur aus freigegebener Dokumentation", "Answers only from approved documentation"),
      p("Не меняет настройки аккаунта", "Ändert keine Kontoeinstellungen", "Does not change account settings"),
      p("Не обещает новые функции и сроки", "Keine Zusagen zu neuen Funktionen oder Terminen", "No promises on new features or dates"),
      p("Не видит данные клиента без разрешённого подключения", "Sieht ohne freigegebene Anbindung keine Kundendaten", "Sees no customer data without an approved connection"),
    ],
    faq: [
      { q: p("Как ассистент обновляет знания?", "Wie bleibt das Wissen aktuell?", "How does the knowledge stay current?"), a: p("Знания мы обновляем по вашему запросу. Это входит в ежемесячную работу бота.", "Das Wissen aktualisieren wir auf Ihren Wunsch. Das gehört zum monatlichen Betrieb.", "We update the knowledge when you ask. That is part of the monthly operation.") },
      { q: p("На каких языках он работает?", "In welchen Sprachen arbeitet er?", "Which languages does it work in?"), a: p("На тех, что вы выберете из 20 доступных.", "In den Sprachen, die Sie aus 20 verfügbaren auswählen.", "In those you choose from 20 available.") },
      { q: p("Можно ли встроить его в сам продукт?", "Lässt er sich ins Produkt einbinden?", "Can it be embedded in the product itself?"), a: p("Обсудим на старте. На сайте он подключается одной строкой кода.", "Das klären wir zu Beginn. Auf der Website genügt eine Codezeile.", "We settle that at the start. On a website one line of code is enough.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-arztpraxis",
    meta: {
      ru: { title: "AI-ассистент для врачебной практики и стоматологии — Oprynex", description: "AI-ассистент для врачебной и стоматологической практики: организационные вопросы, подготовка к визиту и пожелания по записи. Без диагнозов и назначения лечения." },
      de: { title: "KI-Chatbot für Arztpraxis und Zahnarztpraxis — Oprynex", description: "KI-Chatbot für Arzt- und Zahnarztpraxen: organisatorische Fragen, Vorbereitung auf den Besuch und Terminwünsche. Ohne Diagnosen und ohne Behandlungsempfehlung." },
      en: { title: "AI chatbot for medical and dental practices — Oprynex", description: "AI chatbot for medical and dental practices: organisational questions, visit preparation and appointment wishes. No diagnoses and no treatment advice given." },
    },
    eyebrow: p("Медицина и здоровье", "Praxen und Gesundheit", "Practices and health"),
    name: p("Ассистент для врачебной практики", "KI-Chatbot für Arztpraxen", "AI chatbot for medical practices"),
    h1: p("AI-ассистент для врачебных и стоматологических практик", "KI-Chatbot für Arzt- und Zahnarztpraxen", "AI chatbot for medical and dental practices"),
    lead: p(
      "AI-ассистент на сайте практики отвечает на организационные вопросы в любое время и принимает пожелания по записи. Он не ставит диагнозы и не назначает лечение, а запись подтверждает ваша команда.",
      "Der KI-Assistent auf der Praxiswebsite beantwortet organisatorische Fragen zu jeder Tageszeit und nimmt Terminwünsche auf. Er stellt keine Diagnosen und empfiehlt keine Behandlung, und Ihr Team bestätigt die Termine.",
      "The AI assistant on the practice website answers organisational questions at any time of day and takes appointment wishes. It gives no diagnoses or treatment advice, and your team confirms appointments.",
    ),
    topics: [
      p("Часы приёма, адрес и парковка", "Sprechzeiten, Anfahrt und Parken", "Opening hours, directions and parking"),
      p("Услуги практики и ход первого визита", "Leistungen der Praxis und Ablauf des ersten Besuchs", "The practice's services and how a first visit works"),
      p("Подготовка к визиту и что взять с собой", "Vorbereitung auf den Besuch und was mitzubringen ist", "Preparing for the visit and what to bring"),
      p("Вопросы о страховке и оплате по вашим правилам", "Fragen zu Kasse, Privat und Zahlung nach Ihren Vorgaben", "Insurance and payment questions under your rules"),
      p("Куда обращаться в экстренном случае", "Wohin man sich im Notfall wendet", "Where to turn in an emergency"),
    ],
    flow: {
      title: p("Пожелания по записи вместо автоматической записи", "Terminwünsche statt automatischer Buchung", "Appointment wishes instead of automatic booking"),
      text: p(
        "Ассистент спрашивает удобный день и время и передаёт заявку команде. Без подключённого календаря автоматически ничего не бронируется, поэтому расписание остаётся под вашим контролем.",
        "Der Assistent fragt nach Wunschtag und Uhrzeit und gibt die Anfrage an Ihr Team weiter. Ohne angebundenen Kalender wird nichts automatisch gebucht, der Terminplan bleibt also unter Ihrer Kontrolle.",
        "The assistant asks for the preferred day and time and passes the request to your team. Without a connected calendar nothing is booked automatically, so the schedule stays under your control.",
      ),
    },
    limits: [
      p("Нет диагнозов и рекомендаций по лечению", "Keine Diagnosen und keine Behandlungsempfehlungen", "No diagnoses and no treatment advice"),
      p("Нет выдуманных цен: если цена зависит от случая, бот так и говорит", "Keine erfundenen Preise: Hängt der Preis vom Fall ab, sagt der Bot das", "No invented prices: if the price depends on the case, the bot says so"),
      p("В экстренном случае направляет к службе, которую вы задали, или на 112", "Im Notfall verweist er an den festgelegten Dienst oder die 112", "In an emergency it points to the service you set or to 112"),
      p("Если ответа нет в материалах, передаёт вопрос команде", "Steht die Antwort nicht in den Inhalten, gibt er die Frage ans Team weiter", "If the answer is not in the content, it passes the question to your team"),
    ],
    extra: {
      title: p("Защита данных в практике", "Datenschutz in der Praxis", "Data protection in a practice"),
      text: [p(
        "Сведения о здоровье особо защищены статьёй 9 DSGVO, а практика связана врачебной тайной. Поэтому чат нужен для организационных вопросов: пациентам не следует вводить жалобы, результаты обследований или другие чувствительные сведения. Текст сообщения передаётся поставщику AI в США. Обсудите использование со своим специалистом по защите данных до запуска.",
        "Gesundheitsdaten sind nach Art. 9 DSGVO besonders geschützt, und für die Praxis gilt die ärztliche Schweigepflicht. Der Chat ist deshalb für organisatorische Fragen gedacht: Patienten sollten keine Beschwerden, Befunde oder andere sensible Angaben eingeben. Der Nachrichtentext geht an den KI-Anbieter in den USA. Klären Sie den Einsatz vor dem Start mit Ihrem Datenschutzbeauftragten.",
        "Health data is specially protected under Art. 9 GDPR, and a practice is bound by medical confidentiality. The chat is therefore meant for organisational questions: patients should not enter symptoms, findings or other sensitive details. The message text goes to the AI provider in the USA. Clear the use with your data protection officer before launch.",
      )],
    },
    faq: [
      { q: p("Заменяет ли ассистент администратора?", "Ersetzt der Assistent den Empfang?", "Does the assistant replace the front desk?"), a: p("Нет. Он снимает повторяющиеся вопросы, а записью и всем, что касается пациентов, занимается команда.", "Nein. Er nimmt wiederkehrende Fragen ab, Termine und alles Patientenbezogene bleiben beim Team.", "No. It takes on recurring questions, while appointments and anything patient related stay with the team.") },
      { q: p("Что он делает при острой боли?", "Was passiert bei akuten Schmerzen?", "What happens with acute pain?"), a: p("Он не даёт медицинских советов и указывает путь, который вы задали: телефон практики, дежурную службу или 112.", "Er gibt keinen medizinischen Rat und nennt den Weg, den Sie festlegen: Praxistelefon, Notdienst oder 112.", "It gives no medical advice and names the route you set: the practice phone, the on-call service or 112.") },
      { q: p("Можно ли посмотреть пример?", "Kann ich ein Beispiel sehen?", "Can I see an example?"), a: p("Да. По запросу покажем демонстрацию на примере вымышленной практики.", "Ja. Auf Anfrage zeigen wir Ihnen eine Demo mit einer fiktiven Beispielpraxis.", "Yes. On request we show you a demo with a fictional sample practice.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-onlineshop",
    meta: {
      ru: { title: "AI-ассистент для интернет-магазина: подбор и корзина — Oprynex", description: "AI-ассистент для интернет-магазина: подбирает товар по проверенному каталогу, объясняет доставку и оформление и помогает с поддержкой. Только по вашим данным." },
      de: { title: "KI-Chatbot für Onlineshops: Beratung & Warenkorb — Oprynex", description: "KI-Chatbot für Onlineshops: hilft bei der Produktwahl aus dem geprüften Katalog, erklärt Versand und Bestellung und entlastet den Support. Nur aus Ihren Daten." },
      en: { title: "AI chatbot for online shops: product advice and cart — Oprynex", description: "AI chatbot for online shops: helps choose products from the verified catalogue, explains delivery and checkout and relieves support. Only from your own data." },
    },
    eyebrow: p("Интернет-магазины", "Onlineshops", "Online shops"),
    name: p("Ассистент для интернет-магазина", "KI-Chatbot für Onlineshops", "AI chatbot for online shops"),
    h1: p("AI-ассистент для интернет-магазина", "KI-Chatbot für Onlineshops", "AI chatbot for online shops"),
    lead: p(
      "Покупатель с вопросом часто просто уходит. AI-ассистент помогает подобрать товар по вашему каталогу, объясняет доставку и оформление и отвечает в момент, когда решение о покупке ещё не принято.",
      "Wer im Shop eine offene Frage hat, geht oft einfach. Der KI-Assistent hilft bei der Produktwahl aus Ihrem Katalog, erklärt Versand und Bestellung und antwortet genau dann, wenn die Kaufentscheidung noch offen ist.",
      "A shopper with a question often just leaves. The AI assistant helps choose products from your catalogue, explains delivery and checkout and answers at the moment the buying decision is still open.",
    ),
    topics: [
      p("Подбор товара по проверенному каталогу", "Produktwahl aus dem geprüften Katalog", "Product selection from the verified catalogue"),
      p("Характеристики и различия товаров", "Eigenschaften und Unterschiede der Produkte", "Product features and differences"),
      p("Доставка и способы оплаты", "Versand und Zahlungsarten", "Delivery and payment methods"),
      p("Возврат и обмен по вашим условиям", "Rückgabe und Umtausch nach Ihren Bedingungen", "Returns and exchanges under your terms"),
      p("Помощь с корзиной и оформлением", "Hilfe bei Warenkorb und Bestellung", "Help with cart and checkout"),
    ],
    flow: {
      title: p("Два ассистента в одном магазине", "Zwei Aufgaben in einem Shop", "Two jobs in one shop"),
      text: p(
        "Ассистент магазина помогает выбрать товар. Ассистент корзины помогает разобраться с доставкой и оформлением. Вопросы о конкретном заказе, на которые нет данных, передаются вашей поддержке, а не остаются без ответа.",
        "Der Shop-Assistent hilft bei der Auswahl. Der Warenkorb-Assistent hilft bei Versand und Bestellung. Fragen zu einer konkreten Bestellung, zu denen keine Daten vorliegen, gehen an Ihren Support, statt offen zu bleiben.",
        "The shop assistant helps with choosing. The cart assistant helps with delivery and checkout. Questions about a specific order with no data available go to your support instead of staying unanswered.",
      ),
    },
    limits: [
      p("Актуальные цены и наличие только при подключении к данным магазина", "Aktuelle Preise und Bestand nur mit Anbindung an die Shopdaten", "Current prices and stock only with a connection to shop data"),
      p("Меняет корзину только через разрешённую интеграцию и с подтверждением", "Ändert den Warenkorb nur über eine freigegebene Integration und mit Bestätigung", "Changes the cart only through an approved integration and with confirmation"),
      p("Рекомендует только товары из каталога", "Empfiehlt nur Produkte aus dem Katalog", "Recommends only catalogue items"),
      p("Не обещает скидки и сроки доставки сверх ваших условий", "Keine Rabatte oder Lieferzusagen über Ihre Bedingungen hinaus", "No discounts or delivery promises beyond your terms"),
    ],
    faq: [
      { q: p("Видит ли он цены и наличие?", "Sieht er Preise und Bestand?", "Does it see prices and stock?"), a: p("Актуальные данные доступны только при подключении к магазину. Без него он опирается на утверждённый каталог.", "Aktuelle Daten gibt es nur mit einer Anbindung an den Shop. Ohne sie stützt er sich auf den freigegebenen Katalog.", "Current data is only available with a connection to the shop. Without one it relies on the approved catalogue.") },
      { q: p("Может ли он сам менять корзину?", "Kann er den Warenkorb selbst ändern?", "Can it change the cart itself?"), a: p("Только через разрешённую интеграцию и с подтверждением покупателя.", "Nur über eine freigegebene Integration und mit Bestätigung der Kundin oder des Kunden.", "Only through an approved integration and with the customer's confirmation.") },
      { q: p("Подойдёт ли он моей платформе?", "Passt er zu meiner Shop-Plattform?", "Does it fit my shop platform?"), a: p("Если платформа допускает встраивание, да. Подключения к данным согласуются отдельно.", "Wenn die Plattform eine Einbindung zulässt, ja. Anbindungen an Daten werden separat vereinbart.", "If the platform allows embedding, yes. Data connections are agreed separately.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-dienstleister",
    meta: {
      ru: { title: "AI-ассистент для компаний услуг: заявки и консультации — Oprynex", description: "AI-ассистент для компании услуг: объясняет услуги, уточняет запрос и передаёт вам подготовленную заявку. Не обещает цены и сроки от вашего имени." },
      de: { title: "KI-Chatbot für Dienstleister: Anfragen qualifizieren — Oprynex", description: "KI-Chatbot für Dienstleister: erklärt Leistungen, klärt den Bedarf und übergibt Ihnen eine vorbereitete Anfrage. Keine Preis- oder Terminzusagen in Ihrem Namen." },
      en: { title: "AI chatbot for service businesses: qualify requests — Oprynex", description: "AI chatbot for service businesses: explains your services, clarifies the need and passes you a prepared request. No price or date promises in your name." },
    },
    eyebrow: p("Компании услуг", "Dienstleister", "Service businesses"),
    name: p("Ассистент для компаний услуг", "KI-Chatbot für Dienstleister", "AI chatbot for service businesses"),
    h1: p("AI-ассистент для компаний сферы услуг", "KI-Chatbot für Dienstleister", "AI chatbot for service businesses"),
    lead: p(
      "Агентства, консультанты и другие компании услуг много времени тратят на первые разговоры, которые ни к чему не приводят. AI-ассистент объясняет услуги, уточняет запрос и передаёт вам уже подготовленную заявку.",
      "Agenturen, Beratungen und andere Dienstleister verbringen viel Zeit mit Erstgesprächen, aus denen nichts wird. Der KI-Assistent erklärt Ihre Leistungen, klärt den Bedarf und übergibt Ihnen eine vorbereitete Anfrage.",
      "Agencies, consultants and other service businesses spend a lot of time on first conversations that lead nowhere. The AI assistant explains your services, clarifies the need and hands you a prepared request.",
    ),
    topics: [
      p("Какие услуги вы предлагаете и для кого", "Welche Leistungen Sie anbieten und für wen", "Which services you offer and for whom"),
      p("Как проходит работа с вами", "Wie die Zusammenarbeit abläuft", "How working with you goes"),
      p("Какая услуга подходит под запрос", "Welche Leistung zum Bedarf passt", "Which service fits the need"),
      p("Какие данные нужны для предложения", "Welche Angaben für ein Angebot nötig sind", "Which details a proposal needs"),
      p("Пожелание по консультации", "Wunsch nach einem Beratungsgespräch", "A wish for a consultation"),
    ],
    flow: {
      title: p("Подготовленная заявка вместо пустого разговора", "Vorbereitete Anfrage statt leerem Erstgespräch", "A prepared request instead of an empty first call"),
      text: p(
        "Ассистент уточняет потребность и собирает нужные данные. Заявка приходит к вам уже подготовленной, и вы сразу видите, стоит ли назначать встречу, и ведёте клиента дальше.",
        "Der Assistent klärt den Bedarf und sammelt die nötigen Angaben. Die Anfrage kommt vorbereitet bei Ihnen an, und Sie sehen sofort, ob sich ein Gespräch lohnt, und führen die Kundschaft weiter.",
        "The assistant clarifies the need and collects the necessary details. The request reaches you already prepared, and you see at once whether a meeting is worthwhile and take the client further.",
      ),
    },
    limits: [
      p("Не обещает цены от вашего имени", "Keine Preiszusagen in Ihrem Namen", "No price promises in your name"),
      p("Не обещает сроки от вашего имени", "Keine Terminzusagen in Ihrem Namen", "No date promises in your name"),
      p("Отвечает только по утверждённым материалам", "Antwortet nur aus freigegebenen Inhalten", "Answers only from approved content"),
      p("Сложные вопросы передаёт вашей команде", "Komplexe Fragen gehen an Ihr Team", "Complex questions go to your team"),
    ],
    faq: [
      { q: p("Чем это лучше обычной формы?", "Was ist der Unterschied zum Kontaktformular?", "How does it differ from a contact form?"), a: p("Ассистент отвечает на вопросы и уточняет запрос в диалоге, а форма только собирает то, что человек сам написал.", "Der Assistent beantwortet Fragen und klärt den Bedarf im Gespräch, ein Formular nimmt nur auf, was jemand von sich aus schreibt.", "The assistant answers questions and clarifies the need in conversation, while a form only takes what someone writes on their own.") },
      { q: p("Куда попадают заявки?", "Wohin gehen die Anfragen?", "Where do the requests go?"), a: p("К вам на почту или в вашу CRM, с контактом и темой. Способ согласуем при настройке.", "Per E-Mail oder in Ihr CRM, mit Kontakt und Thema. Den Weg legen wir bei der Einrichtung fest.", "By email or into your CRM, with contact and topic. We agree on the route during setup.") },
      { q: p("Подойдёт ли он небольшой компании?", "Passt das auch für kleine Unternehmen?", "Does it suit a small company?"), a: p("Да. Начать можно с одного сценария и ваших самых частых вопросов.", "Ja. Sie können mit einem Szenario und Ihren häufigsten Fragen beginnen.", "Yes. You can start with one scenario and your most common questions.") },
    ],
  }),
  industry({
    path: "/ki-chatbot-gastronomie-hotel",
    meta: {
      ru: { title: "AI-ассистент для ресторанов и отелей: вопросы и брони — Oprynex", description: "AI-ассистент для ресторана или отеля: отвечает о часах работы, услугах и условиях и принимает запросы на бронирование. Подтверждённая бронь при интеграции." },
      de: { title: "KI-Chatbot für Restaurant und Hotel: Gästefragen — Oprynex", description: "KI-Chatbot für Restaurants und Hotels: beantwortet Gästefragen zu Zeiten, Angebot und Bedingungen und nimmt Reservierungswünsche auf. Buchung nur mit Integration." },
      en: { title: "AI chatbot for restaurants and hotels: guest questions — Oprynex", description: "AI chatbot for restaurants and hotels: answers guest questions on hours, offers and terms and takes reservation wishes. Confirmed booking needs an integration." },
    },
    eyebrow: p("Рестораны и отели", "Gastronomie und Hotels", "Restaurants and hotels"),
    name: p("Ассистент для ресторанов и отелей", "KI-Chatbot für Gastronomie und Hotels", "AI chatbot for restaurants and hotels"),
    h1: p("AI-ассистент для ресторанов и отелей", "KI-Chatbot für Gastronomie und Hotels", "AI chatbot for restaurants and hotels"),
    lead: p(
      "Гости спрашивают об одном и том же: когда открыто, есть ли парковка, можно ли с собакой. AI-ассистент отвечает на эти вопросы сразу и на языке гостя, а команда занимается теми, кто уже у вас.",
      "Gäste fragen immer wieder dasselbe: Wann ist geöffnet, gibt es Parkplätze, sind Hunde erlaubt? Der KI-Assistent beantwortet das sofort und in der Sprache des Gastes, und Ihr Team kümmert sich um die Gäste vor Ort.",
      "Guests keep asking the same things: when are you open, is there parking, are dogs allowed? The AI assistant answers at once and in the guest's language, and your team looks after the guests on site.",
    ),
    topics: [
      p("Часы работы и кухни, заезд и выезд", "Öffnungs- und Küchenzeiten, An- und Abreise", "Opening and kitchen hours, check-in and check-out"),
      p("Предложения, меню и номера из ваших материалов", "Angebot, Speisekarte und Zimmer aus Ihren Inhalten", "Offers, menu and rooms from your content"),
      p("Парковка, дорога и животные", "Parken, Anfahrt und Haustiere", "Parking, directions and pets"),
      p("Мероприятия и групповые запросы", "Veranstaltungen und Gruppenanfragen", "Events and group requests"),
      p("Пожелание по бронированию", "Reservierungswunsch", "A reservation wish"),
    ],
    flow: {
      title: p("Запрос на бронирование", "Reservierungswünsche", "Reservation wishes"),
      text: p(
        "Без интеграции ассистент принимает дату, время и число гостей и передаёт запрос команде на подтверждение. Подтверждённое бронирование возможно только при подключённой системе. Вы всегда знаете, что гость получил запрос, а не обещание.",
        "Ohne Integration nimmt der Assistent Datum, Uhrzeit und Personenzahl auf und gibt die Anfrage zur Bestätigung an Ihr Team. Eine bestätigte Buchung ist nur mit angebundenem System möglich. Der Gast hat also eine Anfrage gestellt und keine Zusage bekommen, bis Sie sie geben.",
        "Without an integration the assistant takes the date, time and number of guests and passes the request to your team to confirm. A confirmed booking is only possible with a connected system. The guest has made a request and has no commitment until you give it.",
      ),
    },
    limits: [
      p("Подтверждённая бронь только при интеграции", "Bestätigte Buchung nur mit Integration", "Confirmed bookings only with an integration"),
      p("Не называет свободные столы и номера без данных", "Keine Angaben zu freien Tischen oder Zimmern ohne Daten", "No claims about free tables or rooms without data"),
      p("По аллергенам отвечает только из ваших данных и направляет к персоналу", "Zu Allergenen nur aus Ihren Angaben und mit Verweis ans Personal", "On allergens it answers only from your details and refers to staff"),
      p("Не обещает цены и скидки сверх ваших условий", "Keine Preise oder Rabatte über Ihre Bedingungen hinaus", "No prices or discounts beyond your terms"),
    ],
    faq: [
      { q: p("Отвечает ли он на иностранных языках?", "Antwortet er in Fremdsprachen?", "Does it answer in foreign languages?"), a: p("Да, на языках, которые вы выберете из 20 доступных.", "Ja, in den Sprachen, die Sie aus 20 verfügbaren auswählen.", "Yes, in those you choose from 20 available.") },
      { q: p("Может ли он бронировать столы и номера?", "Kann er Tische und Zimmer buchen?", "Can it book tables and rooms?"), a: p("Подтверждённое бронирование возможно только при интеграции. Без неё он принимает запрос.", "Eine bestätigte Buchung ist nur mit Integration möglich. Ohne sie nimmt er die Anfrage auf.", "A confirmed booking is only possible with an integration. Without one it takes the request.") },
      { q: p("Как обновить меню или часы работы?", "Wie ändere ich Speisekarte oder Öffnungszeiten?", "How do I update the menu or hours?"), a: p("Знания мы меняем по вашему запросу. Это тоже входит в ежемесячную работу бота.", "Das Wissen ändern wir auf Ihren Wunsch. Auch das gehört zum monatlichen Betrieb.", "We change the knowledge when you ask. That is also part of the monthly operation.") },
    ],
  }),
];
