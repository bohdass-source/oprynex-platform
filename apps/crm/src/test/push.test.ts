import { describe, expect, it, vi } from "vitest";
import { keyBytes, needsInstall } from "@/lib/push-client";
import { PUSH_HOOK_SHA256, isPushEndpoint, sendEmptyPushes, sha256Hex, vapidJwt } from "@/lib/push.server";

async function keys() {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  return { pair, jwk: await crypto.subtle.exportKey("jwk", pair.privateKey) };
}
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

describe("VAPID", () => {
  it("signs a JWT for the push service that the public key verifies", async () => {
    const { pair, jwk } = await keys();
    const jwt = await vapidJwt("https://fcm.googleapis.com", jwk, Date.UTC(2026, 10, 2));
    const [header, claims, signature] = jwt.split(".");
    expect(JSON.parse(new TextDecoder().decode(fromB64url(header!)))).toEqual({ typ: "JWT", alg: "ES256" });
    expect(JSON.parse(new TextDecoder().decode(fromB64url(claims!)))).toMatchObject({ aud: "https://fcm.googleapis.com", exp: Date.UTC(2026, 10, 2) / 1000 + 43200 });
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, fromB64url(signature!), new TextEncoder().encode(`${header}.${claims}`));
    expect(ok).toBe(true);
  });
  it("calls only real push services", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/QG")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isPushEndpoint("https://evil.example/collect")).toBe(false);
    expect(isPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
  });
  it("sends empty pushes and reports devices that are gone", async () => {
    const { jwk } = await keys();
    const fetcher = vi.fn(async (url: string, _init?: RequestInit) => new Response(null, { status: url.endsWith("gone") ? 410 : 201 }));
    const outcome = await sendEmptyPushes(["https://fcm.googleapis.com/a", "https://fcm.googleapis.com/gone", "https://evil.example/x"], jwk, fetcher as unknown as typeof fetch);
    expect(outcome).toEqual({ sent: 1, gone: ["https://fcm.googleapis.com/gone"], failed: 0 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const init = fetcher.mock.calls[0]![1] as unknown as RequestInit & { headers: Record<string, string> };
    expect(init.headers["authorization"]).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
    expect(init.headers["content-length"]).toBe("0");
  });
  it("knows only the hash of the database's token", async () => {
    expect(PUSH_HOOK_SHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("device push", () => {
  it("asks iPhone users to add the CRM to the home screen first", () => {
    expect(needsInstall("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false)).toBe(true);
    expect(needsInstall("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", true)).toBe(false);
    expect(needsInstall("Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)", false)).toBe(false);
  });
  it("decodes the public key for the browser", () => {
    expect([...keyBytes("AQID")]).toEqual([1, 2, 3]);
  });
});
