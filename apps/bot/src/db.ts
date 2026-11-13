import { botConfigSchema, formConfigSchema, type BotConfig, type FormConfig, type FormLeadInput, type BotTicketInput, type FormTicketInput, type LeadInput } from "./schema";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  BOT_ENGINE_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  /** "1" only in `wrangler dev`: visitors without CF-Connecting-IP share one local bucket. */
  LOCAL_DEV?: string;
}

export type Gate = { ok: true } | { ok: false; limited?: boolean; capacity?: boolean };

// The engine reaches the database only through token-checked functions (bots and website forms), called with the publishable key.
async function rpc(env: Env, fn: string, args: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_token: env.BOT_ENGINE_TOKEN ?? "", ...args }),
  });
  if (!response.ok) throw new Error(`rpc ${fn} ${response.status}`);
  return response.json();
}

// Settings change rarely; each Worker instance keeps them for a minute so a chat costs one database call, not two.
const CONFIG_TTL_MS = 60_000;
const cache = new Map<string, { at: number; config: BotConfig | null }>();
const formCache = new Map<string, { at: number; config: FormConfig | null }>();

export async function loadBot(env: Env, botId: string, now = Date.now()): Promise<BotConfig | null> {
  const hit = cache.get(botId);
  if (hit && now - hit.at < CONFIG_TTL_MS) return hit.config;
  const raw = await rpc(env, "bot_engine_config", { p_bot: botId });
  const parsed = raw === null ? null : botConfigSchema.safeParse(raw);
  const config = parsed?.success ? parsed.data : null;
  cache.set(botId, { at: now, config });
  return config;
}

export async function loadForm(env: Env, formId: string, now = Date.now()): Promise<FormConfig | null> {
  const hit = formCache.get(formId);
  if (hit && now - hit.at < CONFIG_TTL_MS) return hit.config;
  const raw = await rpc(env, "web_form_config", { p_form: formId });
  const parsed = raw === null ? null : formConfigSchema.safeParse(raw);
  const config = parsed?.success ? parsed.data : null;
  formCache.set(formId, { at: now, config });
  return config;
}

export async function acceptFormLead(env: Env, formId: string, ipHash: string, lead: FormLeadInput): Promise<Gate & { id?: string }> {
  const { website: _honeypot, ...fields } = lead;
  return (await rpc(env, "accept_form_lead", { p_form: formId, p_ip_hash: ipHash, p_lead: fields })) as Gate & { id?: string };
}

export async function acceptBotTicket(env: Env, botId: string, ipHash: string, ticket: BotTicketInput): Promise<Gate & { number?: number }> {
  const { website: _honeypot, pagePath: _page, ...fields } = ticket;
  return (await rpc(env, "accept_bot_ticket", { p_bot: botId, p_ip_hash: ipHash, p_ticket: fields })) as Gate & { number?: number };
}

export async function acceptFormTicket(env: Env, formId: string, ipHash: string, ticket: FormTicketInput): Promise<Gate & { number?: number }> {
  const { website: _honeypot, pagePath: _page, ...fields } = ticket;
  return (await rpc(env, "accept_form_ticket", { p_form: formId, p_ip_hash: ipHash, p_ticket: fields })) as Gate & { number?: number };
}

export function clearBotCache() {
  cache.clear();
  formCache.clear();
}

export async function acceptQuestion(env: Env, botId: string, ipHash: string): Promise<Gate> {
  return (await rpc(env, "accept_bot_question", { p_bot: botId, p_ip_hash: ipHash })) as Gate;
}

export async function acceptLead(env: Env, botId: string, ipHash: string, lead: LeadInput): Promise<Gate> {
  const { website: _honeypot, ...fields } = lead;
  return (await rpc(env, "accept_bot_lead", { p_bot: botId, p_ip_hash: ipHash, p_lead: fields })) as Gate;
}
