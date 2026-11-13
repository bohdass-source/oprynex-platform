import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error { status = 500; }
  class RateLimitError extends APIError {}
  class AuthenticationError extends APIError {}
  class APIConnectionError extends APIError {}
  class Anthropic { beta = { messages: { create } }; static APIError = APIError; static RateLimitError = RateLimitError; static AuthenticationError = AuthenticationError; static APIConnectionError = APIConnectionError; }
  return { default: Anthropic };
});
import { callChatModel, withLanguageNote } from "@/lib/ask-chat.server";
import { askChatInputSchema } from "@/lib/ask-chat-schema";
const msgs = [{ role: "user" as const, content: "Hallo" }];
const text = (t: string, stop = "end_turn") => ({ stop_reason: stop, content: [{ type: "thinking", thinking: "" }, { type: "text", text: t }] });
beforeEach(() => { process.env["ANTHROPIC_API_KEY"] = "test"; vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { delete process.env["ANTHROPIC_API_KEY"]; vi.restoreAllMocks(); create.mockReset(); });
describe("callChatModel", () => {
  it("returns a valid answer and sends the required request shape", async () => {
    create.mockResolvedValue(text(JSON.stringify({ answer: "Hi", suggestions: ["price"], handoff: false, language: "pl" })));
    expect(await callChatModel(msgs, "en")).toEqual({ ok: true, answer: "Hi", suggestions: ["price"], handoff: false, language: "pl" });
    const body = create.mock.calls[0]?.[0];
    expect(body).toMatchObject({ model: "claude-opus-5-5", max_tokens: 4000, fallbacks: "default", betas: ["server-side-fallback-2026-07-01"], messages: [...msgs, { role: "system", content: expect.stringContaining("Website language: English") }] });
    expect(body).not.toHaveProperty("thinking"); expect(body).not.toHaveProperty("temperature");
  });
  it("refusal and max_tokens map to refusal", async () => {
    create.mockResolvedValueOnce(text("", "refusal")).mockResolvedValueOnce(text("{", "max_tokens"));
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "refusal" });
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "refusal" });
  });
  it("invalid JSON or schema maps to invalid", async () => {
    create.mockResolvedValueOnce(text("not json")).mockResolvedValueOnce(text(JSON.stringify({ answer: "x", suggestions: ["a", "b", "c", "d"], handoff: false })));
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "invalid" });
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "invalid" });
  });
  it("keeps over-long answers by cutting them at a sentence end", async () => {
    const long = "Erster Satz über Oprynex. ".repeat(120);
    create.mockResolvedValue(text(JSON.stringify({ answer: long, suggestions: ["price", "price", "time", "lead", "human"], handoff: false, language: "de" })));
    const result = await callChatModel(msgs, "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.answer.length).toBeLessThanOrEqual(1500);
    expect(result.answer.endsWith(".…")).toBe(true);
    expect(result.suggestions).toEqual(["price", "time", "lead"]);
  });
  it("rejects a language outside the 20 supported codes", async () => {
    create.mockResolvedValue(text(JSON.stringify({ answer: "Hi", suggestions: [], handoff: false, language: "zh" })));
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "invalid" });
  });
  it("thrown errors map to provider, missing key to disabled", async () => {
    create.mockRejectedValue(new Error("boom"));
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "provider" });
    delete process.env["ANTHROPIC_API_KEY"];
    expect(await callChatModel(msgs, "en")).toEqual({ ok: false, reason: "disabled" });
  });
});
describe("system prompt rules", () => {
  it("keeps the owner's name in Latin letters and quotes the real button labels", async () => {
    const { SYSTEM_PROMPT } = await import("@/lib/chat-knowledge.server");
    expect(SYSTEM_PROMPT).toContain("never transliterate it");
    for (const label of ["An einen Menschen schreiben", "Aufgabe besprechen", "Написать человеку", "Обсудить задачу", "Write to a person", "Discuss my task"]) expect(SYSTEM_PROMPT).toContain(label);
  });
});
describe("language note", () => {
  it("forces the chosen chat language when the visitor picked one", () => {
    const note = withLanguageNote(msgs, "en", "pl").at(-1);
    expect(note).toEqual({ role: "system", content: expect.stringContaining("Always answer in Polish") });
  });
  it("tells the assistant today's date in German time for meeting wishes", () => {
    const note = withLanguageNote(msgs, "ru", undefined, new Date("2026-11-02T23:30:00Z")).at(-1);
    expect(note?.content).toContain("Today is Tuesday, 2026-11-03 (Berlin time, Europe/Berlin).");
  });
  it("accepts only supported reply languages", () => {
    expect(askChatInputSchema.safeParse({ messages: msgs, language: "en", reply: "kk" }).success).toBe(true);
    expect(askChatInputSchema.safeParse({ messages: msgs, language: "en", reply: "zh" }).success).toBe(false);
  });
});
describe("askChat input validation", () => {
  const ok = { messages: msgs, language: "de" };
  it("accepts a valid request", () => expect(askChatInputSchema.safeParse(ok).success).toBe(true));
  it("rejects more than 12 messages", () => expect(askChatInputSchema.safeParse({ ...ok, messages: Array.from({ length: 13 }, () => msgs[0]) }).success).toBe(false));
  it("rejects content over 600 chars", () => expect(askChatInputSchema.safeParse({ ...ok, messages: [{ role: "user", content: "a".repeat(601) }] }).success).toBe(false));
  it("rejects when the last message is not from the user", () => expect(askChatInputSchema.safeParse({ ...ok, messages: [...msgs, { role: "assistant", content: "x" }] }).success).toBe(false));
  it("rejects unknown fields", () => expect(askChatInputSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false));
});
