import { useCallback, useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-key";
import { supabase } from "@/lib/supabase";

// Push notifications for this device: the browser subscribes with the CRM's public key, the endpoint is saved in
// public.push_subscriptions for the signed-in person, and the database wakes it on new requests and tickets.

export type PushState = "loading" | "unconfigured" | "unsupported" | "install" | "denied" | "off" | "on";
const FLAG = "oprynex-push-on"; // tells the open tab not to show its own alert as well

export function pushIsOn(): boolean {
  try { return localStorage.getItem(FLAG) === "1"; } catch { return false; }
}
function setFlag(on: boolean) {
  try { if (on) localStorage.setItem(FLAG, "1"); else localStorage.removeItem(FLAG); } catch { /* storage blocked */ }
}

/** iPhone and iPad allow web push only for the app added to the home screen. */
export function needsInstall(ua: string, standalone: boolean): boolean {
  return /iPhone|iPad|iPod/.test(ua) && !standalone;
}

export function keyBytes(base64url: string): Uint8Array {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js");
}

export function usePushDevice() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) { setState("unconfigured"); return; }
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (needsInstall(navigator.userAgent, standalone)) { setState("install"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") { setState("unsupported"); return; }
    if (Notification.permission === "denied") { setState("denied"); return; }
    void registration().then((reg) => reg.pushManager.getSubscription()).then((sub) => {
      setState(sub ? "on" : "off");
      setFlag(Boolean(sub));
      // Keeps the saved endpoint current (browsers renew it now and then); a duplicate is ignored by the unique index.
      if (sub) void supabase().from("push_subscriptions").insert({ endpoint: sub.endpoint });
    }).catch(() => setState("unsupported"));
  }, []);

  const enable = useCallback(async () => {
    setBusy(true); setFailed(false);
    try {
      if ((await Notification.requestPermission()) !== "granted") { setState("denied"); return; }
      const reg = await registration();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) as BufferSource }));
      const { error } = await supabase().from("push_subscriptions").insert({ endpoint: sub.endpoint });
      if (error && error.code !== "23505") throw error;
      setFlag(true); setState("on");
    } catch { setFailed(true); } finally { setBusy(false); }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true); setFailed(false);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setFlag(false); setState("off");
    } catch { setFailed(true); } finally { setBusy(false); }
  }, []);

  return { state, busy, failed, enable, disable };
}
