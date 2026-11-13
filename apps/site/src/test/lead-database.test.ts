// Optional live integration tests; uses private runtime credentials, never browser credentials.
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
describe.skipIf(!url || !key)("private lead database", () => {
  it("atomically accepts only five submissions per IP in a rolling hour", async () => {
    if (!url || !key) throw new Error("Cloud integration credentials missing");
    const db = createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey",key);
      return fetch(input,{ ...init,headers });
    } } });
    const hash = createHash("sha256").update(randomUUID()).digest("hex");
    const email = `integration-${randomUUID()}@example.com`;
    const lead = { name: "Automated integration test", email, message: "Verification only, do not process.", source: "contact_form", language: "de", consent: true };
    try {
      // Invalid insert rolls back quota and does not count as an accepted submission.
      const failed = await db.rpc("accept_lead", { p_ip_hash: hash, p_lead: { ...lead, consent: false } });
      expect(failed.error).not.toBeNull();
      const results = await Promise.all(Array.from({ length: 6 }, () => db.rpc("accept_lead", { p_ip_hash: hash, p_lead: lead })));
      const bodies = results.map((result) => { expect(result.error).toBeNull(); return result.data as { ok: boolean; limited?: boolean }; });
      expect(bodies.filter((body) => body.ok)).toHaveLength(5);
      expect(bodies.filter((body) => body.limited)).toHaveLength(1);
      const saved = await db.from("leads").select("consent,consent_at,status").eq("email",email);
      expect(saved.data).toHaveLength(5);
      for (const row of saved.data ?? []) { expect(row.consent).toBe(true); expect(row.status).toBe("new"); expect(Date.parse(row.consent_at)).toBeGreaterThan(Date.now()-60_000); }
      const expired = new Date(Date.now()-3_601_000).toISOString();
      await db.from("lead_rate_limits").update({ accepted_at: Array(5).fill(expired) }).eq("ip_hash",hash);
      const afterHour = await db.rpc("accept_lead", { p_ip_hash: hash, p_lead: lead });
      expect(afterHour.error).toBeNull();
      expect((afterHour.data as { ok: boolean }).ok).toBe(true);
    } finally {
      await db.from("leads").delete().eq("email",email);
      await db.from("lead_rate_limits").delete().eq("ip_hash",hash);
    }
  });
});