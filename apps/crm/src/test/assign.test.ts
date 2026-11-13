import { describe, expect, it } from "vitest";
import { matchesOwner } from "@/lib/crm";

describe("assignee filter", () => {
  const mine = { assigned_to: "me" };
  const theirs = { assigned_to: "anna" };
  const nobody = { assigned_to: null };
  it("keeps everything without a filter", () => {
    expect([mine, theirs, nobody].every((l) => matchesOwner(l, undefined, "me"))).toBe(true);
  });
  it("finds my requests, unassigned ones and a colleague's", () => {
    expect([mine, theirs, nobody].filter((l) => matchesOwner(l, "me", "me"))).toEqual([mine]);
    expect([mine, theirs, nobody].filter((l) => matchesOwner(l, "none", "me"))).toEqual([nobody]);
    expect([mine, theirs, nobody].filter((l) => matchesOwner(l, "anna", "me"))).toEqual([theirs]);
  });
});
