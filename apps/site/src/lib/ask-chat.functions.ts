import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { isLeadOriginAllowed } from "@/lib/lead-schema";
import { askChatInputSchema } from "@/lib/ask-chat-schema";

// Public AI chat endpoint. Message texts are never stored or logged.
export const askChatFunction = createServerFn({ method: "POST" })
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
    if (!origin || !isLeadOriginAllowed(origin, development)) return reply({ ok: false, reason: "error" }, 403);
    const parsed = askChatInputSchema.safeParse(data);
    if (!parsed.success) return reply({ ok: false, reason: "error" }, 400);
    try {
      if (!process.env["ANTHROPIC_API_KEY"]) return reply({ ok: false, reason: "disabled" });
      const ip = development ? getRequestIP() ?? "local-development" : request.headers.get("cf-connecting-ip");
      if (!ip || (!development && !z.union([z.ipv4(), z.ipv6()]).safeParse(ip).success)) return reply({ ok: false, reason: "error" }, 503);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: quota, error } = await supabaseAdmin.rpc("accept_chat_request", { p_ip_hash: ipHash });
      if (error) { console.error("Chat quota check failed", error.code); return reply({ ok: false, reason: "error" }, 500); }
      const q = z.object({ ok: z.boolean(), limited: z.boolean().optional(), capacity: z.boolean().optional() }).safeParse(quota);
      if (!q.success) return reply({ ok: false, reason: "error" }, 500);
      if (q.data.limited) return reply({ ok: false, reason: "limited" }, 429);
      if (q.data.capacity) return reply({ ok: false, reason: "capacity" });
      const { callChatModel } = await import("@/lib/ask-chat.server");
      return reply(await callChatModel(parsed.data.messages, parsed.data.language, parsed.data.reply));
    } catch { console.error("Chat request failed"); return reply({ ok: false, reason: "error" }, 500); }
  });
