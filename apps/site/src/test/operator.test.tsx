import { describe, expect, it } from "vitest";
import { IMPRESSUM_MARKDOWN } from "@/lib/impressum-text";
import { DATENSCHUTZ_MARKDOWN } from "@/lib/datenschutz-text";
import { OPERATOR } from "@/lib/operator";

describe("operator data", () => {
  it("Impressum names the operator with full postal address and email", () => {
    for (const part of ["§ 5 DDG", OPERATOR.name, "Musterstraße 1", "12345 Musterstadt", "Deutschland", OPERATOR.email, "§ 18 Abs. 2 MStV"]) expect(IMPRESSUM_MARKDOWN).toContain(part);
  });
  it("Datenschutz names the controller with the same address and no placeholder", () => {
    expect(DATENSCHUTZ_MARKDOWN).toContain("Musterstraße 1\n12345 Musterstadt");
    expect(DATENSCHUTZ_MARKDOWN).not.toContain("wird vor dem offiziellen Start ergänzt");
  });
});
