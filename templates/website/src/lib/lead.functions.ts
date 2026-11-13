import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { leadSchema, type LeadInput, type LeadResult } from "@/lib/lead";
import { BASE_URL, site } from "@/lib/site";

/** Exact origins allowed to post the form: the trial address, the client's domain and local development. */
export function isOriginAllowed(origin: string, development: boolean): boolean {
  if (development && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return [BASE_URL, `https://${site.worker}.oprynex.workers.dev`, site.domain].includes(origin);
}

export const submitLeadFunction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const development = import.meta.env.DEV;
    const origin = request.headers.get("origin");
    const reply = (status: number) => Response.json({ ok: status === 200 }, { status, headers: { "Cache-Control": "no-store" } });
    if (!origin || !isOriginAllowed(origin, development)) return reply(403);
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) return reply(400);
    if (parsed.data.website?.trim()) return reply(200);
    // Only Cloudflare's own header in production; forwarded headers can be forged.
    const ip = development ? getRequestIP() ?? "local-development" : request.headers.get("cf-connecting-ip");
    if (!ip || (!development && !z.union([z.ipv4(), z.ipv6()]).safeParse(ip).success)) return reply(503);
    try {
      const { sendToCrm } = await import("@/lib/intake.server");
      const outcome = await sendToCrm(parsed.data, ip);
      return reply(outcome === "saved" ? 200 : outcome === "limited" ? 429 : 503);
    } catch { console.error("Lead submission failed"); return reply(503); }
  });

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  try {
    const response = await submitLeadFunction({ data: input });
    return response.ok ? { ok: true } : { ok: false, status: response.status };
  } catch { return { ok: false, status: 503 }; }
}
