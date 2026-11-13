import { describe, expect, it } from "vitest";
import { STATUSES } from "@/lib/crm";
import { dict, entryLabel, importFieldLabel, makeI18n, periodLabel, permissionLabel, problemLabel, productLabel, roleLabel, sourceLabel, statusLabel, taskGroupLabel, UI_LANGUAGES } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";

describe("ui texts", () => {
  it("every text exists in German, Russian and English", () => {
    for (const table of [dict, statusLabel, sourceLabel, taskGroupLabel, productLabel, entryLabel, periodLabel, roleLabel, permissionLabel, importFieldLabel, problemLabel] as Record<string, Record<string, string>>[])
      for (const [key, value] of Object.entries(table))
        for (const lang of UI_LANGUAGES) expect(value[lang]?.trim(), `${key}.${lang}`).toBeTruthy();
  });
  it("labels every pipeline status", () => {
    for (const s of STATUSES) expect(statusLabel[s].de).toBeTruthy();
    for (const p of PRODUCTS) expect(productLabel[p].de).toBeTruthy();
  });
  it("names a visitor language in the UI language", () => {
    expect(makeI18n("de").languageName("pl")).toBe("Polnisch");
    expect(makeI18n("en").languageName("uk")).toBe("Ukrainian");
  });
});
