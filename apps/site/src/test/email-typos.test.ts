import { describe, expect, it } from "vitest";
import { suggestEmail } from "@/lib/email-typos";

describe("email typo hint", () => {
  it("proposes the provider a visitor most likely meant", () => {
    expect(suggestEmail("anna@ptotonmail.com")).toBe("anna@protonmail.com");
    expect(suggestEmail("Ben@gmial.com")).toBe("ben@gmail.com");
    expect(suggestEmail("c@gmx.dee")).toBe("c@gmx.de");
    expect(suggestEmail("d@hotmial.de")).toBe("d@hotmail.de");
  });
  it("leaves correct and company addresses alone", () => {
    for (const ok of ["anna@protonmail.com", "info@praxis-weber.de", "max@firma.de", "x@web.de", "kein-mail", "a@b"]) expect(suggestEmail(ok)).toBeNull();
  });
});
