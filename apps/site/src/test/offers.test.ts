import { describe, expect, it } from "vitest";
import { pageHead } from "@/lib/seo";
import { eur, offers, prices } from "@/lib/offers";

describe("offers and German metadata", () => {
  it("home page serves the German title by default", () => {
    expect(pageHead("/").meta[0]).toEqual({ title: "KI-Chatbots, CRM & Websites für Unternehmen | Oprynex" });
  });
  it("has four offers, each with its own page, and no Cloud or MVP", () => {
    expect(new Set(offers.map((o) => o.path)).size).toBe(4);
    expect(offers.map((o) => o.id)).toEqual(["chatbot", "website", "crm", "consulting"]);
  });
  it("hides every price in the public demo", () => {
    for (const o of offers) for (const l of ["ru", "de", "en"] as const) {
      expect(o.price[l], `${o.id} ${l}`).toContain("XXX €");
      expect(o.price[l], `${o.id} ${l}`).not.toMatch(/\d{2,}/);
    }
    expect(offers.find((o) => o.id === "website")!.price.de).toBe(`ab ${eur(prices.website, "de")} netto`);
  });
  it("shows a second price line for the chatbot's monthly fee and the consulting package", () => {
    expect(offers.filter((o) => o.priceNote).map((o) => o.id)).toEqual(["chatbot", "consulting"]);
    expect(offers[0]!.priceNote!.de).toContain(eur(prices.chatbotMonthly, "de"));
    const consulting = offers.find((o) => o.id === "consulting")!;
    expect(consulting.priceNote!.de).toContain(eur(prices.consultPackage, "de"));
    expect(consulting.options!.map((o) => o.price.de)).toEqual(["Kostenlos", `${eur(prices.consultHour, "de")} netto`, `${eur(prices.consultPackage, "de")} netto`]);
    expect(consulting.optionsNote!.de).toContain(eur(prices.website - prices.consultPackage, "de"));
  });
  it("offers consulting only in writing by email, never as a call or meeting", () => {
    const text = JSON.stringify(offers);
    expect(text).not.toMatch(/Online-Termin|Online meeting|Онлайн-встреч|Termin vereinbaren|Beratungstermin/);
    expect(offers.find((o) => o.id === "consulting")!.intro.de).toContain("ohne Telefonate und Termine");
  });
});
