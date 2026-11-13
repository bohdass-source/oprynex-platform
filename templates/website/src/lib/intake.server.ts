// Server only: hands a checked lead to the Oprynex CRM. The site holds just its intake token (Worker secret SITE_INTAKE_TOKEN);
// public.accept_site_lead turns it into the client's workspace. The publishable key below is public by design.
import type { LeadInput } from "@/lib/lead";

const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your-key";

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type IntakeOutcome = "saved" | "limited" | "failed" | "unconfigured";

export async function sendToCrm(lead: LeadInput, ip: string): Promise<IntakeOutcome> {
  const token = process.env["SITE_INTAKE_TOKEN"];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return "unconfigured";
  const { website: _honeypot, ...fields } = lead;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/accept_site_lead`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token, p_ip_hash: await sha256Hex(ip), p_lead: fields }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) { console.error("Lead intake failed", response.status); return "failed"; }
  const result = (await response.json()) as { ok?: boolean; limited?: boolean };
  return result.ok ? "saved" : result.limited ? "limited" : "failed";
}
