import { afterEach, describe, expect, it, vi } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";
import { loadSiteStats } from "@/lib/site-stats";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
const beacon = () => document.getElementById("site-stats");
afterEach(() => { store.clear(); beacon()?.remove(); });

describe("site statistics", () => {
  it("stays off without a choice, after a rejection and without a token", () => {
    loadSiteStats("token");
    expect(beacon()).toBeNull();
    store.set(COOKIE_CONSENT_KEY, "rejected");
    loadSiteStats("token");
    expect(beacon()).toBeNull();
    store.set(COOKIE_CONSENT_KEY, "accepted");
    loadSiteStats("");
    expect(beacon()).toBeNull();
  });
  it("loads once after acceptance", () => {
    store.set(COOKIE_CONSENT_KEY, "accepted");
    loadSiteStats("token");
    loadSiteStats("token");
    expect(document.querySelectorAll("#site-stats")).toHaveLength(1);
  });
});
