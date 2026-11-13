import { createFileRoute } from "@tanstack/react-router";
import { PUSH_HOOK_SHA256, sendEmptyPushes, sha256Hex } from "@/lib/push.server";
import { outages, workerBindings } from "@/lib/status.server";

// Called every 10 minutes by the database (private.run_monitor, 0118_outage_alerts.sql) with the admins' devices.
// Wakes them only when the site or the bot engine is down; the service worker then shows the outage notice.
export const Route = createFileRoute("/api/monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-push-token") ?? "";
        if (!/^[a-f0-9]{64}$/.test(token) || (await sha256Hex(token)) !== PUSH_HOOK_SHA256) return new Response(null, { status: 403 });
        let body: unknown;
        try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
        const endpoints = (body as { endpoints?: unknown }).endpoints;
        if (!Array.isArray(endpoints) || endpoints.length > 50 || !endpoints.every((e) => typeof e === "string")) return new Response(null, { status: 400 });
        const down = await outages(await workerBindings());
        const secret = process.env["VAPID_PRIVATE_JWK"];
        if (!down.length || !secret) return Response.json({ ok: true, down, sent: 0 });
        console.error("Outage", down.join(","));
        const outcome = await sendEmptyPushes(endpoints as string[], JSON.parse(secret) as JsonWebKey);
        return Response.json({ ok: true, down, ...outcome });
      },
    },
  },
});
