// Internal notification for the owner when a request arrives: one plain text email from the site's own domain
// through the Cloudflare `send_email` binding, delivered to the verified owner mailbox (secret NOTIFY_EMAIL).
// The request is already saved before this runs, so any failure here is logged by code only and never reaches the visitor.
import type { LeadInput } from "@/lib/lead-schema";
import { productLabel } from "@/lib/product-choices";
import { siteUrl } from "@/lib/site-url";

const SENDER = `anfragen@${new URL(siteUrl).hostname}`;
const CRM_URL = "https://app.oprynex.de";

// Header values must stay on one line, or a visitor could inject extra headers.
const oneLine = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, " ").trim();

function base64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// RFC 2047 encoded word, so names with umlauts or Cyrillic letters survive in the subject.
const encodeHeader = (value: string) => `=?UTF-8?B?${base64Utf8(oneLine(value))}?=`;

const SOURCE_LABEL: Record<LeadInput["source"], string> = {
  contact_form: "Kontaktformular",
  chat_lead: "Chat (Formular)",
  chat_handoff: "Chat (Übergabe)",
};

export function buildNotificationMime(lead: LeadInput, id: string, to: string, now = new Date()): string {
  const body = [
    "Neue Anfrage über oprynex.de",
    "",
    `Name: ${oneLine(lead.name)}`,
    `E-Mail: ${oneLine(lead.email)}`,
    ...(lead.company ? [`Firma: ${oneLine(lead.company)}`] : []),
    ...(lead.product ? [`Produkt: ${productLabel(lead.product).de}`] : []),
    `Quelle: ${SOURCE_LABEL[lead.source]}${lead.pagePath ? ` (${oneLine(lead.pagePath)})` : ""}`,
    `Sprache: ${lead.language}`,
    "",
    "Nachricht:",
    lead.message,
    "",
    `In der CRM öffnen: ${CRM_URL}/leads/${id}`,
    "Auf diese E-Mail antworten, um dem Absender direkt zu schreiben.",
    "",
  ].join("\r\n");
  const wrapped = base64Utf8(body).replace(/(.{76})/g, "$1\r\n");
  return [
    `From: Oprynex Anfragen <${SENDER}>`,
    `To: ${oneLine(to)}`,
    `Reply-To: ${oneLine(lead.email)}`,
    `Subject: ${encodeHeader(`Neue Anfrage: ${lead.name}`)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${new URL(siteUrl).hostname}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapped,
  ].join("\r\n");
}

/** Sends the notification; never throws. Returns whether the email was handed to Cloudflare. */
export async function notifyOwner(lead: LeadInput, id: string): Promise<boolean> {
  try {
    const to = process.env["NOTIFY_EMAIL"];
    if (!to) return false;
    // Runtime-only Cloudflare modules: the specifiers are variables so the bundler and the test runner leave them alone.
    const workersModule = "cloudflare:workers";
    const emailModule = "cloudflare:email";
    const { env } = (await import(/* @vite-ignore */ workersModule)) as { env: { EMAIL?: { send(message: unknown): Promise<void> } } };
    if (!env.EMAIL) return false;
    const { EmailMessage } = (await import(/* @vite-ignore */ emailModule)) as { EmailMessage: new (from: string, to: string, raw: string) => unknown };
    await env.EMAIL.send(new EmailMessage(SENDER, to, buildNotificationMime(lead, id, to)));
    return true;
  } catch {
    console.error("Lead notification failed");
    return false;
  }
}
