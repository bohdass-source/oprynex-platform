import { describe, expect, it } from "vitest";

import { canonicalRedirect, SECURITY_HEADERS, withSecurityHeaders } from "@/lib/http-policy";
import { siteUrl } from "@/lib/site-url";

const site = siteUrl;

describe("canonical redirects", () => {
  it("leaves canonical addresses alone", () => {
    expect(canonicalRedirect(new Request(`${site}/`))).toBeNull();
    expect(canonicalRedirect(new Request(`${site}/assistants?x=1`))).toBeNull();
  });

  it("moves http to https permanently", () => {
    const r = canonicalRedirect(new Request(site.replace("https:", "http:") + "/preise"));
    expect(r?.status).toBe(301);
    expect(r?.headers.get("location")).toBe(`${site}/preise`);
  });

  it("drops a trailing slash with a permanent 308 and keeps the query", () => {
    const r = canonicalRedirect(new Request(`${site}/assistants/?utm=a`));
    expect(r?.status).toBe(308);
    expect(r?.headers.get("location")).toBe(`${site}/assistants?utm=a`);
  });

  it("fixes http and the slash in one hop", () => {
    const r = canonicalRedirect(new Request(site.replace("https:", "http:") + "/faq//"));
    expect(r?.headers.get("location")).toBe(`${site}/faq`);
  });

  it("keeps local development on http", () => {
    expect(canonicalRedirect(new Request("http://localhost:8080/assistants"))).toBeNull();
  });

  it("sends a former host to the same page on the current address in one permanent hop", () => {
    const r = canonicalRedirect(new Request("http://old.example.workers.dev/assistants/?utm=a"), ["old.example.workers.dev"]);
    expect(r?.status).toBe(308);
    expect(r?.headers.get("location")).toBe(`${site}/assistants?utm=a`);
    expect(canonicalRedirect(new Request("https://old.example.workers.dev/"), ["old.example.workers.dev"])?.headers.get("location")).toBe(`${site}/`);
    expect(canonicalRedirect(new Request(`${site}/assistants`), ["old.example.workers.dev"])).toBeNull();
  });
});

describe("security headers", () => {
  it("adds every header without dropping the response", async () => {
    const r = withSecurityHeaders(new Response("ok", { status: 404, headers: { "content-type": "text/html" } }));
    expect(r.status).toBe(404);
    expect(await r.text()).toBe("ok");
    expect(r.headers.get("content-type")).toBe("text/html");
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(r.headers.get(name)).toBe(value);
  });

  it("keeps the microphone for chat dictation", () => {
    expect(SECURITY_HEADERS["permissions-policy"]).toContain("microphone=(self)");
  });
});
