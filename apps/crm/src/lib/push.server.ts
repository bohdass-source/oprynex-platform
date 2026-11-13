import { VAPID_PUBLIC_KEY } from "@/lib/push-key";

// Web Push without a payload (RFC 8030 + VAPID, RFC 8292): the push service only wakes the CRM's service worker, which
// shows a fixed "something new" notification. Nothing about the request travels through Apple, Google or Mozilla.

/** SHA-256 of the token the database sends in x-push-token (0111_push_notifications.sql). Not a secret. */
export const PUSH_HOOK_SHA256 = "0000000000000000000000000000000000000000000000000000000000000000"; // SHA-256 of your private.push_hook token

const b64url = (bytes: Uint8Array | ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const text = (s: string) => new TextEncoder().encode(s);

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", text(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Signed VAPID JWT for one push service (audience = its origin), valid for 12 hours. */
export async function vapidJwt(audience: string, privateJwk: JsonWebKey, now = Date.now()): Promise<string> {
  const header = b64url(text(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(text(JSON.stringify({ aud: audience, exp: Math.floor(now / 1000) + 12 * 3600, sub: "mailto:kontakt@example.com" })));
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, text(`${header}.${claims}`));
  return `${header}.${claims}.${b64url(signature)}`;
}

/** Only https endpoints of known browser push services are called. */
export function isPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && /(^|\.)(googleapis\.com|push\.apple\.com|mozilla\.com|mozaws\.net|windows\.com|notify\.windows\.com)$/.test(url.hostname);
  } catch { return false; }
}

export type PushOutcome = { sent: number; gone: string[]; failed: number };

/** Wakes every endpoint; 404/410 answers mean the device unsubscribed. */
export async function sendEmptyPushes(endpoints: string[], privateJwk: JsonWebKey, fetcher: typeof fetch = fetch): Promise<PushOutcome> {
  const outcome: PushOutcome = { sent: 0, gone: [], failed: 0 };
  const tokens = new Map<string, string>();
  await Promise.all(endpoints.filter(isPushEndpoint).map(async (endpoint) => {
    const audience = new URL(endpoint).origin;
    if (!tokens.has(audience)) tokens.set(audience, await vapidJwt(audience, privateJwk));
    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        headers: { authorization: `vapid t=${tokens.get(audience)}, k=${VAPID_PUBLIC_KEY}`, ttl: "86400", urgency: "high", "content-length": "0" },
      });
      if (response.status === 404 || response.status === 410) outcome.gone.push(endpoint);
      else if (response.ok) outcome.sent += 1;
      else outcome.failed += 1;
    } catch { outcome.failed += 1; }
  }));
  return outcome;
}
