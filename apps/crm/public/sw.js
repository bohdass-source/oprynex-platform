// Oprynex CRM service worker: shows a notification when the CRM's server wakes this device about a new request or ticket,
// or, for Oprynex admins, about an outage. The push carries no content, so the worker asks /api/alert which public parts
// are down and picks the text; opening it brings the CRM to the front (or opens it).
const TEXT = {
  de: { title: "Oprynex CRM", body: "Neue Anfrage oder neues Ticket. Zum Öffnen tippen." },
  ru: { title: "Oprynex CRM", body: "Новая заявка или тикет. Нажмите, чтобы открыть." },
  en: { title: "Oprynex CRM", body: "New request or ticket. Tap to open." },
};
const OUTAGE = {
  de: { title: "Oprynex: Störung", site: "Die Website antwortet nicht.", engine: "Formulare und Bots auf Kunden-Websites antworten nicht." },
  ru: { title: "Oprynex: сбой", site: "Сайт не отвечает.", engine: "Формы и боты на сайтах клиентов не отвечают." },
  en: { title: "Oprynex: outage", site: "The website does not respond.", engine: "Forms and bots on client websites do not respond." },
};

/** Parts that are down right now; an empty list when the CRM cannot be asked (then it is an ordinary notification). */
async function down() {
  try {
    const response = await fetch("/api/alert", { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    return Array.isArray(data.down) ? data.down : [];
  } catch { return []; }
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const lang = (self.navigator.language || "de").slice(0, 2);
  event.waitUntil((async () => {
    const parts = await down();
    if (parts.length) {
      const o = OUTAGE[lang] || OUTAGE.de;
      // One tag for outages: a lasting problem replaces its notice instead of stacking new ones every 10 minutes.
      return self.registration.showNotification(o.title, { body: parts.map((p) => o[p]).filter(Boolean).join(" "), icon: "/icon-192.png", badge: "/icon-192.png", tag: "oprynex-outage", renotify: false });
    }
    const text = TEXT[lang] || TEXT.de;
    return self.registration.showNotification(text.title, { body: text.body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "oprynex-new", renotify: true });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
    if (open) { await open.focus(); open.navigate("/dashboard").catch(() => {}); return; }
    await self.clients.openWindow("/dashboard");
  })());
});
