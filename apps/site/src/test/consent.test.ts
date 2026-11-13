import { afterEach, describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact-schema";
import { COOKIE_CONSENT_KEY, readCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";
import { trackConversion } from "@/lib/offers";

const inquiry = { name: "Max Mustermann", email: "test@example.com", company: "", message: "Ich möchte eine Beratung." };
const trackingWindow = window as unknown as { dataLayer?: unknown[] };
afterEach(() => { localStorage.clear(); delete trackingWindow.dataLayer; });

describe("inquiry consent", () => {
  it("rejects an inquiry without explicit consent", () => {
    expect(contactSchema.safeParse({ ...inquiry, consent: false }).success).toBe(false);
    expect(contactSchema.safeParse(inquiry).success).toBe(false);
  });
  it("allows a valid inquiry with explicit consent", () => {
    expect(contactSchema.safeParse({ ...inquiry, consent: true }).success).toBe(true);
  });
});

describe("cookie choices", () => {
  it("remembers acceptance and rejection and allows changing the choice", () => {
    saveCookieConsent("accepted");
    expect(readCookieConsent()).toBe("accepted");
    saveCookieConsent("rejected");
    expect(readCookieConsent()).toBe("rejected");
  });
  it("does not enable optional tracking with no choice or a rejected choice", () => {
    trackConversion("cloud", "inquiry");
    expect(trackingWindow.dataLayer).toBeUndefined();
    saveCookieConsent("rejected");
    trackConversion("cloud", "inquiry");
    expect(trackingWindow.dataLayer).toBeUndefined();
  });
  it("records conversion events only after acceptance", () => {
    saveCookieConsent("accepted");
    trackConversion("cloud", "inquiry");
    expect(trackingWindow.dataLayer).toEqual([{ event: "oprynex_conversion", service: "cloud", action: "inquiry" }]);
  });
  it("treats invalid stored choices as undecided", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    expect(readCookieConsent()).toBeNull();
  });
});