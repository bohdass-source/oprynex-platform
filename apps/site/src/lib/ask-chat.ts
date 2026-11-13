import { askChatAnswerSchema, askChatInputSchema, type AskChatInput, type AskChatResult } from "@/lib/ask-chat-schema";
import { askChatFunction } from "@/lib/ask-chat.functions";

export async function askChat(input: AskChatInput): Promise<AskChatResult> {
  const parsed = askChatInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error" };
  try {
    const response = await askChatFunction({ data: parsed.data });
    if (response.status === 429) return { ok: false, reason: "limited" };
    const body = await response.json().catch(() => null) as { ok?: boolean; reason?: string } | null;
    if (!response.ok || !body) return { ok: false, reason: "error" };
    if (body.ok === true) {
      const fields = body as Record<string, unknown>;
      const answer = askChatAnswerSchema.safeParse({ answer: fields["answer"], suggestions: fields["suggestions"], handoff: fields["handoff"], language: fields["language"] });
      return answer.success ? { ok: true, ...answer.data } : { ok: false, reason: "invalid" };
    }
    return { ok: false, reason: body.reason === "capacity" ? "capacity" : "error" };
  } catch { return { ok: false, reason: "error" }; }
}
