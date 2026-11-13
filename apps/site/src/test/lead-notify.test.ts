import { describe, expect, it } from "vitest";
import { buildNotificationMime } from "@/lib/lead-notify.server";
import type { LeadInput } from "@/lib/lead-schema";

const lead: LeadInput = { name: "Jörg Müller", email: "joerg@example.com", company: "Müller GmbH", message: "Wir brauchen einen Chatbot für unsere Website.", consent: true, source: "contact_form", language: "de", pagePath: "/contact" };
const id = "10f69410-1697-4ec0-a0ea-86b1a9468b2e";

function decodeBody(raw: string): string {
  const base64 = raw.split("\r\n\r\n")[1]!.replace(/\r\n/g, "");
  return new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
}

describe("lead notification email", () => {
  const raw = buildNotificationMime(lead, id, "owner@example.com", new Date("2026-11-04T12:00:00Z"));
  it("sends from the site domain, replies go to the visitor", () => {
    expect(raw).toContain("From: Oprynex Anfragen <anfragen@oprynex.de>");
    expect(raw).toContain("To: owner@example.com");
    expect(raw).toContain("Reply-To: joerg@example.com");
    expect(raw).toContain(`Message-ID: <${id}@oprynex.de>`);
  });
  it("encodes the subject and the body as UTF-8", () => {
    const subject = raw.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)![1]!;
    expect(atob(subject)).toContain("Neue Anfrage: J");
    const body = decodeBody(raw);
    expect(body).toContain("Name: Jörg Müller");
    expect(body).toContain("Wir brauchen einen Chatbot");
    expect(body).toContain(`/leads/${id}`);
  });
  it("cannot inject extra headers through name or email", () => {
    const evil = buildNotificationMime({ ...lead, name: "A\r\nBcc: x@evil.test", email: "a@b.de\r\nBcc: x@evil.test" }, id, "owner@example.com");
    const head = evil.split("\r\n\r\n")[0]!;
    expect(head.split("\r\n").some((line) => line.startsWith("Bcc:"))).toBe(false);
  });
});
