// Connects the deployed site to the client's CRM workspace. Creates a random intake token, stores it as the Worker secret
// SITE_INTAKE_TOKEN without ever printing it, and prints only its SHA-256 and the SQL that registers the site.
// Run after the first deploy: bun scripts/connect-crm.ts <workspace-uuid>
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { site } from "../src/site.config";

const workspace = process.argv[2] ?? "";
if (!/^[0-9a-f-]{36}$/.test(workspace)) {
  console.error("Usage: bun scripts/connect-crm.ts <workspace-uuid>");
  process.exit(1);
}
const token = randomBytes(32).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");
const put = spawnSync("bunx", ["wrangler", "secret", "put", "SITE_INTAKE_TOKEN", "--name", site.worker], { input: token, stdio: ["pipe", "inherit", "inherit"] });
if (put.status !== 0) process.exit(put.status ?? 1);
const url = site.domain ?? `https://${site.worker}.oprynex.workers.dev`;
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
console.log("\nRegister the site (Supabase SQL, as service role):\n");
console.log(`INSERT INTO public.sites (workspace_id, name, url, token_hash) VALUES (${quote(workspace)}, ${quote(site.business.name)}, ${quote(url)}, ${quote(hash)});`);
