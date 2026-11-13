import { describe, expect, it } from "vitest";
import { detectChatLanguage } from "@/lib/chat-language";
describe("local chat language detection", () => {
  it("detects German", () => expect(detectChatLanguage("Was kostet eine Website?", "en")).toBe("de"));
  it("detects English", () => expect(detectChatLanguage("How much does a website cost?", "de")).toBe("en"));
  it("detects Russian", () => expect(detectChatLanguage("Сколько стоит сайт?", "de")).toBe("ru"));
  it("answers Ukrainian in Russian", () => expect(detectChatLanguage("Скільки коштує сайт?", "en")).toBe("ru"));
  it("preserves language for CRM", () => { for (const language of ["de", "ru", "en"] as const) expect(detectChatLanguage("CRM", language)).toBe(language); });
  it("keeps ties and scores whole words plus German characters", () => {
    expect(detectChatLanguage("und and", "ru")).toBe("ru");
    expect(detectChatLanguage("theme island", "de")).toBe("de");
    expect(detectChatLanguage("größer", "en")).toBe("de");
  });
});