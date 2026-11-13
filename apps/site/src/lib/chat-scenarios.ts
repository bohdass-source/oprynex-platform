import type { Language } from "@/components/language-provider";
import { readCookieConsent } from "@/lib/cookie-consent";
import { eur, prices } from "@/lib/offers";
export type Copy = Record<Language, string>;
const copy = (ru: string, de: string, en: string): Copy => ({ ru, de, en });
// The prepared price answer names the same starting prices as the offer cards and /preise.
function priceAnswer(): Copy {
 const ru = (a: number) => eur(a, "ru"), de = (a: number) => eur(a, "de"), en = (a: number) => eur(a, "en");
 return copy(
  `Стартовые цены (без НДС, плюс 19 %): AI-чатбот от ${ru(prices.chatbot)} и ${ru(prices.chatbotMonthly)} в месяц за его работу, сайт от ${ru(prices.website)}, консультация ${ru(prices.consultHour)} или пакет «Анализ и план» ${ru(prices.consultPackage)}, индивидуальная CRM от ${ru(prices.crm)}. Точная стоимость зависит от объёма и фиксируется письменно до начала работы. Хотите, помогу описать задачу для расчёта?`,
  `Unsere Startpreise (netto zzgl. 19 % MwSt.): KI-Chatbot ab ${de(prices.chatbot)} und ${de(prices.chatbotMonthly)} pro Monat für den Betrieb, Website ab ${de(prices.website)}, Beratung ${de(prices.consultHour)} oder Paket „Analyse & Plan“ ${de(prices.consultPackage)}, individuelles CRM ab ${de(prices.crm)}. Der genaue Preis hängt vom Umfang ab und wird vor Projektbeginn schriftlich festgehalten. Soll ich helfen, die Aufgabe für eine Einschätzung zu beschreiben?`,
  `Our starting prices (net, plus 19 % VAT): AI chatbot from ${en(prices.chatbot)} plus ${en(prices.chatbotMonthly)} per month for running it, website from ${en(prices.website)}, consulting ${en(prices.consultHour)} or the “Analysis & plan” package ${en(prices.consultPackage)}, custom CRM from ${en(prices.crm)}. The exact price depends on scope and is agreed in writing before work begins. Shall I help you describe the task for an estimate?`,
 );
}
export const chatCopy = {
 chatLanguage: copy("Язык чата", "Sprache des Chats", "Chat language"),
 moreLanguages: copy("Другие языки", "Weitere Sprachen", "More languages"),
 voice: copy("Голосовой ввод", "Spracheingabe", "Voice input"),
 stopVoice: copy("Остановить и отправить", "Aufnahme beenden und senden", "Stop and send"),
 voiceNotice: copy("Речь распознаёт ваш браузер. В Chrome и Edge звук обрабатывается на серверах Google или Microsoft. Продолжить?", "Die Spracherkennung übernimmt Ihr Browser. In Chrome und Edge wird der Ton auf Servern von Google bzw. Microsoft verarbeitet. Fortfahren?", "Speech is recognised by your browser. In Chrome and Edge, audio is processed on Google or Microsoft servers. Continue?"),
 voiceContinue: copy("Продолжить", "Fortfahren", "Continue"),
 voiceCancel: copy("Отклонить", "Ablehnen", "Decline"),
 voiceListening: copy("Говорите… Нажмите микрофон ещё раз, чтобы отправить.", "Sprechen Sie… Tippen Sie erneut auf das Mikrofon, um zu senden.", "Speak now… Tap the microphone again to send."),
 voiceRequesting: copy("Разрешите доступ к микрофону в окне браузера.", "Bitte erlauben Sie den Mikrofonzugriff im Browserfenster.", "Please allow microphone access in the browser prompt."),
 voiceBlocked: copy("Микрофон заблокирован в браузере. Разрешите доступ в настройках сайта (значок замка в адресной строке) или напишите вопрос.", "Das Mikrofon ist im Browser blockiert. Erlauben Sie den Zugriff in den Website-Einstellungen (Schloss-Symbol in der Adresszeile) oder schreiben Sie Ihre Frage.", "The microphone is blocked in your browser. Allow access in the site settings (padlock icon in the address bar) or type your question."),
 voiceNoSpeech: copy("Ничего не услышал. Нажмите микрофон и говорите снова.", "Ich habe nichts gehört. Tippen Sie auf das Mikrofon und sprechen Sie erneut.", "I didn't hear anything. Tap the microphone and try again."),
 voiceNoMic: copy("Микрофон не найден. Проверьте подключение или напишите вопрос.", "Kein Mikrofon gefunden. Prüfen Sie die Verbindung oder schreiben Sie Ihre Frage.", "No microphone found. Check the connection or type your question."),
 voiceNetwork: copy("Распознавание речи сейчас недоступно. Напишите, пожалуйста, вопрос.", "Die Spracherkennung ist gerade nicht erreichbar. Bitte schreiben Sie Ihre Frage.", "Speech recognition is unavailable right now. Please type your question."),
 voiceOff: copy("Голосовой ввод отключён", "Spracheingabe deaktiviert", "Voice input turned off"),
 launcher: copy("AI-ассистент", "KI-Assistent", "AI assistant"),
 ask: copy("Спросить AI-ассистента", "KI-Assistent fragen", "Ask the AI assistant"),
 title: copy("Oprynex · AI-ассистент", "Oprynex · KI-Assistent", "Oprynex · AI assistant"),
 disclosure: copy("Я AI-ассистент, не человек. Могу ошибаться — точные условия подтверждает человек. Не вводите в чат конфиденциальные данные.", "Ich bin ein KI-Assistent, kein Mensch. Ich kann Fehler machen – verbindliche Angaben bestätigt ein Mensch. Bitte geben Sie keine sensiblen Daten ein.", "I'm an AI assistant, not a person. I can make mistakes — a person confirms anything binding. Please don't enter sensitive data."),
 privacyShort: copy("Защита данных", "Datenschutz", "Privacy"),
 typing: copy("Печатает…", "Schreibt …", "Typing…"),
 busy: copy("Сейчас много запросов — отвечаю готовыми ответами.", "Gerade sind viele Anfragen da – ich antworte mit vorbereiteten Antworten.", "Lots of requests right now — answering with prepared replies."),
 menu: copy("Меню", "Menü", "Menu"),
 human: copy("Написать человеку", "An einen Menschen schreiben", "Write to a person"),
 more: copy("Подробнее", "Mehr erfahren", "Learn more"),
 lead: copy("Обсудить задачу", "Aufgabe besprechen", "Discuss my task"),
 send: copy("Отправить", "Senden", "Send"),
 close: copy("Закрыть помощника", "Assistent schließen", "Close assistant"),
 question: copy("Ваш вопрос", "Ihre Frage", "Your question"),
 name: copy("Имя и фамилия *", "Vor- und Nachname *", "First and last name *"),
 email: copy("Электронная почта *", "E-Mail *", "Email *"),
 product: copy("Что вас интересует", "Worum geht es", "What are you interested in"),
 message: copy("Задача *", "Ihre Aufgabe *", "Your task *"),
 consent: copy("Я прочитал(а) уведомление о защите данных и согласен(на) на обработку моих данных для рассмотрения запроса и связи со мной по электронной почте. *", "Ich habe die Datenschutzhinweise gelesen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage und Kontaktaufnahme per E-Mail einverstanden. *", "I have read the privacy notice and consent to the processing of my information to handle my inquiry and contact me by email. *"),
 privacy: copy("Защита данных", "Datenschutz", "Data protection"),
 contact: copy("Контакты", "Kontakt", "Contact"),
 loading: copy("Отправляем…", "Wird gesendet…", "Sending…"),
 requestNumber: copy("Номер обращения", "Nummer Ihrer Anfrage", "Request number"),
 didYouMean: copy("Возможно, вы имели в виду", "Meinten Sie", "Did you mean"),
 success: copy("Спасибо, ваш запрос получен. Max Mustermann ответит лично на указанный email. Автоматического письма не будет. Мы работаем с понедельника по субботу, с 9:00 до 20:00 по берлинскому времени.", "Danke, Ihre Anfrage ist angekommen. Max Mustermann antwortet Ihnen persönlich an die angegebene E-Mail-Adresse. Eine automatische Bestätigungsmail gibt es nicht. Wir arbeiten montags bis samstags von 9 bis 20 Uhr Berliner Zeit.", "Thank you, your request has arrived. Max Mustermann will reply personally to the email address you gave. There is no automatic confirmation email. We work Monday to Saturday, 9:00 to 20:00 Berlin time."),
 error: copy("Не получилось отправить. Попробуйте ещё раз или воспользуйтесь формой на странице «Контакты».", "Das Senden hat nicht geklappt. Bitte versuchen Sie es erneut oder nutzen Sie das Formular auf der Kontaktseite.", "Sending didn't work. Please try again or use the form on the contact page."),
};
export type ChatLink = "/crm-entwicklung" | "/ki-chatbot-website" | "/assistants" | "/website-erstellen-lassen" | "/beratung" | "/preise" | "/industries";
export type ChatButton = { id: string; label: Copy; target?: string; to?: ChatLink };
export type ChatNode = { text: Copy; buttons: ChatButton[]; form?: "lead" | "human" };
const button = (id: string, label: Copy, target = id): ChatButton => ({ id, label, target });
const menu = button("menu", chatCopy.menu);
const human = button("human", chatCopy.human);
const lead = button("lead", chatCopy.lead);
const link = (to: ChatLink, label = chatCopy.more): ChatButton => ({ id: to, to, label });
const main = {
 what: copy("Что вы делаете?", "Was machen Sie?", "What do you do?"),
 fit: copy("Что мне подойдёт?", "Was passt zu mir?", "What fits me?"),
 price: copy("Сколько стоит?", "Was kostet das?", "How much does it cost?"),
 time: copy("Сколько это займёт?", "Wie lange dauert es?", "How long does it take?"),
 process: copy("Как проходит работа?", "Wie läuft die Zusammenarbeit ab?", "How does it work?"),
 doubts: copy("У меня есть сомнения", "Ich habe noch Fragen", "I have some concerns"),
};
const fit = button("fit",main.fit), process = button("process",main.process);
export const chatScenarios: Record<string, ChatNode> = {
 menu: { text: copy("Здравствуйте! Задайте вопрос своими словами или выберите тему ниже.", "Guten Tag! Stellen Sie Ihre Frage in eigenen Worten oder wählen Sie unten ein Thema.", "Hello! Ask your question in your own words or pick a topic below."), buttons: [...Object.entries(main).map(([id,label])=>button(id,label)),human] },
 what: { text: copy("Oprynex помогает бизнесу связать сайт, обращения клиентов и их обработку. Мы создаём сайты, встраиваем ассистентов в существующие сайты, разрабатываем CRM (систему для всех клиентов и заявок) и консультируем. Ассистента можно заказать к готовому сайту или вместе с новым сайтом.", "Oprynex verbindet Website, Kundenanfragen und deren Bearbeitung. Wir erstellen Websites, binden Assistenten in bestehende Websites ein, entwickeln CRM-Systeme (ein Ort für alle Kunden und Anfragen) und beraten. Den Assistenten gibt es für Ihre bestehende Website oder zusammen mit einer neuen Website.", "Oprynex connects your website, customer requests and how they are handled. We build websites, add assistants to existing websites, develop CRM (one system for all customers and requests), and offer consulting. The assistant is available for your existing website or together with a new website."), buttons:[fit,process,menu] },
 fit: { text: copy("Расскажите, что сейчас мешает больше всего — подскажу подходящее направление.", "Was bremst Sie gerade am meisten? Ich zeige Ihnen die passende Richtung.", "What's holding you back the most right now? I'll point you to the right option."), buttons:[
 button("p_lost",copy("Заявки теряются в почте и таблицах","Anfragen gehen in E-Mails und Tabellen verloren","Requests get lost in email and spreadsheets"),"fit_crm"),
 button("p_repeat",copy("Команда отвечает на одни и те же вопросы","Das Team beantwortet immer dieselben Fragen","The team keeps answering the same questions"),"fit_ai"),
 button("p_site",copy("Нужен новый сайт","Wir brauchen eine neue Website","We need a new website"),"fit_site"),
 button("p_crm",copy("Готовая CRM не подходит","Standard-CRM passt nicht","Off-the-shelf CRM doesn't fit"),"fit_crm"),
 button("p_unsure",copy("Не знаю, с чего начать","Ich weiß nicht, wo ich anfangen soll","Not sure where to start"),"fit_consult") ] },
 fit_crm: { text: copy("Здесь помогает одно место для всех обращений: статус, история и ответственный. Мы разрабатываем CRM под ваши реальные процессы — без лишних функций. Хотите обсудить вашу ситуацию?", "Hier hilft ein zentraler Ort für alle Anfragen: Status, Verlauf und Zuständigkeit. Wir entwickeln ein CRM nach Ihren tatsächlichen Abläufen – ohne Überflüssiges. Möchten Sie Ihre Situation besprechen?", "What helps here is one place for every request: status, history and owner. We build a CRM around your real processes — nothing extra. Would you like to discuss your situation?"), buttons:[link("/crm-entwicklung"),lead,menu] },
 fit_ai: { text: copy("Подойдёт ассистент для сайта: он отвечает на частые вопросы по утверждённым ответам, а сложные передаёт вашему сотруднику. Менять весь сайт обычно не нужно — если платформа сайта позволяет встроить виджет.", "Dafür eignet sich ein Website-Assistent: Er beantwortet häufige Fragen mit freigegebenen Antworten und übergibt komplexe Fälle an Ihr Team. Die Website muss meist nicht ersetzt werden – sofern die Plattform eine Einbindung erlaubt.", "A website assistant fits here: it answers common questions with approved answers and hands complex ones to your team. You usually don't need a new website — as long as your platform allows embedding a widget."), buttons:[link("/ki-chatbot-website"),link("/assistants",copy("Шесть ассистентов","Sechs Assistenten","Six assistants")),lead] },
 fit_site: { text: copy("Делаем сайт под ключ: структура, тексты, дизайн, разработка, нужные интеграции, проверка и передача. Объём уточняем по почте: для кого сайт и какое действие посетителя для вас главное. Чатбота можно заказать вместе с сайтом.", "Wir erstellen Websites schlüsselfertig: Struktur, Texte, Design, Umsetzung, nötige Integrationen, Prüfung und Übergabe. Den Umfang klären wir per E-Mail: Für wen ist die Website und welche Aktion ist Ihnen am wichtigsten? Einen Chatbot können Sie gleich mit dazu bestellen.", "We build websites end to end: structure, copy, design, development, required integrations, testing and handover. We clarify the scope by email: who the site is for and which visitor action matters most. You can order a chatbot together with it."), buttons:[link("/website-erstellen-lassen"),lead,menu] },
 fit_consult: { text: copy(`Это частая ситуация. Опишите задачу в форме: первый ответ по почте бесплатный. Для разбора есть короткая консультация за ${eur(prices.consultHour, "ru")} или пакет «Анализ и план» за ${eur(prices.consultPackage, "ru")} с письменным планом. Всё по почте, без звонков.`, `Das ist häufig so. Beschreiben Sie Ihre Aufgabe im Formular: Die erste Antwort per E-Mail ist kostenlos. Für eine Analyse gibt es die Kurzberatung für ${eur(prices.consultHour, "de")} oder das Paket „Analyse & Plan“ für ${eur(prices.consultPackage, "de")} mit schriftlichem Plan. Alles per E-Mail, ohne Telefonate.`, `That's very common. Describe your task in the form: the first reply by email is free. For a review there is a short consultation for ${eur(prices.consultHour, "en")} or the “Analysis & plan” package for ${eur(prices.consultPackage, "en")} with a written plan. Everything by email, no calls.`), buttons:[link("/beratung"),lead,menu] },
 price: { text: priceAnswer(), buttons:[button("describe",copy("Да, описать задачу","Ja, Aufgabe beschreiben","Yes, describe my task"),"lead"),link("/preise",copy("Цены","Preise","Pricing")),menu] },
 time: { text: copy("Сроки зависят от задачи и объёма. Мы называем их после обсуждения и фиксируем вместе с объёмом работ. Первый шаг — короткий разговор о вашей задаче.", "Die Dauer hängt von Aufgabe und Umfang ab. Wir nennen sie nach dem Gespräch und halten sie zusammen mit dem Leistungsumfang fest. Der erste Schritt ist ein kurzes Gespräch über Ihre Aufgabe.", "Timing depends on the task and scope. We give it after a conversation and fix it together with the scope of work. The first step is a short conversation about your task."), buttons:[process,lead,menu] },
 process: { text: copy("Работаем по шагам:\n1. Знакомимся с задачей.\n2. Разбираем процессы и ограничения.\n3. Предлагаем решение.\n4. Согласуем объём.\n5. Разрабатываем и подключаем.\n6. Проверяем и передаём.\n7. Развиваем по договорённости.", "Wir arbeiten in Schritten:\n1. Aufgabe kennenlernen.\n2. Abläufe und Einschränkungen klären.\n3. Lösung vorschlagen.\n4. Umfang abstimmen.\n5. Entwickeln und integrieren.\n6. Prüfen und übergeben.\n7. Nach Vereinbarung weiterentwickeln.", "We work in steps:\n1. Understand the task.\n2. Review processes and constraints.\n3. Propose a solution.\n4. Agree the scope.\n5. Build and integrate.\n6. Test and hand over.\n7. Improve further as agreed."), buttons:[lead,fit,menu] },
 doubts: { text:copy("Понимаю. О чём хотите узнать?","Verstehe. Wozu haben Sie Fragen?","Understood. What would you like to know?"), buttons:[
 button("d_fit",copy("Подойдёт ли это мне?","Passt das zu mir?","Is this right for me?"),"fit"),
 button("d_help",copy("А если я не разберусь?","Und wenn ich nicht zurechtkomme?","What if I can't figure it out?")),
 button("d_speed",copy("Как быстро вы ответите?","Wie schnell antworten Sie?","How fast do you reply?")),
 button("d_commit",copy("Это меня к чему-то обязывает?","Bin ich zu etwas verpflichtet?","Am I committing to anything?")),
 button("d_industry",copy("Вы работаете с моей отраслью?","Arbeiten Sie mit meiner Branche?","Do you work with my industry?")),
 button("d_lang",copy("На каких языках вы общаетесь?","In welchen Sprachen kommunizieren Sie?","Which languages do you speak?")) ] },
 d_help: { text: copy("Мы объясняем решение простым языком и передаём инструкцию по работе. Если что-то останется непонятным — вопрос можно задать нам напрямую.", "Wir erklären die Lösung verständlich und übergeben eine Anleitung. Wenn etwas unklar bleibt, können Sie uns direkt fragen.", "We explain the solution in plain language and hand over usage instructions. If anything is still unclear, you can ask us directly."), buttons:[human,menu] },
 d_speed: { text: copy("Заявки лично рассматривает Max Mustermann и отвечает по email. Мы работаем с понедельника по субботу, с 9:00 до 20:00 по берлинскому времени, воскресенье — выходной.", "Anfragen prüft Max Mustermann persönlich und antwortet per E-Mail. Wir arbeiten montags bis samstags von 9 bis 20 Uhr Berliner Zeit, sonntags ist Ruhetag.", "Max Mustermann reviews every request personally and replies by email. We work Monday to Saturday, 9:00 to 20:00 Berlin time; Sunday is our day off."), buttons:[lead,menu] },
 d_commit: { text: copy("Нет. Обсуждение задачи ни к чему не обязывает. Объём, стоимость и условия фиксируются письменно только если вы решите начать работу.", "Nein. Das Gespräch ist unverbindlich. Umfang, Preis und Bedingungen werden erst schriftlich festgehalten, wenn Sie sich für die Zusammenarbeit entscheiden.", "No. Discussing your task is non-binding. Scope, price and terms are only put in writing if you decide to go ahead."), buttons:[lead,menu] },
 d_industry: { text: copy("Мы ориентируемся на малый и растущий бизнес: недвижимость, ремесло, автосалоны, юридические и налоговые бюро, Software и SaaS, медицина, интернет-магазины, сервисные компании, рестораны и отели. Для медицины и права ассистент берёт только организационные вопросы — без диагнозов и заключений.", "Wir arbeiten für kleine und wachsende Unternehmen: Immobilien, Handwerk, Autohäuser, Rechts- und Steuerkanzleien, Software & SaaS, Praxen, Online-Shops, Dienstleister, Restaurants und Hotels. In Medizin und Recht übernimmt ein Assistent nur organisatorische Fragen – keine Diagnosen oder Rechtsauskünfte.", "We focus on small and growing businesses: real estate, trades, car dealerships, law and tax firms, software & SaaS, medical practices, online shops, service providers, restaurants and hotels. In medical and legal fields an assistant handles organisational questions only — no diagnoses or legal advice."), buttons:[link("/industries",copy("Отрасли","Branchen","Industries")),lead,menu] },
 d_lang: { text: copy("Сайт доступен на немецком, русском и английском. На этих языках можно и общаться с нами.", "Die Website gibt es auf Deutsch, Russisch und Englisch. In diesen Sprachen können Sie auch mit uns kommunizieren.", "The website is available in German, Russian and English, and you can talk to us in these languages too."), buttons:[lead,menu] },
 lead: { text:copy("Если хотите, оставьте контакт — мы изучим задачу и ответим лично по email.","Wenn Sie möchten, hinterlassen Sie Ihren Kontakt – wir sehen uns die Aufgabe an und antworten persönlich per E-Mail.","If you like, leave your contact details — we'll review your task and reply personally by email."), buttons:[], form:"lead" },
 human: { text:copy("Конечно. Опишите вопрос и оставьте email — Max ответит лично.","Gerne. Beschreiben Sie Ihre Frage und hinterlassen Sie Ihre E-Mail – Max antwortet persönlich.","Of course. Describe your question and leave your email — Max will reply personally."), buttons:[], form:"human" },
 unmatched: { text:copy("Не получилось ответить на этот вопрос. Попробуйте сформулировать его короче — или я передам его человеку. Также можно выбрать тему ниже.","Auf diese Frage konnte ich gerade nicht antworten. Formulieren Sie sie gern kürzer – oder ich gebe sie an einen Menschen weiter. Sie können auch unten ein Thema wählen.","I couldn't answer this question just now. Try asking it more briefly — or I can pass it to a person. You can also pick a topic below."), buttons:[human,menu] },
};
export const chatKeywords: [string, string[]][] = [
 ["human",["жалоб","претенз","срочно","юрист","суд","врач","диагноз","beschwerde","reklamation","dringend","anwalt","gericht","arzt","diagnose","complaint","urgent","lawyer","court","doctor","diagnosis"]],
 ["price",["цен","стоим","сколько стоит","прайс","тариф","preis","kosten","kostet","tarif","price","cost","pricing","fee"]],
 ["time",["срок","сколько времени","долго","dauer","wie lange","frist","how long","deadline","timeline"]],
 ["process",["как проходит","этап","процесс","ablauf","schritte","prozess","process","steps","how does it work"]],
 ["d_commit",["обязыва","отмен","договор","verpflicht","kündig","vertrag","commit","cancel","contract"]],
 ["fit_crm",["crm","заявки теряются","anfragen verloren","leads"]],
 ["fit_ai",["бот","чат","ассистент","ии","ai","bot","chat","assistent","ki","assistant"]],
 ["fit_site",["сайт","website","webseite","homepage","site"]],
];
export function matchChatNode(text: string): string {
 const lower = text.toLowerCase();
 for (const [id,keywords] of chatKeywords) if (keywords.some(keyword=> ["ai","ki","ии"].includes(keyword) ? new RegExp(`(^|[^\\p{L}\\p{N}_])${keyword}($|[^\\p{L}\\p{N}_])`,"u").test(lower) : lower.includes(keyword))) return id;
 return "unmatched";
}
export const chatTopics: Record<string,Copy> = {
 fit_crm:copy("Тема: CRM-разработка","Thema: CRM-Entwicklung","Topic: CRM development"),
 fit_ai:copy("Тема: Ассистент для сайта","Thema: Website-Assistent","Topic: Website assistant"),
 fit_site:copy("Тема: Новый сайт","Thema: Neue Website","Topic: New website"),
 fit_consult:copy("Тема: Консультация","Thema: Beratung","Topic: Consultation"),
};
export function chatTopicLine(node: string, language: Language): string {
 return chatTopics[node]?.[language] ?? `${({ru:"Тема",de:"Thema",en:"Topic"})[language]}: ${node === "human" ? "" : main[node as keyof typeof main]?.[language] ?? ""}`;
}
export function trackChat(event: "chat_open" | "chat_topic" | "chat_unmatched" | "chat_lead_submitted" | "chat_handoff_submitted", node?: string) {
 if (readCookieConsent() !== "accepted") return;
 const w = window as unknown as { dataLayer?: object[] };
 w.dataLayer ??= [];
 w.dataLayer.push({ event, ...(event === "chat_topic" && node ? { node } : {}) });
}

// Button for an AI-suggested node id; unknown ids return undefined and are ignored.
export function suggestionButton(id: string): ChatButton | undefined {
 if (!chatScenarios[id]) return undefined;
 if (id === "human") return human;
 if (id === "lead") return lead;
 if (id in main) return button(id, main[id as keyof typeof main]);
 for (const node of Object.values(chatScenarios)) { const found = node.buttons.find(b => b.target === id && !b.to); if (found) return found; }
 return undefined;
}
