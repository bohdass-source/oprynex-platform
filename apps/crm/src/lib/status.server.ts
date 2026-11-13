// Health of the parts that make Oprynex work, for the admin page: each check is one quick request from the CRM Worker.
// Only up or down and the response time leave this module; no data from the database or the engine.
import { BOT_ENGINE } from "@/lib/crm";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase";

export type CheckId = "site" | "database" | "engine" | "engineDb" | "push";
export type Check = { id: CheckId; ok: boolean; ms: number | null };

/** The demo dental bot is enabled in the Oprynex workspace; the engine serves its settings only when its database token works. */
const PROBE_BOT = "9c21916f-f027-494e-adae-e614c0874679";
const SITE = "https://site.oprynex.workers.dev";

async function timed(id: CheckId, request: () => Promise<Response>, ok: (r: Response) => boolean): Promise<Check> {
  const start = Date.now();
  try {
    const response = await request();
    return { id, ok: ok(response), ms: Date.now() - start };
  } catch {
    return { id, ok: false, ms: null };
  }
}

type Service = { fetch: (input: string, init?: RequestInit) => Promise<Response> };

/** `site` and `bot` are the Worker service bindings (Cloudflare refuses a Worker fetching another Worker on workers.dev); without them, as in tests, plain fetch is used. */
export async function runChecks(env: { VAPID_PRIVATE_JWK?: string | undefined; site?: Service | undefined; bot?: Service | undefined }, fetcher: typeof fetch = fetch): Promise<Check[]> {
  const signal = () => AbortSignal.timeout(8000);
  const site = (url: string, init: RequestInit) => (env.site ? env.site.fetch(url, init) : fetcher(url, init));
  const bot = (url: string, init: RequestInit) => (env.bot ? env.bot.fetch(url, init) : fetcher(url, init));
  return Promise.all([
    timed("site", () => site(SITE, { method: "HEAD", signal: signal() }), (r) => r.ok),
    timed("database", () => fetcher(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, signal: signal() }), (r) => r.ok),
    timed("engine", () => bot(`${BOT_ENGINE}/`, { signal: signal() }), (r) => r.ok),
    // 200 only when the engine's token is registered in the database; 403 means "not connected yet".
    timed("engineDb", () => bot(`${BOT_ENGINE}/v1/bots/${PROBE_BOT}`, { headers: { origin: BOT_ENGINE }, signal: signal() }), (r) => r.status === 200),
    Promise.resolve<Check>({ id: "push", ok: Boolean(env.VAPID_PRIVATE_JWK), ms: null }),
  ]);
}

/** The parts whose failure is worth waking an admin: the public site and the bot engine (forms and bots of clients). */
export async function outages(env: { site?: Service | undefined; bot?: Service | undefined }, fetcher: typeof fetch = fetch, retryAfterMs = 5000): Promise<CheckId[]> {
  const down = async () => (await runChecks({ ...env, VAPID_PRIVATE_JWK: "not checked here" }, fetcher)).filter((c) => (c.id === "site" || c.id === "engine") && !c.ok).map((c) => c.id);
  const first = await down();
  if (!first.length) return [];
  // A single slow answer is not an outage: only what fails twice, a few seconds apart, counts.
  await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
  const second = await down();
  return first.filter((id) => second.includes(id));
}

const remembered = new Map<string, { at: number; value: Promise<unknown> }>();

/** One answer per Worker instance for `ms`: these routes are public, so repeated calls must not multiply outgoing checks. */
export function remember<T>(key: string, ms: number, load: () => Promise<T>, now = Date.now()): Promise<T> {
  const entry = remembered.get(key);
  if (entry && now - entry.at < ms) return entry.value as Promise<T>;
  const value = load();
  remembered.set(key, { at: now, value });
  return value;
}

/** Worker service bindings when running on Cloudflare; empty in local development and tests. */
export async function workerBindings(): Promise<{ site?: Service; bot?: Service }> {
  try {
    const { env } = (await import(/* @vite-ignore */ "cloudflare:" + "workers")) as { env: { SITE?: Service; BOT?: Service } };
    return { ...(env.SITE ? { site: env.SITE } : {}), ...(env.BOT ? { bot: env.BOT } : {}) };
  } catch {
    return {};
  }
}
