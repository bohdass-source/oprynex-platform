import { afterEach, describe, expect, it, vi } from "vitest";
const { submit } = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("@/lib/submit-lead.functions", () => ({ submitLeadFunction: submit }));
import { submitLead } from "@/lib/submit-lead";
const input = { name: "Test User", email: "test@example.com", message: "A valid inquiry message", consent: true as const, source: "contact_form" as const, language: "de" as const };
afterEach(() => vi.resetAllMocks());
describe("lead client contract", () => {
  it("reports success only on an explicit successful response", async () => {
    submit.mockResolvedValue(Response.json({ ok: true, id: "10f69410-1697-4ec0-a0ea-86b1a9468b2e" }));
    expect(await submitLead(input)).toEqual({ ok: true, id: "10f69410-1697-4ec0-a0ea-86b1a9468b2e" });
    submit.mockResolvedValue(Response.json({ ok: false }));
    expect((await submitLead(input)).ok).toBe(false);
  });
  it("preserves a 429 failure", async () => {
    submit.mockResolvedValue(Response.json({ ok: false }, { status: 429 }));
    expect(await submitLead(input)).toEqual({ ok: false, status: 429 });
  });
  it("handles network failures", async () => {
    submit.mockRejectedValue(new Error("offline"));
    expect(await submitLead(input)).toEqual({ ok: false, status: 500 });
  });
  it("never sends invalid consent", async () => {
    expect((await submitLead({ ...input, consent: false as unknown as true })).ok).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });
});