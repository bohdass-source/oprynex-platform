# Hosting and deployment

## Where everything ran

| Service | Provider | Plan | Purpose |
|---|---|---|---|
| Website, CRM, chatbot engine, client sites | Cloudflare Workers | Free | Server-side rendering and APIs at the edge |
| Domain, DNS, `www` redirect | Cloudflare | Domain fee only | `oprynex.de`, `app.oprynex.de` |
| Mail | Cloudflare Email Routing + `send_email` binding | Free | Receiving `kontakt@…`, one notification email per request |
| Database and sign-in | Supabase, region Frankfurt (eu-central-1) | Free | Postgres 17, Auth with email code / magic link |
| AI | Anthropic Claude API | Pay per use | Website chat, client chatbots |
| Search | Google Search Console, Bing Webmaster Tools, IndexNow | Free | Indexing |

Running costs were the domain and the AI usage; everything else stayed within free plans.

## Deploying

Every app deploys the same way with [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
bun install
bun run test:node26      # unit and component tests
bunx tsc --noEmit        # type check
bun run cf:deploy        # vite build, then wrangler deploy
```

The build (TanStack Start with the Nitro `cloudflare-module` preset) writes `.output/server/wrangler.json`; `cf:deploy` deploys it under the Worker name in `package.json`. Each deployment is a Cloudflare version that can be rolled back with `wrangler rollback <version-id> --name <worker>`.

## Secrets

Secrets are set per Worker with `wrangler secret put NAME --name <worker>` and are never committed. `.env.example` files list the names.

| Worker | Secret | What it is |
|---|---|---|
| `site` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database access for `accept_lead` and the chat quota |
| `site` | `ANTHROPIC_API_KEY` | Website chat |
| `site` | `ALLOWED_ORIGINS` | Extra origins allowed to post the form |
| `site` | `NOTIFY_EMAIL` | Verified mailbox for request notifications |
| `app` | VAPID private key, push hook token | Web Push to the CRM |
| `bot` | `ANTHROPIC_API_KEY`, `BOT_ENGINE_TOKEN` | Client chatbots; the token's hash is stored in `private.bot_engine_tokens` |
| client site | `SITE_INTAKE_TOKEN` | Its contact form; the hash is stored in `public.sites` |

Public values (Supabase URL, publishable key) live in `vars` of `wrangler.jsonc` or in `VITE_` variables, because row level security protects the data, not the key.

## Domain and addresses

The public address lives in one file (`apps/site/src/lib/site-url.ts`). `bun scripts/move-domain.ts https://<domain>` rewrites it and the crawl files and keeps the previous host as a permanent 308 redirect. Removed pages redirect permanently to their closest replacement (`MOVED_PAGES` in `src/lib/http-policy.ts`).

## Security headers

Every response carries HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, a `frame-ancestors 'none'` policy, a strict referrer policy and a permissions policy; plain http and trailing slashes redirect permanently; request bodies over 64 kB are refused before they reach the app.
