// One-time setup of push notifications. Creates the VAPID key pair, stores the private key as the Worker secret
// VAPID_PRIVATE_JWK of "app" without printing it, and writes the public key into src/lib/push-key.ts.
// Run: bun scripts/setup-push.ts   then commit src/lib/push-key.ts and deploy (bun run cf:deploy).
// Running it again replaces the keys; every device then has to turn notifications on again.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
const publicKey = Buffer.from(raw).toString("base64url");

const put = spawnSync("bunx", ["wrangler", "secret", "put", "VAPID_PRIVATE_JWK", "--name", "app"], {
  input: JSON.stringify({ kty: privateJwk.kty, crv: privateJwk.crv, x: privateJwk.x, y: privateJwk.y, d: privateJwk.d }),
  stdio: ["pipe", "inherit", "inherit"],
});
if (put.status !== 0) process.exit(put.status ?? 1);

writeFileSync(new URL("../src/lib/push-key.ts", import.meta.url), `// Public VAPID key of the CRM's push notifications (not a secret; browsers need it to subscribe).
// Written by scripts/setup-push.ts, which also stores the private key as the Worker secret VAPID_PRIVATE_JWK.
// Empty until that script has run: the app then hides the push option.
export const VAPID_PUBLIC_KEY = "${publicKey}";
`);
console.log("\nDone. The private key is stored in the Worker; the public key is in src/lib/push-key.ts. Now commit and deploy.");
