// Rules the Worker applies to every request before and after the app renders:
// one canonical address per page (https, no trailing slash) and browser security headers.

import { formerHosts, siteUrl } from "@/lib/site-url";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Pages that were removed (Oprynex Cloud and MVP are no longer offered, 2026-11-07): one permanent hop to the closest
// page that still exists, so old links and search results keep working.
export const MOVED_PAGES: Record<string, string> = {
  "/cloud": "/crm-entwicklung",
  "/platform": "/services",
  "/mvp-entwicklung": "/services",
  "/mvp-kosten": "/services",
  "/crm-kleine-unternehmen": "/crm-kosten",
};

// Permanent redirects (301/308) tell search engines which address to keep; the router's own
// trailing-slash redirect is a temporary 307. Local development stays on plain http.
export function canonicalRedirect(request: Request, former: readonly string[] = formerHosts): Response | null {
  const url = new URL(request.url);
  // An address the site used before its own domain: one permanent hop to the same page on siteUrl.
  if (former.includes(url.hostname)) {
    const target = new URL(url.pathname.replace(/(.)\/+$/, "$1") + url.search, siteUrl);
    return new Response(null, { status: 308, headers: { location: target.toString() } });
  }
  const moved = MOVED_PAGES[url.pathname.replace(/(.)\/+$/, "$1")];
  if (moved) return new Response(null, { status: 308, headers: { location: new URL(moved + url.search, LOCAL_HOSTS.has(url.hostname) ? url.origin : siteUrl).toString() } });
  const local = LOCAL_HOSTS.has(url.hostname);
  const insecure = url.protocol === "http:" && !local;
  const slash = url.pathname.length > 1 && url.pathname.endsWith("/");
  if (!insecure && !slash) return null;
  if (insecure) url.protocol = "https:";
  if (slash) url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  // 308 keeps the method and body, so a stray POST is not turned into a GET.
  return new Response(null, { status: insecure && !slash ? 301 : 308, headers: { location: url.toString() } });
}

// No full Content-Security-Policy: the SSR output relies on inline scripts. frame-ancestors
// still blocks clickjacking; the microphone stays allowed for the chat's dictation.
export const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), geolocation=(), payment=(), microphone=(self)",
};

/** The forms and the chat send far less than this; a larger body is refused before it reaches the app. */
const MAX_BODY = 64_000;
export function bodyTooLarge(request: Request): Response | null {
  return Number(request.headers.get("content-length") ?? 0) > MAX_BODY ? new Response(null, { status: 413 }) : null;
}

export function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!secured.headers.has(name)) secured.headers.set(name, value);
  }
  return secured;
}
