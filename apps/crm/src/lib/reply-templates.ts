// Ready reply texts that open in the member's own email program, in the customer's language when the CRM knows it.
// {name} is the customer, {company} the CRM company (never "Oprynex" for a Cloud customer), {number} a ticket number.
import type { UiLanguage } from "@/lib/i18n";

type L = Record<UiLanguage, string>;
export type ReplyTemplate = { id: string; for: "lead" | "ticket" | "both"; title: L; body: L };

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: "thanks", for: "both",
    title: { de: "Danke, wir melden uns", ru: "Спасибо, мы свяжемся", en: "Thank you, we will be in touch" },
    body: {
      de: "Guten Tag {name},\n\nvielen Dank für Ihre Nachricht. Wir haben sie erhalten und melden uns so schnell wie möglich mit einer Antwort.\n\nFreundliche Grüße\n{company}",
      ru: "Здравствуйте, {name}!\n\nСпасибо за ваше сообщение. Мы его получили и ответим как можно скорее.\n\nС уважением,\n{company}",
      en: "Hello {name},\n\nthank you for your message. We have received it and will reply as soon as possible.\n\nKind regards\n{company}",
    },
  },
  {
    id: "question", for: "both",
    title: { de: "Rückfrage", ru: "Уточняющий вопрос", en: "A question back" },
    body: {
      de: "Guten Tag {name},\n\ndanke für Ihre Nachricht. Damit wir Ihnen genau helfen können, brauchen wir noch eine Angabe:\n\n\n\nFreundliche Grüße\n{company}",
      ru: "Здравствуйте, {name}!\n\nСпасибо за сообщение. Чтобы помочь точно, нам нужно уточнить:\n\n\n\nС уважением,\n{company}",
      en: "Hello {name},\n\nthank you for your message. To help you exactly, we need one more detail:\n\n\n\nKind regards\n{company}",
    },
  },
  {
    id: "appointment", for: "lead",
    title: { de: "Terminvorschlag", ru: "Предложение времени", en: "Appointment proposal" },
    body: {
      de: "Guten Tag {name},\n\nvielen Dank für Ihre Anfrage. Wir schlagen Ihnen folgenden Termin vor:\n\n\n\nPasst Ihnen das? Wenn nicht, nennen Sie uns gern zwei andere Zeiten.\n\nFreundliche Grüße\n{company}",
      ru: "Здравствуйте, {name}!\n\nСпасибо за запрос. Предлагаем такое время:\n\n\n\nВам подходит? Если нет, напишите два других удобных варианта.\n\nС уважением,\n{company}",
      en: "Hello {name},\n\nthank you for your request. We suggest the following appointment:\n\n\n\nDoes this suit you? If not, just name two other times.\n\nKind regards\n{company}",
    },
  },
  {
    id: "solved", for: "ticket",
    title: { de: "Anliegen gelöst", ru: "Вопрос решён", en: "Issue solved" },
    body: {
      de: "Guten Tag {name},\n\nIhr Anliegen ({number}) ist erledigt:\n\n\n\nWenn noch etwas offen ist, antworten Sie einfach auf diese E-Mail.\n\nFreundliche Grüße\n{company}",
      ru: "Здравствуйте, {name}!\n\nВаш вопрос ({number}) решён:\n\n\n\nЕсли что-то осталось, просто ответьте на это письмо.\n\nС уважением,\n{company}",
      en: "Hello {name},\n\nyour issue ({number}) is solved:\n\n\n\nIf anything is still open, just reply to this email.\n\nKind regards\n{company}",
    },
  },
];

/** The CRM's languages; a request in another language gets English. */
export function replyLanguage(language: string | null | undefined, fallback: UiLanguage): UiLanguage {
  return language === "de" || language === "ru" || language === "en" ? language : language ? "en" : fallback;
}

/** A mailto link with subject and, when a template is chosen, the filled body. */
export function replyLink(to: string, subject: string, template: ReplyTemplate | null, lang: UiLanguage, values: { name: string; company: string; number?: string | undefined }): string {
  const fill = (text: string) => text.replace(/\{name\}/g, values.name).replace(/\{company\}/g, values.company).replace(/\{number\}/g, values.number ?? "");
  const body = template ? `&body=${encodeURIComponent(fill(template.body[lang]))}` : "";
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}${body}`;
}
