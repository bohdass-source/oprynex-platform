import { prices } from "@/lib/offers";
import { type Guide, type GuidePath, money, p, toAvv, toChatbot, toDsgvo, toKosten, toPrices, updated } from "@/lib/guides-base";
import { industryGuides } from "@/lib/guides-industries";
import { serviceGuides } from "@/lib/guides-services";

export type { Guide, GuidePath } from "@/lib/guides-base";

const chatbotPrice = money(prices.chatbot);
const chatbotMonthly = money(prices.chatbotMonthly);

const kosten: Guide = {
  path: "/ki-chatbot-kosten", offer: "/ki-chatbot-website", updated,
  meta: {
    ru: { title: "Сколько стоит AI-чатбот для сайта: цены и расходы — Oprynex", description: `Сколько стоит AI-чатбот для сайта: разовое внедрение от ${chatbotPrice.ru} без НДС, ежемесячная эксплуатация и то, что определяет цену. Простое объяснение.` },
    de: { title: "Was kostet ein KI-Chatbot für die Website? Preise — Oprynex", description: `Was ein KI-Chatbot für die Website kostet: Einrichtung einmalig ab ${chatbotPrice.de} netto, laufender Betrieb und was den Preis bestimmt. Einfach erklärt.` },
    en: { title: "What does an AI chatbot for a website cost? Prices — Oprynex", description: `What an AI chatbot for a website costs: one-time setup from ${chatbotPrice.en} net, ongoing operation and what drives the price. Clearly explained.` },
  },
  eyebrow: p("Стоимость", "Kosten", "Cost"),
  name: p("Сколько стоит AI-чатбот", "Was kostet ein KI-Chatbot?", "What does an AI chatbot cost?"),
  h1: p("Сколько стоит AI-чатбот для сайта?", "Was kostet ein KI-Chatbot für die Website?", "What does an AI chatbot for a website cost?"),
  lead: p(
    `В Oprynex внедрение AI-чатбота стоит от ${chatbotPrice.ru} без НДС, это разовый платёж. К нему добавляется работа бота за ${chatbotMonthly.ru} в месяц без НДС. Ниже объясняем, от чего зависит цена и на что смотреть при сравнении предложений.`,
    `Bei Oprynex beginnt die Einrichtung eines KI-Chatbots bei ${chatbotPrice.de} netto als Einmalbetrag. Dazu kommt der Betrieb für ${chatbotMonthly.de} pro Monat netto. Hier steht, wovon der Preis abhängt und worauf Sie beim Vergleich von Angeboten achten sollten.`,
    `At Oprynex, setting up an AI chatbot starts at ${chatbotPrice.en} net as a one-time fee. Operation is added at ${chatbotMonthly.en} per month, net. This page explains what drives the price and what to check when you compare offers.`,
  ),
  sections: [
    {
      title: p("Две части стоимости: внедрение и эксплуатация", "Zwei Kostenblöcke: Einrichtung und Betrieb", "Two parts of the cost: setup and operation"),
      text: [
        p(
          "Внедрение оплачивается один раз. В него входят база знаний из ваших материалов, границы ответов, правила передачи человеку, встраивание в сайт и проверка на реальных вопросах.",
          "Die Einrichtung zahlen Sie einmal. Sie umfasst die Wissensbasis aus Ihren Inhalten, die Antwortgrenzen, die Regeln für die Übergabe an Ihr Team, die Einbindung in die Website und den Test mit echten Fragen.",
          "You pay for setup once. It covers the knowledge base from your content, the answer limits, the rules for handing over to your team, embedding into your website and testing with real questions.",
        ),
        p(
          `Эксплуатация оплачивается ежемесячно: обновление знаний и наблюдение за работой. Каждый ответ также создаёт расходы у поставщика AI, поэтому для бота задаются дневные лимиты. Работа бота стоит ${chatbotMonthly.ru} в месяц без НДС.`,
          `Der Betrieb fällt monatlich an: Pflege des Wissens und Überwachung. Jede Antwort verursacht außerdem Nutzungskosten beim KI-Anbieter, deshalb bekommt der Bot Tageslimits. Der Betrieb kostet ${chatbotMonthly.de} pro Monat netto.`,
          `Operation is paid monthly: keeping the knowledge current and monitoring. Every answer also creates usage costs at the AI provider, so the bot gets daily limits. Operation costs ${chatbotMonthly.en} per month, net.`,
        ),
      ],
    },
    {
      title: p("От чего зависит цена", "Was den Preis bestimmt", "What drives the price"),
      text: [p("На стоимость больше всего влияют шесть вещей:", "Sechs Punkte beeinflussen den Preis am stärksten:", "Six things affect the price most:")],
      list: [
        p("Объём и состояние ваших материалов", "Menge und Zustand Ihrer Inhalte", "The amount and state of your content"),
        p("Количество языков", "Anzahl der Sprachen", "The number of languages"),
        p("Задача ассистента: вопросы, заявки, пожелания по записи или поддержка", "Aufgabe des Assistenten: Fragen, Anfragen, Terminwünsche oder Support", "The assistant's task: questions, requests, appointment wishes or support"),
        p("Подключения к календарю, магазину или вашим системам", "Anbindungen an Kalender, Shop oder Ihre Systeme", "Connections to a calendar, a shop or your systems"),
        p("Количество сайтов, на которых работает бот", "Anzahl der Websites, auf denen der Bot läuft", "The number of websites the bot runs on"),
        p("Ожидаемое количество диалогов в день", "Erwartete Zahl der Gespräche pro Tag", "The expected number of conversations per day"),
      ],
    },
    {
      title: p("Конструктор или настроенный чатбот", "Baukasten oder eingerichteter Chatbot", "Builder tool or a chatbot set up for you"),
      text: [
        p(
          "Конструктор обычно начинается с ежемесячной подписки, но материалы, проверку ответов и тексты о защите данных вы готовите сами. Настроенный чатбот дороже на старте, зато эту работу берёт на себя исполнитель.",
          "Ein Baukasten startet meist mit einem Monatsabo, doch Inhalte, Antworttests und Datenschutztexte bereiten Sie selbst vor. Ein eingerichteter Chatbot kostet zu Beginn mehr, dafür übernimmt der Anbieter diese Arbeit.",
          "A builder tool usually starts with a monthly subscription, but you prepare the content, the answer tests and the privacy texts yourself. A chatbot set up for you costs more at the start, and the provider takes on that work.",
        ),
        p(
          "При сравнении спрашивайте: что входит во внедрение, кто обновляет знания, что происходит, когда бот не знает ответа, и есть ли договор об обработке данных.",
          "Fragen Sie beim Vergleich: Was gehört zur Einrichtung, wer pflegt das Wissen, was passiert, wenn der Bot keine Antwort kennt, und gibt es einen Auftragsverarbeitungsvertrag?",
          "When comparing, ask: what does setup include, who maintains the knowledge, what happens when the bot does not know the answer, and is there a data processing agreement?",
        ),
      ],
    },
    {
      title: p("Когда это окупается", "Wann sich ein Chatbot rechnet", "When a chatbot pays off"),
      text: [
        p(
          "Посчитайте повторяющиеся вопросы за неделю и умножьте на минуты ответа. Пример для расчёта, а не результат клиента: 30 вопросов по 4 минуты дают 2 часа в неделю. Если таких вопросов мало, чатбот пока не нужен, и лучше сначала улучшить сам сайт.",
          "Zählen Sie die wiederkehrenden Fragen pro Woche und multiplizieren Sie sie mit den Minuten pro Antwort. Eine Beispielrechnung, kein Kundenergebnis: 30 Fragen zu je 4 Minuten ergeben 2 Stunden pro Woche. Gibt es nur wenige solcher Fragen, lohnt sich ein Chatbot noch nicht, und die Website selbst sollte zuerst besser werden.",
          "Count the recurring questions per week and multiply them by the minutes per answer. A sample calculation, not a client result: 30 questions at 4 minutes each make 2 hours a week. If there are only a few such questions, a chatbot is not worth it yet, and the website itself should improve first.",
        ),
      ],
    },
  ],
  faq: [
    {
      q: p("Цена указана с НДС?", "Ist der Preis inklusive Mehrwertsteuer?", "Does the price include VAT?"),
      a: p(`Нет. ${chatbotPrice.ru} это начальная цена без НДС, к ней добавляется 19 %.`, `Nein. ${chatbotPrice.de} ist der Nettostartpreis, dazu kommen 19 % Mehrwertsteuer.`, `No. ${chatbotPrice.en} is the net starting price, plus 19 % VAT.`),
    },
    {
      q: p("Есть ли ежемесячные расходы?", "Gibt es monatliche Kosten?", "Are there monthly costs?"),
      a: p(`Да. Работа бота с обновлением знаний и наблюдением стоит ${chatbotMonthly.ru} в месяц без НДС.`, `Ja. Der Betrieb mit Pflege des Wissens und Überwachung kostet ${chatbotMonthly.de} pro Monat netto.`, `Yes. Operation with knowledge updates and monitoring costs ${chatbotMonthly.en} per month, net.`),
    },
    {
      q: p("Нужно ли менять сайт?", "Muss ich meine Website ersetzen?", "Do I have to replace my website?"),
      a: p("Нет. Если платформа допускает интеграцию, чатбот встраивается в действующий сайт.", "Nein. Lässt die Plattform eine Integration zu, wird der Chatbot in die bestehende Website eingebunden.", "No. If the platform allows integration, the chatbot is embedded into your existing website."),
    },
    {
      q: p("Как узнать точную цену?", "Wie erfahre ich den genauen Preis?", "How do I get the exact price?"),
      a: p("Опишите задачу в форме. Первый разговор ни к чему не обязывает, а объём и цена согласуются письменно до начала работы.", "Beschreiben Sie Ihre Aufgabe im Formular. Das erste Gespräch ist unverbindlich, Umfang und Preis werden vor Beginn schriftlich vereinbart.", "Describe your task in the form. The first conversation is non-binding, and scope and price are agreed in writing before work begins."),
    },
  ],
  cta: p("Обсудить чатбот", "Chatbot anfragen", "Request a chatbot"),
  links: [toChatbot, toDsgvo, toPrices],
};

const dsgvo: Guide = {
  path: "/ki-chatbot-dsgvo", offer: "/ki-chatbot-website", updated,
  meta: {
    ru: { title: "AI-чатбот и DSGVO: на что обратить внимание — Oprynex", description: "AI-чатбот и DSGVO: что указать в политике конфиденциальности, зачем нужен договор об обработке данных, куда идут данные и как это устроено в Oprynex." },
    de: { title: "KI-Chatbot und DSGVO: Worauf Unternehmen achten — Oprynex", description: "KI-Chatbot und DSGVO: was in die Datenschutzerklärung gehört, wozu der AVV dient, wohin Daten fließen und wie Oprynex das im Betrieb regelt. Mit FAQ." },
    en: { title: "AI chatbots and GDPR: what companies should check — Oprynex", description: "AI chatbots and GDPR: what belongs in the privacy policy, why you need a processing agreement, where data goes and how Oprynex handles it. With FAQ." },
  },
  eyebrow: p("Защита данных", "Datenschutz", "Data protection"),
  name: p("AI-чатбот и DSGVO", "KI-Chatbot und DSGVO", "AI chatbots and GDPR"),
  h1: p("AI-чатбот и DSGVO: на что обратить внимание компании", "KI-Chatbot und DSGVO: worauf Unternehmen achten sollten", "AI chatbots and GDPR: what companies should check"),
  lead: p(
    "AI-чатбот обрабатывает то, что вводят посетители. Поэтому нужны понятное информирование, договор с поставщиком и ясный ответ на вопрос, куда идут данные. Эта страница даёт ориентир и не является юридической консультацией.",
    "Ein KI-Chatbot verarbeitet, was Besucher eintippen. Deshalb brauchen Sie eine klare Information der Besucher, einen Vertrag mit dem Anbieter und eine eindeutige Antwort darauf, wohin die Daten fließen. Diese Seite dient der Orientierung und ist keine Rechtsberatung.",
    "An AI chatbot processes what visitors type. You therefore need clear information for visitors, a contract with the provider and a plain answer to where the data goes. This page is for orientation and is not legal advice.",
  ),
  sections: [
    {
      title: p("Что нужно прояснить", "Was zu klären ist", "What needs to be settled"),
      text: [p("Перед запуском проверьте пять пунктов:", "Prüfen Sie vor dem Start fünf Punkte:", "Check five points before launch:")],
      list: [
        p("Политика конфиденциальности: чат описан с поставщиком, целью и правовым основанием", "Datenschutzerklärung: Der Chat ist mit Anbieter, Zweck und Rechtsgrundlage beschrieben", "Privacy policy: the chat is described with provider, purpose and legal basis"),
        p("Договор об обработке данных по статье 28 DSGVO с исполнителем", "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO mit dem Anbieter", "A data processing agreement under Art. 28 GDPR with the provider"),
        p("Передача данных за пределы ЕС: на каком основании она происходит", "Übermittlung außerhalb der EU: auf welcher Grundlage sie erfolgt", "Transfers outside the EU: the basis they rely on"),
        p("Прозрачность: посетитель понимает, что пишет AI, а не сотруднику", "Transparenz: Besucher erkennen, dass sie mit einer KI schreiben und nicht mit einem Menschen", "Transparency: visitors can tell they are writing to an AI, not a person"),
        p("Минимум данных: чат просит не вводить чувствительные сведения", "Datensparsamkeit: Der Chat bittet darum, keine sensiblen Daten einzugeben", "Data minimisation: the chat asks people not to enter sensitive data"),
      ],
    },
    {
      title: p("Как это устроено в Oprynex", "So ist es bei Oprynex geregelt", "How Oprynex handles it"),
      text: [p("Для чат-ботов Oprynex действует как обработчик данных. Конкретно это значит:", "Bei Chatbots handelt Oprynex als Auftragsverarbeiter. Konkret bedeutet das:", "For chatbots, Oprynex acts as a processor. In concrete terms:")],
      list: [
        p("Заявки хранятся в базе данных Supabase во Франкфурте-на-Майне", "Anfragen liegen in einer Supabase-Datenbank in Frankfurt am Main", "Requests are stored in a Supabase database in Frankfurt am Main"),
        p("Сайты и сервисы работают на Cloudflare", "Websites und Dienste laufen bei Cloudflare", "Websites and services run on Cloudflare"),
        p("Текст сообщения передаётся Anthropic в США, чтобы создать ответ", "Der Nachrichtentext geht an Anthropic in den USA, um die Antwort zu erzeugen", "The message text goes to Anthropic in the USA to create the answer"),
        p("Передача в США опирается на EU-US Data Privacy Framework, если поставщик сертифицирован, иначе на стандартные договорные условия", "Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework, wenn der Anbieter zertifiziert ist, sonst auf Standardvertragsklauseln", "Transfers to the USA rely on the EU-US Data Privacy Framework where the provider is certified, otherwise on standard contractual clauses"),
        p("Тексты чата не сохраняются, сохраняется только отправленная форма заявки", "Chattexte werden nicht gespeichert, gespeichert wird nur das abgeschickte Anfrageformular", "Chat texts are not stored, only the submitted request form is"),
        p("Об изменении субподрядчиков клиенты узнают минимум за 30 дней и могут возразить", "Über neue Unterauftragnehmer informieren wir mindestens 30 Tage vorher, Sie können widersprechen", "Customers are told about subprocessor changes at least 30 days ahead and can object"),
        p("Шифрование HTTPS, разделённые данные клиентов, роли и права доступа", "HTTPS-Verschlüsselung, getrennte Kundendaten, Rollen und Berechtigungen", "HTTPS encryption, separated customer data, roles and permissions"),
      ],
    },
    {
      title: p("Что остаётся за вами", "Was bei Ihnen bleibt", "What stays with you"),
      text: [
        p(
          "Ответственным за обработку остаётся ваша компания. Дополните политику конфиденциальности, заключите договор об обработке данных, утвердите материалы для бота и определите, кто читает заявки. Если у вас есть специалист по защите данных, подключите его до запуска и внесите чат в реестр обработки.",
          "Verantwortlicher bleibt Ihr Unternehmen. Ergänzen Sie die Datenschutzerklärung, schließen Sie den Auftragsverarbeitungsvertrag, geben Sie die Inhalte für den Bot frei und legen Sie fest, wer die Anfragen liest. Haben Sie einen Datenschutzbeauftragten, binden Sie ihn vor dem Start ein und nehmen Sie den Chat in Ihr Verarbeitungsverzeichnis auf.",
          "Your company remains the controller. Update the privacy policy, sign the data processing agreement, approve the content for the bot and decide who reads the requests. If you have a data protection officer, involve them before launch and add the chat to your record of processing.",
        ),
      ],
    },
  ],
  faq: [
    {
      q: p("Соответствует ли AI-чатбот DSGVO автоматически?", "Ist ein KI-Chatbot automatisch DSGVO-konform?", "Is an AI chatbot automatically GDPR compliant?"),
      a: p("Нет. Это зависит от настройки и от того, как вы его используете. Oprynex даёт описанные здесь условия, но не обещает соответствие и не заявляет о сертификации.", "Nein. Das hängt von der Einrichtung und vom Einsatz ab. Oprynex stellt die hier beschriebenen Bausteine bereit, sichert aber keine Rechtskonformität zu und nennt keine Zertifizierung.", "No. It depends on the setup and on how you use it. Oprynex provides the building blocks described here, but promises no legal compliance and claims no certification."),
    },
    {
      q: p("Сохраняются ли тексты чата?", "Werden die Chattexte gespeichert?", "Are chat texts stored?"),
      a: p("Oprynex их не сохраняет. Сообщение передаётся поставщику AI, чтобы создать ответ. Сохраняется только форма заявки, если посетитель её отправил.", "Oprynex speichert sie nicht. Die Nachricht geht zur Beantwortung an den KI-Anbieter. Gespeichert wird nur das Anfrageformular, wenn ein Besucher es abschickt.", "Oprynex does not store them. The message goes to the AI provider to create the answer. Only the request form is stored, if a visitor submits it."),
    },
    {
      q: p("Уходят ли данные в США?", "Fließen Daten in die USA?", "Does data go to the USA?"),
      a: p("Да, текст сообщения уходит к Anthropic в США. Заявки хранятся во Франкфурте. Поэтому не стоит вводить в чат чувствительные данные.", "Ja, der Nachrichtentext geht an Anthropic in den USA. Anfragen liegen in Frankfurt. Deshalb sollten keine sensiblen Daten in den Chat eingegeben werden.", "Yes, the message text goes to Anthropic in the USA. Requests are stored in Frankfurt. That is why no sensitive data should be entered in the chat."),
    },
    {
      q: p("Где посмотреть договор об обработке данных?", "Wo finde ich den Auftragsverarbeitungsvertrag?", "Where can I find the data processing agreement?"),
      a: p("Он опубликован на странице AVV и становится частью договора.", "Er ist auf der AVV-Seite veröffentlicht und wird Teil des Vertrags.", "It is published on the AVV page and becomes part of the contract."),
    },
  ],
  cta: p("Задать вопрос о данных", "Frage zum Datenschutz stellen", "Ask about data protection"),
  links: [toAvv, toKosten, toChatbot],
};

export const guides: Guide[] = [kosten, dsgvo, ...industryGuides, ...serviceGuides];
export const guideByPath = (path: GuidePath) => guides.find((g) => g.path === path)!;
