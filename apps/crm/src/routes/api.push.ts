import { createFileRoute } from "@tanstack/react-router";
import { PUSH_HOOK_SHA256, sendEmptyPushes, sha256Hex } from "@/lib/push.server";

// Called only by the database (private.notify_push via pg_net) when a request or ticket arrives.
export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-push-token") ?? "";
        if (!/^[a-f0-9]{64}$/.test(token) || (await sha256Hex(token)) !== PUSH_HOOK_SHA256) return new Response(null, { status: 403 });
        const secret = process.env["VAPID_PRIVATE_JWK"];
        if (!secret) return Response.json({ ok: false, reason: "not configured" }, { status: 503 });
        let body: unknown;
        try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
        const endpoints = (body as { endpoints?: unknown }).endpoints;
        if (!Array.isArray(endpoints) || endpoints.length > 200 || !endpoints.every((e) => typeof e === "string")) return new Response(null, { status: 400 });
        const outcome = await sendEmptyPushes(endpoints as string[], JSON.parse(secret) as JsonWebKey);
        if (outcome.failed) console.error("Push delivery failed", outcome.failed);
        return Response.json({ ok: true, ...outcome });
      },
    },
  },
});
