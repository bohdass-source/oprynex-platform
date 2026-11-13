import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { isLeadOriginAllowed, leadSchema } from "@/lib/lead-schema";

// Public, purpose-limited write endpoint. No direct browser access to either table.
export const submitLeadFunction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const development = import.meta.env.DEV;
    const origin = request.headers.get("origin");
    const reply = (body: object, status = 200) => Response.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(origin && isLeadOriginAllowed(origin, development) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
      },
    });
    if (!origin || !isLeadOriginAllowed(origin, development)) return reply({ ok: false }, 403);
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) return reply({ ok: false }, 400);
    const lead = parsed.data;
    if (lead.website?.trim()) return reply({ ok: true });
    try {
      // Never accept X-Forwarded-For: only the Cloudflare ingress header in production.
      const ip = development ? getRequestIP() ?? "local-development" : request.headers.get("cf-connecting-ip");
      if (!ip || (!development && !z.union([z.ipv4(), z.ipv6()]).safeParse(ip).success)) return reply({ ok: false }, 503);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      // Origin, body and honeypot verified before entering the privileged write boundary.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: saved, error } = await supabaseAdmin.rpc("accept_lead", { p_ip_hash: ipHash, p_lead: lead });
      if (error) { console.error("Lead save failed", error.code); return reply({ ok: false }, 500); }
      const result = z.object({ ok: z.boolean(), id: z.string().uuid().optional(), limited: z.boolean().optional() }).safeParse(saved);
      if (result.success && result.data.limited) return reply({ ok: false }, 429);
      if (!result.success || !result.data.ok || !result.data.id) return reply({ ok: false }, 500);
      // The request is saved. The owner also gets one internal email (never shown to the visitor, never blocking).
      const { notifyOwner } = await import("@/lib/lead-notify.server");
      await notifyOwner(lead, result.data.id);
      return reply({ ok: true, id: result.data.id });
    } catch { console.error("Lead submission failed"); return reply({ ok: false }, 500); }
  });