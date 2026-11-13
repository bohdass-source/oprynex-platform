import { z } from "zod";
import { VISITOR_LANGUAGES } from "@/lib/visitor-languages";

export const CHAT_SUGGESTIONS = ["what","fit","price","time","process","doubts","fit_crm","fit_ai","fit_site","fit_consult","d_commit","d_industry","lead","human"] as const;

export const askChatInputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(600) }).strict()).min(1).max(12)
    .refine(list => list[list.length - 1]?.role === "user", { message: "Last message must be from the user" }),
  language: z.enum(["de", "ru", "en"]),
  // Language the visitor picked in the chat menu; the answer must use it.
  reply: z.enum(VISITOR_LANGUAGES).optional(),
}).strict();
export type AskChatInput = z.infer<typeof askChatInputSchema>;

export const askChatAnswerSchema = z.object({
  answer: z.string().min(1).max(1500),
  suggestions: z.array(z.enum(CHAT_SUGGESTIONS)).max(3).refine(list => new Set(list).size === list.length),
  handoff: z.boolean(),
  language: z.enum(VISITOR_LANGUAGES),
}).strict();
export type AskChatAnswer = z.infer<typeof askChatAnswerSchema>;

// What the model may return; normalized into askChatAnswerSchema instead of being rejected.
export const askChatRawAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(8000),
  suggestions: z.array(z.enum(CHAT_SUGGESTIONS)).max(20),
  handoff: z.boolean(),
  language: z.enum(VISITOR_LANGUAGES),
}).strict();

export const MAX_ANSWER_LENGTH = 1500;

// Cut an over-long reply at the last sentence end that fits, so the visitor still gets an answer.
export function fitAnswer(text: string, max = MAX_ANSWER_LENGTH): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max - 1);
  const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf(".\n"), head.lastIndexOf("\n"));
  return (end > max / 2 ? head.slice(0, end + 1) : head.trimEnd()).trimEnd() + "…";
}

export function normalizeChatAnswer(raw: z.infer<typeof askChatRawAnswerSchema>): AskChatAnswer {
  return { answer: fitAnswer(raw.answer), suggestions: [...new Set(raw.suggestions)].slice(0, 3), handoff: raw.handoff, language: raw.language };
}

export type AskChatReason = "refusal" | "invalid" | "provider" | "disabled" | "capacity" | "limited" | "error";
export type AskChatResult = ({ ok: true } & AskChatAnswer) | { ok: false; reason: AskChatReason };
