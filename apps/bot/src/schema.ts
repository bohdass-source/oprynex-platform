import { z } from "zod";

export const UI_LANGUAGES = ["de", "en", "ru"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

// Languages the visitor may write in; the database accepts the same list for leads.
export const VISITOR_LANGUAGES = ["de", "en", "fr", "es", "it", "nl", "pl", "pt", "ro", "cs", "hu", "bg", "el", "sv", "da", "fi", "tr", "ru", "uk", "kk"] as const;
export type VisitorLanguage = (typeof VISITOR_LANGUAGES)[number];

/** The six assistant types of the Oprynex site's /assistants page; the kind adds rules to the prompt and shapes the form. */
export const BOT_KINDS = ["website", "lead", "appointment", "support", "shop", "cart"] as const;
export type BotKind = (typeof BOT_KINDS)[number];

/** What bot_engine_config returns for an enabled bot. */
export const botConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  business: z.string(),
  origins: z.array(z.string()),
  languages: z.array(z.enum(UI_LANGUAGES)).min(1),
  greeting: z.string(),
  knowledge: z.string(),
  quickReplies: z.array(z.string()),
  color: z.string(),
  privacyUrl: z.string().nullable(),
  kind: z.enum(BOT_KINDS),
});
export type BotConfig = z.infer<typeof botConfigSchema>;

export const chatInputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) })).min(1).max(12)
    .refine((list) => list[list.length - 1]?.role === "user" && (list[list.length - 1]?.content.length ?? 0) <= 600, "last message must be a visitor question of at most 600 characters"),
  language: z.enum(UI_LANGUAGES),
});
export type ChatInput = z.infer<typeof chatInputSchema>;

/** The model's answer; anything else is dropped. */
export const modelAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(1500),
  handoff: z.boolean(),
  language: z.enum(VISITOR_LANGUAGES),
});
export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

export const leadInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  company: z.string().trim().max(150).optional().default(""),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  language: z.enum(VISITOR_LANGUAGES),
  pagePath: z.string().max(200).optional().default(""),
  website: z.string().max(200).optional(), // honeypot: hidden from people, so a filled one means a script
});
export type LeadInput = z.infer<typeof leadInputSchema>;

/** What web_form_config returns for an enabled form; "owner" is the company the visitor's request goes to. */
export const formConfigSchema = z.object({
  id: z.string().uuid(),
  owner: z.string(),
  origins: z.array(z.string()),
  language: z.enum(UI_LANGUAGES),
  color: z.string(),
  privacyUrl: z.string().nullable(),
  askCompany: z.boolean(),
  /** "request" creates a request in the CRM, "support" a support ticket. */
  purpose: z.enum(["request", "support"]),
});
export type FormConfig = z.infer<typeof formConfigSchema>;

/** A request sent through a website form: the chatbot request's fields, in the form's language. */
export const formLeadInputSchema = leadInputSchema.extend({ language: z.enum(UI_LANGUAGES) });
export type FormLeadInput = z.infer<typeof formLeadInputSchema>;

/** A support question sent through a support form; it becomes a ticket with the message as its first entry. */
export const formTicketInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  language: z.enum(UI_LANGUAGES),
  pagePath: z.string().max(200).optional().default(""),
  website: z.string().max(200).optional(), // honeypot
});
export type FormTicketInput = z.infer<typeof formTicketInputSchema>;

/** A support assistant's handover; the visitor may write in any of the chat languages. */
export const botTicketInputSchema = formTicketInputSchema.extend({ language: z.enum(VISITOR_LANGUAGES) });
export type BotTicketInput = z.infer<typeof botTicketInputSchema>;
