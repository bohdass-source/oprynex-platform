import { describe, expect, it } from "vitest";
import { customersFrom, searchCustomers, type Lead, type Ticket } from "@/lib/crm";

const lead = (p: Partial<Lead>): Lead => ({ id: "l", workspace_id: "ws", created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-01T10:00:00Z", name: "Anna", email: "anna@example.de", company: null, message: "Hallo", source: "contact_form", chat_topic: null, language: "de", page_path: null, consent_at: null, status: "new", assigned_to: null, product: null, value_eur: null, ...p }) as Lead;
const ticket = (p: Partial<Ticket>): Ticket => ({ id: "t", number: 1, workspace_id: "ws", lead_id: null, created_at: "2026-10-05T10:00:00Z", updated_at: "2026-10-05T10:00:00Z", subject: "Frage", customer_name: "Anna K.", customer_email: "anna@example.de", channel: "manual", status: "open", priority: "normal", assigned_to: null, ...p });

describe("customers", () => {
  it("groups requests and tickets by email, ignoring case and spam", () => {
    const list = customersFrom(
      [lead({ id: "a", email: "Anna@Example.de", status: "won", value_eur: 1200, company: "Praxis Klein" }), lead({ id: "b", created_at: "2026-10-03T10:00:00Z" }), lead({ id: "s", email: "spam@x.de", status: "spam" })],
      [ticket({ id: "t1" }), ticket({ id: "t2", customer_email: "", customer_name: "Ohne Mail" })],
    );
    expect(list).toHaveLength(1);
    const anna = list[0]!;
    expect(anna).toMatchObject({ email: "anna@example.de", name: "Anna K.", company: "Praxis Klein", openRequests: 1, openTickets: 1, wonEur: 1200, first: "2026-10-01T10:00:00Z", last: "2026-10-05T10:00:00Z" });
    expect(anna.leads.map((l) => l.id)).toEqual(["b", "a"]);
  });
  it("lists the latest contact first and finds by name, company or email", () => {
    const list = customersFrom([lead({ id: "a" }), lead({ id: "b", email: "ben@bau.de", name: "Ben", company: "Bau GmbH", created_at: "2026-11-01T10:00:00Z" })], []);
    expect(list.map((c) => c.email)).toEqual(["ben@bau.de", "anna@example.de"]);
    expect(searchCustomers(list, "bau").map((c) => c.name)).toEqual(["Ben"]);
    expect(searchCustomers(list, "ANNA@").map((c) => c.name)).toEqual(["Anna"]);
  });
});
