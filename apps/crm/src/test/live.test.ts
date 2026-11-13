import { describe, expect, it } from "vitest";
import type { Lead } from "@/lib/crm";
import { arrivals, titleWithCount } from "@/lib/live";

const lead = (id: string, status: Lead["status"] = "new") => ({ id, status }) as Lead;

describe("tab title", () => {
  it("shows the count of new requests in front of the title", () => {
    expect(titleWithCount("Oprynex CRM", 3)).toBe("(3) Oprynex CRM");
  });
  it("replaces an older count and drops it at zero", () => {
    expect(titleWithCount("(3) Oprynex CRM", 1)).toBe("(1) Oprynex CRM");
    expect(titleWithCount("(1) Oprynex CRM", 0)).toBe("Oprynex CRM");
  });
});

describe("arrivals", () => {
  it("reports nothing on the first load", () => {
    expect(arrivals(null, [lead("a"), lead("b")])).toEqual([]);
  });
  it("reports only unknown requests that are still new", () => {
    const known = new Set(["a"]);
    expect(arrivals(known, [lead("c", "spam"), lead("b"), lead("a")]).map((l) => l.id)).toEqual(["b"]);
  });
});
