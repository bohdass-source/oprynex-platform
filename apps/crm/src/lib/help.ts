// Help topics shown on /help in the CRM's three languages. Plain text: paragraphs are separated by a blank line and
// lines starting with "- " become list items. Keep every statement true for what the CRM does today.
import type { UiLanguage } from "@/lib/i18n";

type L = Record<UiLanguage, string>;
const l = (de: string, ru: string, en: string): L => ({ de, ru, en });

export type HelpTopic = { id: string; title: L; body: L };

export const HELP: HelpTopic[] = [
  {
    id: "form",
    title: l("Formular auf die eigene Website setzen", "Как поставить форму на свой сайт", "Putting a form on your website"),
    body: l(
      "Unter Integrationen → Formulare verwalten legen Sie ein Formular an: Name, Sprache, Ihre Website-Adresse und der Link zu Ihrer Datenschutzerklärung.\n\nNach dem Speichern sehen Sie zwei Zeilen Code. Fügen Sie beide an der Stelle Ihrer Website ein, an der das Formular stehen soll:\n- WordPress: Block „Individuelles HTML“ auf der Kontaktseite.\n- Andere Systeme: ein Element für eigenen HTML-Code.\n\nDas Formular übernimmt Schrift und Textfarbe Ihrer Seite. Es erscheint nur auf den Adressen, die Sie eingetragen haben. Erscheint es nicht, prüfen Sie die Adresse (mit oder ohne www) oder schreiben Sie uns.",
      "В разделе «Интеграции» → «Управлять формами» создайте форму: название, язык, адрес вашего сайта и ссылку на вашу Datenschutz.\n\nПосле сохранения появятся две строки кода. Вставьте обе туда, где на сайте должна быть форма:\n- WordPress: блок «Произвольный HTML» на странице контактов.\n- Другие системы: элемент для своего HTML-кода.\n\nФорма берёт шрифт и цвет текста вашего сайта и появляется только на указанных адресах. Если её не видно, проверьте адрес (с www или без) или напишите нам.",
      "Under Integrations → Manage forms, create a form: name, language, your website address and the link to your privacy policy.\n\nAfter saving you see two lines of code. Paste both where the form should appear on your website:\n- WordPress: a “Custom HTML” block on the contact page.\n- Other systems: an element for your own HTML code.\n\nThe form takes over your page's font and text colour and appears only on the addresses you entered. If it does not show, check the address (with or without www) or write to us.",
    ),
  },
  {
    id: "support",
    title: l("Anfragen oder Support: welches Formular?", "Заявки или поддержка: какая форма?", "Requests or support: which form?"),
    body: l(
      "Ein Anfrage-Formular bringt neue Kunden: Jede Nachricht wird eine Anfrage in Ihrem Posteingang und in der Pipeline.\n\nEin Support-Formular ist für bestehende Kunden: Es fragt nach einem Betreff und legt ein Ticket mit Nummer an. Die Nachricht des Kunden steht als erster Eintrag im Verlauf, Ihr Team antwortet per E-Mail aus dem Ticket.\n\nSie können beide Formulare gleichzeitig nutzen, zum Beispiel auf der Kontaktseite und auf der Hilfeseite.",
      "Форма заявок приносит новых клиентов: каждое сообщение становится заявкой во входящих и в воронке.\n\nФорма поддержки для существующих клиентов: она спрашивает тему и создаёт тикет с номером. Сообщение клиента стоит первым в переписке, команда отвечает по почте из тикета.\n\nМожно использовать обе формы сразу, например на странице контактов и на странице помощи.",
      "A request form brings new customers: every message becomes a request in your inbox and pipeline.\n\nA support form is for existing customers: it asks for a subject and opens a numbered ticket. The customer's message is the first entry of the conversation, and your team replies by email from the ticket.\n\nYou can use both at once, for example on the contact page and on the help page.",
    ),
  },
  {
    id: "bots",
    title: l("Website-Chatbots (Tarif Business)", "Чат-боты для сайта (тариф Business)", "Website chatbots (Business plan)"),
    body: l(
      "Ein Chatbot beantwortet Fragen auf Ihrer Website nur aus dem Wissen, das Sie eintragen, und gibt an Ihr Team ab, wenn er etwas nicht weiß.\n\nWählen Sie die Art des Assistenten:\n- Website: hilft beim Zurechtfinden.\n- Anfrage: klärt den Bedarf und legt eine Anfrage an.\n- Termin: fragt Wunschtag und Uhrzeit ab; Ihr Team bestätigt.\n- Support: antwortet aus Ihrer Dokumentation und legt Tickets an.\n- Shop und Warenkorb: beraten aus dem Katalog im Wissen, ändern aber keinen Warenkorb.\n\nBestätigte Buchungen und Änderungen im Shop brauchen eine Anbindung, die Oprynex als Projekt umsetzt.",
      "Чат-бот отвечает на вопросы на вашем сайте только по базе знаний, которую вы заполнили, и передаёт команде то, чего не знает.\n\nВыберите тип ассистента:\n- Сайт: помогает сориентироваться.\n- Заявки: уточняет потребность и создаёт заявку.\n- Запись: спрашивает день и время; подтверждает ваша команда.\n- Поддержка: отвечает по документации и создаёт тикеты.\n- Магазин и корзина: советуют по каталогу из базы знаний, но не меняют корзину.\n\nПодтверждённая запись и изменения в магазине требуют интеграции, которую Oprynex делает как проект.",
      "A chatbot answers questions on your website only from the knowledge you enter, and hands over to your team when it does not know.\n\nChoose the assistant type:\n- Website: helps visitors find their way.\n- Lead: clarifies the need and creates a request.\n- Appointment: asks for a day and time; your team confirms.\n- Support: answers from your documentation and opens tickets.\n- Shop and cart: advise from the catalogue in the knowledge but never change a cart.\n\nConfirmed bookings and shop changes need an integration that Oprynex builds as a project.",
    ),
  },
  {
    id: "team",
    title: l("Team, Rollen und Zuständigkeiten", "Команда, роли и ответственные", "Team, roles and owners"),
    body: l(
      "Unter Team laden Sie Kollegen per E-Mail ein. Sie melden sich mit dieser Adresse an und sind sofort im Unternehmen.\n\nRollen:\n- Inhaber: alles, auch Rollen ändern und das Unternehmen löschen.\n- Admin: alles außer Rollen ändern (ab Tarif Team).\n- Mitarbeiter: Anfragen und Tickets bearbeiten, Notizen und Aufgaben.\n\nJede Anfrage und jedes Ticket kann einer Person zugewiesen werden; die Filter „Mir zugewiesen“ bei Anfragen und „Meine“ bei Tickets zeigen Ihre eigenen.",
      "В разделе «Команда» приглашайте коллег по почте. Они входят с этим адресом и сразу оказываются в компании.\n\nРоли:\n- Владелец: всё, включая смену ролей и удаление компании.\n- Админ: всё, кроме смены ролей (с тарифа Team).\n- Сотрудник: работа с заявками и тикетами, заметки и задачи.\n\nЛюбую заявку и тикет можно назначить человеку; фильтр «Мои» у заявок и тикетов показывает ваши.",
      "Under Team you invite colleagues by email. They sign in with that address and are in the company at once.\n\nRoles:\n- Owner: everything, including changing roles and deleting the company.\n- Admin: everything except changing roles (from the Team plan).\n- Member: work on requests and tickets, notes and tasks.\n\nEvery request and ticket can be assigned to a person; the filters “Assigned to me” for requests and “Mine” for tickets show your own.",
    ),
  },
  {
    id: "notifications",
    title: l("Benachrichtigungen auf Handy und Computer", "Уведомления на телефоне и компьютере", "Notifications on phone and computer"),
    body: l(
      "Öffnen Sie die Glocke oben und schalten Sie Benachrichtigungen für dieses Gerät ein. Neue Anfragen und Tickets melden sich dann auch bei geschlossenem CRM.\n\nAuf iPhone und iPad: zuerst in Safari „Teilen“ → „Zum Home-Bildschirm“ wählen und das CRM von dort öffnen.\n\nDie Benachrichtigung enthält keine Namen oder Texte, nur den Hinweis, dass etwas Neues da ist.",
      "Откройте колокольчик вверху и включите уведомления для этого устройства. Новые заявки и тикеты будут приходить, даже когда CRM закрыта.\n\nНа iPhone и iPad: сначала в Safari «Поделиться» → «На экран „Домой“» и открывайте CRM оттуда.\n\nВ уведомлении нет имён и текстов, только сигнал, что пришло новое.",
      "Open the bell at the top and turn on notifications for this device. New requests and tickets then arrive even with the CRM closed.\n\nOn iPhone and iPad: first choose “Share” → “Add to Home Screen” in Safari and open the CRM from there.\n\nThe notification holds no names or texts, only the hint that something new arrived.",
    ),
  },
  {
    id: "data",
    title: l("Ihre Daten: Export, Aufbewahrung, Löschen", "Ваши данные: выгрузка, хранение, удаление", "Your data: export, retention, deletion"),
    body: l(
      "Unter Daten exportieren Inhaber und Admins alle Anfragen und Tickets als CSV oder alles als JSON.\n\nDort legen Sie auch fest, nach wie vielen Monaten verlorene und Spam-Anfragen sowie geschlossene Tickets automatisch gelöscht werden.\n\nDer Inhaber kann das Unternehmen mit allen Daten endgültig löschen. Exportieren Sie vorher, was Sie behalten möchten.",
      "В разделе «Данные» владелец и админы выгружают все заявки и тикеты в CSV или всё сразу в JSON.\n\nТам же задаётся, через сколько месяцев проигранные заявки, спам и закрытые тикеты удаляются автоматически.\n\nВладелец может навсегда удалить компанию со всеми данными. Сначала выгрузите то, что хотите сохранить.",
      "Under Data, owners and admins export all requests and tickets as CSV or everything as JSON.\n\nThere you also set after how many months lost and spam requests and closed tickets are deleted automatically.\n\nThe owner can delete the company with all its data for good. Export what you want to keep first.",
    ),
  },
];
