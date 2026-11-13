// One contract for the contact form, checked in the browser and again on the server (lead.functions.ts).
import { z } from "zod";
import { LANGUAGES } from "@/lib/config";

export const leadSchema = z.object({
  name: z.string().trim().min(1, "errName").max(100),
  email: z.string().trim().email("errEmail").max(255),
  company: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "errMessage").max(2000),
  consent: z.literal(true, { error: "errConsent" }),
  language: z.enum(LANGUAGES),
  pagePath: z.string().trim().max(200).optional(),
  /** Honeypot: people never see this field, bots fill it. */
  website: z.string().max(200).optional(),
}).strict();

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadResult = { ok: true } | { ok: false; status: number };
