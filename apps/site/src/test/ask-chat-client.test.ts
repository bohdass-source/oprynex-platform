import { beforeEach, describe, expect, it, vi } from "vitest";
const { serverFn } = vi.hoisted(() => ({ serverFn: vi.fn() }));
vi.mock("@/lib/ask-chat.functions", () => ({ askChatFunction: serverFn }));
import { askChat } from "@/lib/ask-chat";

const input = { messages: [{ role: "user" as const, content: "Ile kosztuje strona?" }], language: "de" as const };
const reply = (body: object, status = 200) => Response.json(body, { status });
beforeEach(() => serverFn.mockReset());

describe("askChat client", () => {
  it("keeps the visitor language from a valid server answer", async () => {
    serverFn.mockResolvedValue(reply({ ok: true, answer: "Cześć", suggestions: ["price"], handoff: false, language: "pl" }));
    expect(await askChat(input)).toEqual({ ok: true, answer: "Cześć", suggestions: ["price"], handoff: false, language: "pl" });
  });
  it("treats an answer without a supported language as invalid", async () => {
    serverFn.mockResolvedValue(reply({ ok: true, answer: "Hi", suggestions: [], handoff: false }));
    expect(await askChat(input)).toEqual({ ok: false, reason: "invalid" });
  });
  it("maps 429 to limited and capacity to capacity", async () => {
    serverFn.mockResolvedValueOnce(reply({ ok: false, reason: "limited" }, 429)).mockResolvedValueOnce(reply({ ok: false, reason: "capacity" }));
    expect(await askChat(input)).toEqual({ ok: false, reason: "limited" });
    expect(await askChat(input)).toEqual({ ok: false, reason: "capacity" });
  });
});
