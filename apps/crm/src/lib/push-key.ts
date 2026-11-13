// Public VAPID key of the CRM's push notifications (not a secret; browsers need it to subscribe).
// Written by scripts/setup-push.ts, which also stores the private key as the Worker secret VAPID_PRIVATE_JWK.
// Empty until that script has run: the app then hides the push option.
export const VAPID_PUBLIC_KEY = "BKcHjzdTCiTBOVPH95ugaQGe0CEicjQ8vSbrNzsf8oXlP5HW86XOC5Wv9VBiPPiVNyyaAtXo47F6iAdfwh-LUbA";
