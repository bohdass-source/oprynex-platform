import { acceptBotTicket, acceptFormLead, acceptFormTicket, acceptLead, acceptQuestion, loadBot, loadForm, type Env } from "./db";
import { askModel } from "./model";
import { botTicketInputSchema, chatInputSchema, formLeadInputSchema, formTicketInputSchema, leadInputSchema, type BotConfig, type FormConfig } from "./schema";
import { FORM_JS, WIDGET_JS } from "./widget.gen";

// Routes:
//   GET  /widget.js                 the script a client site embeds (data-bot="<bot id>")
//   GET  /demo/:id                  a bare page showing the bot, for previews and sales demos; works only for bots that
//                                   list this engine's own address among their websites
//   GET  /v1/bots/:id               public look and texts of the bot
//   POST /v1/bots/:id/chat          one AI answer
//   POST /v1/bots/:id/lead          a request the visitor sends on purpose → the client's CRM workspace
//   POST /v1/bots/:id/ticket        the same for a support assistant → a ticket in the client's CRM workspace
//   GET  /form.js                   the contact form script a client site embeds (<div data-oprynex-form="<form id>">)
//   GET  /form-demo/:id             a bare page showing the form, for previews; same origin rule as /demo
//   GET  /v1/forms/:id              public look and texts of the form
//   POST /v1/forms/:id/lead         a request sent through a request form → the client's CRM workspace
//   POST /v1/forms/:id/ticket       a question sent through a support form → a ticket in the client's CRM workspace
// Every /v1 call must come from one of the bot's or form's websites (Origin) and is answered with CORS for that site only.

const ROUTE = /^\/v1\/bots\/([0-9a-f-]{36})(\/chat|\/lead|\/ticket)?$/;
const FORM_ROUTE = /^\/v1\/forms\/([0-9a-f-]{36})(\/lead|\/ticket)?$/;
const DEMO = /^\/demo\/([0-9a-f-]{36})$/;
const FORM_DEMO = /^\/form-demo\/([0-9a-f-]{36})$/;
const PAGE_HEADERS = { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "x-frame-options": "DENY", "x-content-type-options": "nosniff", "cache-control": "public, max-age=300" };
const SCRIPT_HEADERS = { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff", "access-control-allow-origin": "*" };

/** Static page with nothing but a title and the form; the form shows nothing unless it lists this engine's address. */
function formDemoPage(formId: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Oprynex Form Demo</title>
<style>body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f4f4f4;color:#111;padding:48px 16px}main{max-width:560px;margin:0 auto}h1{font-size:24px;line-height:32px;margin:0 0 24px}</style></head>
<body><main><h1>Oprynex Form Demo</h1><div data-oprynex-form="${formId}"></div></main><script src="/form.js" async></script></body></html>`;
  return new Response(html, { headers: PAGE_HEADERS });
}

function publicForm(form: FormConfig) {
  const { owner, language, color, privacyUrl, askCompany, purpose } = form;
  return { owner, language, color, privacyUrl, askCompany, purpose };
}

/** Static page with nothing but a title and the widget; the widget loads the bot itself and shows nothing for a bot without this origin. */
function demoPage(botId: string, lang: string): Response {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Oprynex Bot Demo</title>
<style>body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f4f4f4;color:#111;display:grid;min-height:100vh;place-items:center;padding:16px}main{max-width:560px;text-align:center}h1{font-size:24px;line-height:32px;margin:0 0 8px}p{font-size:16px;line-height:24px;color:#404040;margin:0}</style></head>
<body><main><h1>Oprynex Bot Demo</h1><p>${lang === "ru" ? "Нажмите на кнопку чата справа внизу." : lang === "en" ? "Open the chat with the button at the bottom right." : "Öffnen Sie den Chat mit dem Knopf unten rechts."}</p></main>
<script src="/widget.js" data-bot="${botId}" data-lang="${lang}" async></script></body></html>`;
  return new Response(html, { headers: PAGE_HEADERS });
}
const MAX_BODY = 20_000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", "cache-control": "no-store", ...headers } });

function cors(origin: string): Record<string, string> {
  return { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600", vary: "Origin" };
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Trusts only Cloudflare's own header; without it the request is refused, except in local development. */
async function visitorHash(request: Request, env: Env): Promise<string | null> {
  const ip = request.headers.get("cf-connecting-ip") ?? (env.LOCAL_DEV === "1" ? "local" : null);
  return ip ? sha256(`oprynex-bot:${ip}`) : null;
}

async function readJson(request: Request): Promise<unknown> {
  // A declared size over the limit is refused before the body is read at all.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return undefined;
  const text = await request.text();
  if (text.length > MAX_BODY) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

/** GET the form's look, or POST a request through it. Same origin, visitor and honeypot rules as the chatbot. */
async function handleForm(request: Request, env: Env, origin: string, formId: string, action: string): Promise<Response> {
  let form: FormConfig | null;
  try { form = await loadForm(env, formId); } catch { console.error("Form config unavailable"); return json({ ok: false, reason: "unavailable" }, 503); }
  if (!form || !form.origins.includes(origin)) return json({ ok: false }, 403);
  const headers = cors(origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (!action && request.method === "GET") return json({ ok: true, form: publicForm(form) }, 200, headers);
  if (!action || request.method !== "POST") return json({ ok: false }, 405, headers);

  // A request form takes requests, a support form takes tickets; anything else is a mistake in the page.
  if (action !== (form.purpose === "support" ? "/ticket" : "/lead")) return json({ ok: false, reason: "invalid" }, 400, headers);
  const visitor = await visitorHash(request, env);
  if (!visitor) return json({ ok: false }, 403, headers);
  const body = await readJson(request);
  try {
    if (form.purpose === "support") {
      const ticket = formTicketInputSchema.safeParse(body);
      if (!ticket.success) return json({ ok: false, reason: "invalid" }, 400, headers);
      if (ticket.data.website) return json({ ok: true }, 200, headers); // honeypot filled: pretend success, save nothing
      const opened = await acceptFormTicket(env, form.id, visitor, ticket.data);
      if (!opened.ok) return json({ ok: false, reason: opened.limited ? "limited" : "invalid" }, 200, headers);
      // The ticket number the CRM shows, so the customer can refer to it.
      return json({ ok: true, number: opened.number ? `#${opened.number}` : undefined }, 200, headers);
    }
    const lead = formLeadInputSchema.safeParse(body);
    if (!lead.success) return json({ ok: false, reason: "invalid" }, 400, headers);
    if (lead.data.website) return json({ ok: true }, 200, headers); // honeypot filled: pretend success, save nothing
    const saved = await acceptFormLead(env, form.id, visitor, lead.data);
    if (!saved.ok) return json({ ok: false, reason: saved.limited ? "limited" : "invalid" }, 200, headers);
    // The same short request number the CRM shows, so the visitor can refer to it.
    return json({ ok: true, number: saved.id ? saved.id.slice(0, 8).toUpperCase() : undefined }, 200, headers);
  } catch {
    console.error("Form request failed");
    return json({ ok: false, reason: "unavailable" }, 503, headers);
  }
}

function publicConfig(bot: BotConfig) {
  const { name, business, greeting, quickReplies, color, privacyUrl, languages, kind } = bot;
  return { name, business, greeting, quickReplies, color, privacyUrl, languages, kind };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/widget.js" && request.method === "GET") return new Response(WIDGET_JS, { headers: SCRIPT_HEADERS });
    if (url.pathname === "/form.js" && request.method === "GET") return new Response(FORM_JS, { headers: SCRIPT_HEADERS });
    const demo = DEMO.exec(url.pathname);
    if (demo && request.method === "GET") {
      const lang = ["de", "en", "ru"].includes(url.searchParams.get("lang") ?? "") ? url.searchParams.get("lang")! : "de";
      return demoPage(demo[1] ?? "", lang);
    }
    const formDemo = FORM_DEMO.exec(url.pathname);
    if (formDemo && request.method === "GET") return formDemoPage(formDemo[1] ?? "");
    if (url.pathname === "/") return new Response("Oprynex bot engine", { headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" } });

    const origin = request.headers.get("origin") ?? "";
    const formMatch = FORM_ROUTE.exec(url.pathname);
    if (formMatch) return handleForm(request, env, origin, formMatch[1] ?? "", formMatch[2] ?? "");

    const match = ROUTE.exec(url.pathname);
    if (!match) return json({ ok: false }, 404);
    const [, botId = "", action = ""] = match;

    let bot: BotConfig | null;
    try { bot = await loadBot(env, botId); } catch { console.error("Bot config unavailable"); return json({ ok: false, reason: "unavailable" }, 503); }
    if (!bot || !bot.origins.includes(origin)) return json({ ok: false }, 403);
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!action && request.method === "GET") return json({ ok: true, bot: publicConfig(bot) }, 200, headers);
    if (!action || request.method !== "POST") return json({ ok: false }, 405, headers);

    const visitor = await visitorHash(request, env);
    if (!visitor) return json({ ok: false }, 403, headers);
    const body = await readJson(request);

    try {
      if (action === "/chat") {
        const input = chatInputSchema.safeParse(body);
        if (!input.success) return json({ ok: false, reason: "invalid" }, 400, headers);
        const gate = await acceptQuestion(env, bot.id, visitor);
        if (!gate.ok) return json({ ok: false, reason: gate.limited ? "limited" : gate.capacity ? "capacity" : "unavailable" }, 200, headers);
        const result = await askModel(env.ANTHROPIC_API_KEY, bot, input.data);
        if (!result.ok) return json({ ok: false, reason: "unavailable" }, 200, headers);
        return json({ ok: true, answer: result.answer, handoff: result.handoff, language: result.language }, 200, headers);
      }
      // A support assistant hands over tickets, every other kind requests.
      if (action !== (bot.kind === "support" ? "/ticket" : "/lead")) return json({ ok: false, reason: "invalid" }, 400, headers);
      if (action === "/ticket") {
        const ticket = botTicketInputSchema.safeParse(body);
        if (!ticket.success) return json({ ok: false, reason: "invalid" }, 400, headers);
        if (ticket.data.website) return json({ ok: true }, 200, headers); // honeypot filled: pretend success, save nothing
        const opened = await acceptBotTicket(env, bot.id, visitor, ticket.data);
        return json(opened.ok ? { ok: true, number: opened.number ? `#${opened.number}` : undefined } : { ok: false, reason: opened.limited ? "limited" : "invalid" }, 200, headers);
      }
      const lead = leadInputSchema.safeParse(body);
      if (!lead.success) return json({ ok: false, reason: "invalid" }, 400, headers);
      if (lead.data.website) return json({ ok: true }, 200, headers); // honeypot filled: pretend success, save nothing
      const saved = await acceptLead(env, bot.id, visitor, lead.data);
      return json(saved.ok ? { ok: true } : { ok: false, reason: saved.limited ? "limited" : "invalid" }, 200, headers);
    } catch {
      console.error("Bot request failed");
      return json({ ok: false, reason: "unavailable" }, 503, headers);
    }
  },
} satisfies ExportedHandler<Env>;
