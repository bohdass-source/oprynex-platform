import { COOKIE_CONSENT_EVENT, readCookieConsent } from "@/lib/cookie-consent";

// Cloudflare Web Analytics beacon token (public by design, it ships in the page). Empty keeps statistics fully off.
export const SITE_STATS_TOKEN = "";

export function loadSiteStats(token: string = SITE_STATS_TOKEN) {
  if (!token || readCookieConsent() !== "accepted" || document.getElementById("site-stats")) return;
  const script = document.createElement("script");
  script.id = "site-stats";
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset["cfBeacon"] = JSON.stringify({ token });
  document.head.append(script);
}

/** Loads the beacon only after explicit acceptance, now or when the visitor accepts later. A rejection never loads it. */
export function watchSiteStats() {
  loadSiteStats();
  const onChange = () => loadSiteStats();
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
}
