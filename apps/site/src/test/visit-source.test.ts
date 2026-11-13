import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/lead-schema";
import { readVisitSource } from "@/lib/visit-source";

describe("visit source", () => {
  it("keeps only the host of an outside site", () => {
    expect(readVisitSource("https://www.google.com/search?q=secret", "", "oprynex.de")).toEqual({ referrerHost: "google.com" });
  });
  it("ignores the site itself and an empty referrer", () => {
    expect(readVisitSource("https://www.oprynex.de/preise", "", "oprynex.de")).toEqual({});
    expect(readVisitSource("", "", "oprynex.de")).toEqual({});
  });
  it("reads campaign tags and caps their length so a long link never blocks a request", () => {
    const source = readVisitSource("", `?utm_source=${"x".repeat(300)}&utm_medium=cpc&utm_campaign=herbst`, "oprynex.de");
    expect(source.utmSource).toHaveLength(100);
    expect(source).toMatchObject({ utmMedium: "cpc", utmCampaign: "herbst" });
    expect(leadSchema.safeParse({ name: "Anna", email: "a@b.de", message: "Hallo, bitte um Rückruf", consent: true, source: "contact_form", language: "de", ...source }).success).toBe(true);
  });
});

describe("chat topic line", () => {
  it("leaves the topic open when the visitor asks for a person", async () => {
    const { chatTopicLine } = await import("@/lib/chat-scenarios");
    expect(chatTopicLine("human", "ru")).toBe("Тема: ");
    expect(chatTopicLine("human", "de")).toBe("Thema: ");
  });
});
