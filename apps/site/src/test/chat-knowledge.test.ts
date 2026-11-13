import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "@/lib/chat-knowledge.server";
import { eur, offers, prices } from "@/lib/offers";

describe("chat knowledge prices", () => {
  it("names every published offer price from the offers registry", () => {
    for (const o of offers) expect(SYSTEM_PROMPT).toContain(o.price.en);
    expect(SYSTEM_PROMPT).toContain(eur(prices.chatbotMonthly, "en"));
    expect(SYSTEM_PROMPT).toContain(eur(prices.chatbot, "en"));
  });
  it("no longer claims that prices are unpublished and leaves no template slot", () => {
    expect(SYSTEM_PROMPT).not.toContain("{{PRICES}}");
    expect(SYSTEM_PROMPT).not.toMatch(/Prices and timelines are not published|Contents and prices are not defined/);
    expect(SYSTEM_PROMPT).toContain("/preise");
  });
});

describe("chat knowledge contact", () => {
  it("knows the published business address and email from the operator data", async () => {
    const { OPERATOR } = await import("@/lib/operator");
    expect(SYSTEM_PROMPT).toContain(`${OPERATOR.street}, ${OPERATOR.postalCode} ${OPERATOR.city}`);
    expect(SYSTEM_PROMPT).toContain(OPERATOR.email);
    expect(SYSTEM_PROMPT).not.toContain("{{");
  });
});

describe("chat knowledge languages", () => {
  it("offers client projects in any of the 20 visitor languages", async () => {
    const { VISITOR_LANGUAGE_ENGLISH } = await import("@/lib/visitor-languages");
    for (const name of Object.values(VISITOR_LANGUAGE_ENGLISH)) expect(SYSTEM_PROMPT).toContain(name);
    expect(SYSTEM_PROMPT).toContain("can be delivered in any of the 20 languages");
    expect(SYSTEM_PROMPT).not.toMatch(/13 languages/);
  });
});

describe("chat knowledge tone", () => {
  it("keeps answers short and plain and explains abbreviations", () => {
    expect(SYSTEM_PROMPT).toContain("usually 2–4 short sentences");
    expect(SYSTEM_PROMPT).toContain("Keep a normal reply under 600 characters");
    expect(SYSTEM_PROMPT).toContain("Explain every abbreviation in plain words");
    expect(SYSTEM_PROMPT).toContain("Put each list item on its own line");
  });
  it("solves the visitor's problem instead of pushing a consultation", () => {
    expect(SYSTEM_PROMPT).toContain("The visitor must leave with a solution to their problem.");
    expect(SYSTEM_PROMPT).toContain("do not offer a consultation, a call or the contact form in every reply");
    expect(SYSTEM_PROMPT).not.toContain("end with one concrete next step");
  });
  it("keeps answers short once the visitor asks for it or is annoyed", () => {
    expect(SYSTEM_PROMPT).toContain("If the visitor asks for shorter answers, says they are annoyed, or declines an offer");
    expect(SYSTEM_PROMPT).toContain("never answer a complaint only with an offer to talk to a person");
  });
});

describe("chat knowledge offer range", () => {
  it("tells visitors that everything runs by email and explains combinations and the consulting package", () => {
    expect(SYSTEM_PROMPT).toContain("Oprynex communicates only in writing by email: there are no phone calls, video calls or meetings");
    expect(SYSTEM_PROMPT).toContain("A visitor may want several offers at once");
    expect(SYSTEM_PROMPT).toContain(eur(prices.consultPackage, "en"));
    expect(SYSTEM_PROMPT).not.toMatch(/fit_erp|fit_mvp/);
  });
  it("says plainly that Cloud, MVP and ERP are not offered and names them nowhere as products", () => {
    expect(SYSTEM_PROMPT).toContain("Oprynex does not sell a CRM subscription or software platform and does not develop MVPs or ERP systems.");
    expect(SYSTEM_PROMPT).not.toMatch(/Oprynex Cloud|\/cloud|\/mvp-entwicklung|\/platform/);
  });
  it("treats meeting wishes as requests with a concrete date", () => {
    expect(SYSTEM_PROMPT).toContain("Never promise or confirm a call or meeting.");
    expect(SYSTEM_PROMPT).toContain("There is no live chat with a person");
  });
});

describe("chat knowledge data protection", () => {
  it("answers where data is stored, the AVV and the subprocessors", () => {
    for (const fact of ["Frankfurt", "/avv", "Art. 28", "Cloudflare", "Supabase", "Anthropic", "/datenschutz"]) expect(SYSTEM_PROMPT).toContain(fact);
  });
});
