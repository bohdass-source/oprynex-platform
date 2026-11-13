import { z } from "zod";
import { contactSchema } from "@/lib/contact-schema";
import { siteUrl } from "@/lib/site-url";
import { VISITOR_LANGUAGES } from "@/lib/visitor-languages";

export const leadSchema = contactSchema.extend({
  source: z.enum(["contact_form", "chat_lead", "chat_handoff"]),
  chatTopic: z.string().trim().max(50).optional(),
  language: z.enum(VISITOR_LANGUAGES),
  pagePath: z.string().trim().max(200).optional(),
  referrerHost: z.string().trim().max(100).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  website: z.string().max(200).optional(),
}).strict();

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadResult = { ok: true; id?: string } | { ok: false; status: number };

// Production origin of the Cloudflare Worker; more origins (e.g. an own domain) come from ALLOWED_ORIGINS.
export const SITE_ORIGIN = siteUrl;

// Extra exact HTTPS origins, comma-separated.
export function envAllowedOrigins(raw = typeof process === "undefined" ? undefined : process.env["ALLOWED_ORIGINS"]): string[] {
  return (raw ?? "").split(",").map(value => value.trim()).filter(value => /^https:\/\/[a-z0-9.-]+$/i.test(value));
}

export function isLeadOriginAllowed(origin: string, development = false, extra: string[] = envAllowedOrigins()): boolean {
  try {
    const url = new URL(origin);
    if (development && url.origin === "http://localhost:8080") return true;
    if (url.protocol !== "https:" || url.port) return false;
    return url.origin === SITE_ORIGIN || extra.includes(url.origin);
  } catch { return false; }
}
