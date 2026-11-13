import { z } from "zod";

export const COOKIE_CONSENT_KEY = "oprynex-cookie-consent";
export const COOKIE_CONSENT_EVENT = "oprynex-cookie-consent-change";
export const OPEN_COOKIE_SETTINGS_EVENT = "oprynex-open-cookie-settings";
export const cookieConsentSchema = z.enum(["accepted", "rejected"]);
export type CookieConsent = z.infer<typeof cookieConsentSchema>;

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const result = cookieConsentSchema.safeParse(localStorage.getItem(COOKIE_CONSENT_KEY));
    return result.success ? result.data : null;
  } catch { return null; }
}

export function saveCookieConsent(value: CookieConsent) {
  const consent = cookieConsentSchema.parse(value);
  try { localStorage.setItem(COOKIE_CONSENT_KEY, consent); } catch { /* Choice remains valid for this visit. */ }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}