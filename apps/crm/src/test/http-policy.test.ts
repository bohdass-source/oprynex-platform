import { describe, expect, it } from "vitest";
import { earlyResponse, withSecurityHeaders } from "@/lib/http-policy";

describe("http policy", () => {
  it("moves http to https and keeps the path", () => {
    const r = earlyResponse(new Request("http://app.oprynex.de/leads?x=1"));
    expect(r?.status).toBe(308);
    expect(r?.headers.get("location")).toBe("https://app.oprynex.de/leads?x=1");
  });
  it("leaves https and local development alone", () => {
    expect(earlyResponse(new Request("https://app.oprynex.de/"))).toBeNull();
    expect(earlyResponse(new Request("http://localhost:8090/"))).toBeNull();
  });
  it("refuses an oversized body", () => {
    expect(earlyResponse(new Request("https://app.oprynex.de/api/push", { method: "POST", headers: { "content-length": "2000000" }, body: "x" }))?.status).toBe(413);
  });
  it("adds the security headers", () => {
    const h = withSecurityHeaders(new Response("ok")).headers;
    expect(h.get("x-frame-options")).toBe("DENY");
    expect(h.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(h.get("strict-transport-security")).toContain("max-age");
  });
});
