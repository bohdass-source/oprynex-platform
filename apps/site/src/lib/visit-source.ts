// Where the visitor came from, read once on arrival and kept only in memory for this page load. Nothing is stored in the
// browser and nothing leaves it unless the visitor sends a request. Only the host of the previous site is kept, never its path.
export type VisitSource = { referrerHost?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string };

let captured: VisitSource | null = null;
const clean = (value: string | null) => value?.trim().slice(0, 100) || undefined;

export function readVisitSource(referrer: string, search: string, ownHost: string): VisitSource {
  const out: VisitSource = {};
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host && host !== ownHost.replace(/^www\./, "")) out.referrerHost = host.slice(0, 100);
  } catch { /* no referrer */ }
  const params = new URLSearchParams(search);
  const source = clean(params.get("utm_source"));
  const medium = clean(params.get("utm_medium"));
  const campaign = clean(params.get("utm_campaign"));
  if (source) out.utmSource = source;
  if (medium) out.utmMedium = medium;
  if (campaign) out.utmCampaign = campaign;
  return out;
}

/** Runs once after hydration; later in-app navigation does not overwrite the first landing. */
export function captureVisitSource() {
  captured ??= readVisitSource(document.referrer, window.location.search, window.location.hostname);
}

export const visitSource = (): VisitSource => captured ?? {};
