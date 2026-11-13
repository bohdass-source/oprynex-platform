import { describe, expect, it } from "vitest";
import { envAllowedOrigins, isLeadOriginAllowed, leadSchema } from "@/lib/lead-schema";
import { siteUrl } from "@/lib/site-url";

const input = { name: "Test User", email: "test@example.com", message: "A valid inquiry message", consent: true, source: "contact_form", language: "de" };
describe("lead validation", () => {
  it("accepts all 20 visitor languages and nothing else", () => {
    for (const language of ["de","en","fr","es","it","nl","pl","pt","ro","cs","hu","bg","el","sv","da","fi","tr","ru","uk","kk"]) expect(leadSchema.safeParse({ ...input, language }).success).toBe(true);
    for (const language of ["zh","uz","az","xx",""]) expect(leadSchema.safeParse({ ...input, language }).success).toBe(false);
  });
  it("requires explicit consent", () => {
    expect(leadSchema.safeParse({ ...input, consent: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...input, consent: undefined }).success).toBe(false);
  });
  it.each([["name",100],["email",255],["company",150],["message",2000],["chatTopic",50],["pagePath",200],["website",200]] as const)("limits %s to %i characters", (field, max) => {
    expect(leadSchema.safeParse({ ...input, [field]: "x".repeat(max + 1) }).success).toBe(false);
    if (field !== "email") expect(leadSchema.safeParse({ ...input, [field]: "x".repeat(max) }).success).toBe(true);
  });
  it("enforces the contact minimums and email format", () => {
    for (const change of [{ name: " " }, { message: "123456789" }, { email: "invalid" }]) expect(leadSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
  it("rejects unknown properties", () => {
    expect(leadSchema.safeParse({ ...input, status: "done" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...input, ip: "127.0.0.1" }).success).toBe(false);
  });
  it("accepts only the three lead sources", () => {
    for (const source of ["contact_form","chat_lead","chat_handoff"]) expect(leadSchema.safeParse({ ...input, source }).success).toBe(true);
    expect(leadSchema.safeParse({ ...input, source: "other" }).success).toBe(false);
  });
  it("restricts production origins and isolates local development", () => {
    expect(isLeadOriginAllowed(siteUrl,false,[])).toBe(true);
    for (const origin of ["https://evil.example",`${siteUrl}.evil.example`,"https://other.oprynex.workers.dev",siteUrl.replace("https:", "http:"),"https://oprynex.lovable.app","http://localhost:8080"]) expect(isLeadOriginAllowed(origin,false,[])).toBe(false);
    expect(isLeadOriginAllowed("http://localhost:8080",true)).toBe(true);
  });
  it("accepts only exact extra HTTPS origins from ALLOWED_ORIGINS", () => {
    const extra = envAllowedOrigins(" https://oprynex.example.workers.dev, http://insecure.example, javascript:alert(1),https://oprynex.com ");
    expect(extra).toEqual(["https://oprynex.example.workers.dev","https://oprynex.com"]);
    expect(isLeadOriginAllowed("https://oprynex.example.workers.dev",false,extra)).toBe(true);
    expect(isLeadOriginAllowed("https://oprynex.com",false,extra)).toBe(true);
    for (const origin of ["https://evil.workers.dev","https://oprynex.com.evil.example","http://oprynex.com"]) expect(isLeadOriginAllowed(origin,false,extra)).toBe(false);
  });
});
