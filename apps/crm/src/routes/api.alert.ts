import { createFileRoute } from "@tanstack/react-router";
import { outages, remember, workerBindings } from "@/lib/status.server";

// Asked by the service worker when a push arrives: which public parts are down right now, so it can show an outage
// notice instead of "new request". Only part names leave this route.
export const Route = createFileRoute("/api/alert")({
  server: {
    handlers: {
      GET: async () => Response.json({ down: await remember("alert", 30_000, async () => outages(await workerBindings())) }, { headers: { "cache-control": "no-store" } }),
    },
  },
});
