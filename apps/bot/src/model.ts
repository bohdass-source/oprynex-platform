import Anthropic from "@anthropic-ai/sdk";
import { withLanguageNote, systemPrompt } from "./prompt";
import { modelAnswerSchema, VISITOR_LANGUAGES, type BotConfig, type ChatInput, type ModelAnswer } from "./schema";

export type ModelResult = ({ ok: true } & ModelAnswer) | { ok: false; reason: "disabled" | "refusal" | "invalid" | "provider" };

// Same model settings as the Oprynex site chat, which is proven live. Never log message texts, only error classes.
export async function askModel(apiKey: string | undefined, bot: BotConfig, input: ChatInput): Promise<ModelResult> {
  if (!apiKey) return { ok: false, reason: "disabled" };
  try {
    const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      system: systemPrompt(bot),
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: {
          type: "object", additionalProperties: false,
          required: ["answer", "handoff", "language"],
          properties: {
            answer: { type: "string" },
            handoff: { type: "boolean" },
            language: { type: "string", enum: [...VISITOR_LANGUAGES] },
          },
        } },
      },
      messages: withLanguageNote(input.messages, input.language),
    } as Parameters<typeof client.beta.messages.create>[0]) as Anthropic.Beta.BetaMessage;
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return { ok: false, reason: "refusal" };
    const text = response.content.map((block) => (block.type === "text" ? block.text : "")).join("");
    let json: unknown;
    try { json = JSON.parse(text); } catch { return { ok: false, reason: "invalid" }; }
    const parsed = modelAnswerSchema.safeParse(json);
    if (!parsed.success) { console.error("Bot answer failed validation"); return { ok: false, reason: "invalid" }; }
    return { ok: true, ...parsed.data };
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error("Bot provider error", error.status);
    else console.error("Bot provider unknown error");
    return { ok: false, reason: "provider" };
  }
}
