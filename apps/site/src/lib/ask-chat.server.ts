import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/chat-knowledge.server";
import { VISITOR_LANGUAGE_ENGLISH, VISITOR_LANGUAGES, type VisitorLanguage } from "@/lib/visitor-languages";
import { askChatRawAnswerSchema, normalizeChatAnswer, CHAT_SUGGESTIONS, type AskChatInput, type AskChatResult } from "@/lib/ask-chat-schema";

const LANGUAGE_NAMES = { de: "German", ru: "Russian", en: "English" } as const;

/** Today in Berlin time, e.g. "Monday, 2026-11-02", so the assistant can turn "tomorrow" into a date. */
export function berlinToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")}, ${get("year")}-${get("month")}-${get("day")}`;
}

// Mid-conversation system message after the latest user turn: keeps the cached system prompt stable.
export function withLanguageNote(messages: AskChatInput["messages"], language: AskChatInput["language"], reply?: VisitorLanguage, now = new Date()) {
  const today = ` Today is ${berlinToday(now)} (Berlin time, Europe/Berlin).`;
  if (reply) return [...messages, { role: "system" as const, content: `The visitor selected ${VISITOR_LANGUAGE_ENGLISH[reply]} as the chat language. Always answer in ${VISITOR_LANGUAGE_ENGLISH[reply]}, whatever language the message is written in, and set language to "${reply}".${today}` }];
  return [...messages, { role: "system" as const, content: `Website language: ${LANGUAGE_NAMES[language]}. Answer in the language of the visitor's latest message; if it is too short to tell, answer in ${LANGUAGE_NAMES[language]}.${today}` }];
}

// Never log message texts: only error classes/status codes.
export async function callChatModel(messages: AskChatInput["messages"], language: AskChatInput["language"], reply?: VisitorLanguage): Promise<AskChatResult> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) return { ok: false, reason: "disabled" };
  try {
    const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: {
          type: "object", additionalProperties: false,
          required: ["answer", "suggestions", "handoff", "language"],
          properties: {
            answer: { type: "string" },
            suggestions: { type: "array", items: { type: "string", enum: [...CHAT_SUGGESTIONS] } },
            handoff: { type: "boolean" },
            language: { type: "string", enum: [...VISITOR_LANGUAGES] },
          },
        } },
      },
      messages: withLanguageNote(messages, language, reply),
    } as Parameters<typeof client.beta.messages.create>[0]) as Anthropic.Beta.BetaMessage;
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return { ok: false, reason: "refusal" };
    const text = response.content.map(block => block.type === "text" ? block.text : "").join("");
    let json: unknown;
    try { json = JSON.parse(text); } catch { return { ok: false, reason: "invalid" }; }
    const parsed = askChatRawAnswerSchema.safeParse(json);
    if (!parsed.success) { console.error("Chat answer failed validation"); return { ok: false, reason: "invalid" }; }
    return { ok: true, ...normalizeChatAnswer(parsed.data) };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.error("Chat provider rate limited", 429);
    else if (error instanceof Anthropic.AuthenticationError) console.error("Chat provider auth failed", 401);
    else if (error instanceof Anthropic.APIConnectionError) console.error("Chat provider connection failed");
    else if (error instanceof Anthropic.APIError) console.error("Chat provider error", error.status);
    else console.error("Chat provider unknown error");
    return { ok: false, reason: "provider" };
  }
}
