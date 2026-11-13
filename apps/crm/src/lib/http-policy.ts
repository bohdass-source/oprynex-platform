// Applied by src/server.ts to every response of the Worker.
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);
const MAX_BODY = 1_000_000;

export const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  // No script-src: the server output relies on inline scripts. These directives still block plugins, base tag and form hijacking and framing.
  "content-security-policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), geolocation=(), payment=(), microphone=()",
};

/** Answers before the app runs: plain http moves to https, an oversized body is refused. */
export function earlyResponse(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.protocol === "http:" && !LOCAL.has(url.hostname)) {
    url.protocol = "https:";
    return new Response(null, { status: 308, headers: { location: url.toString() } });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return new Response(null, { status: 413 });
  return null;
}

export function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  return secured;
}
