import { createFileRoute } from "@tanstack/react-router";
import { remember, runChecks, workerBindings } from "@/lib/status.server";

// Up or down of the site, database, bot engine and push key, for the admin page. Holds no data, so it needs no sign-in.
export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => {
        const checks = await remember("status", 30_000, async () => runChecks({ VAPID_PRIVATE_JWK: process.env["VAPID_PRIVATE_JWK"], ...(await workerBindings()) }));
        return Response.json({ checks, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
