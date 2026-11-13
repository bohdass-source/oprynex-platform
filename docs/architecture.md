# Architecture

Oprynex consists of four deployable applications that share one Postgres database.

| Part | Folder | Runs as | Who uses it |
|---|---|---|---|
| Website | `apps/site` | Cloudflare Worker `site`, server-side rendered | Visitors |
| CRM | `apps/crm` | Cloudflare Worker `app`, rendered in the browser after sign-in | The owner and team members |
| Chatbot engine | `apps/bot` | Cloudflare Worker `bot` | Visitors of client websites |
| Client websites | `templates/website` | One Cloudflare Worker per client | Visitors of client websites |
| Database | `database/migrations` | Supabase Postgres 17, Frankfurt | All of the above |

## Data flow

```mermaid
sequenceDiagram
  participant V as Visitor
  participant S as Website Worker
  participant DB as Postgres (Supabase)
  participant A as Claude API
  participant CRM as CRM (browser)
  V->>S: asks a free-text question in the chat
  S->>DB: accept_chat_request(ip_hash) — per minute, per day, global
  S->>A: question + prepared knowledge (system prompt)
  A-->>S: answer
  S-->>V: answer, or a prepared answer if anything failed
  V->>S: sends the contact form (with consent)
  S->>DB: accept_lead(lead, ip_hash) — validates, rate-limits, saves
  S-->>S: email notification to the owner (Cloudflare send_email)
  DB-->>CRM: the request appears; a push notice wakes the CRM tab
```

## Design decisions

**One database, many front doors.** The website, the client websites and the chatbot engine all write requests into the same `leads` table, each through its own `SECURITY DEFINER` function (`accept_lead`, `accept_site_lead`, `accept_bot_lead`, `accept_form_lead`). The functions check a token or the service role, validate every field and enforce rate limits inside one transaction, so a burst of submissions cannot save more than the limit and a failed insert does not consume quota.

**Workspaces from the first table.** Every CRM row carries a `workspace_id` and every policy checks membership, so the CRM could host several companies (it did: a client company per subscription) without rework.

**No secret key in the browser or in client websites.** The CRM uses the publishable key and relies on row level security. Client websites and the chatbot engine hold only a random token; the database stores its SHA-256 and checks it in the functions. A leaked token can at most add requests to one workspace.

**AI with a safety net.** The website chat answers from a registry of prepared scenarios first (keywords, buttons) and calls the Claude API only for free-text questions. Quotas live in the database; any error, refusal or exhausted quota falls back to the prepared answers. Message texts are never stored.

**Server-side rendering at the edge.** TanStack Start renders pages on Cloudflare Workers, so search engines and AI crawlers receive complete HTML in German with per-page metadata and structured data (Service, FAQPage, Article, BreadcrumbList).

**Single sources of truth.** Prices live in one object (`apps/site/src/lib/offers.ts`): the cards, the offer pages, the price list, the search guides, the prepared chat answers and the AI's knowledge are built from it. Offers, guides, translations and SEO metadata are registries too, and tests check that they stay consistent.

## Website (`apps/site`)

- Landing page with intro animation, endless carousels and a light and a dark theme; 4 offer pages; 14 search guides (9 industries, cost and data protection pages); prices, FAQ, contact, Impressum, Datenschutz, AGB, AVV.
- Three interface languages (German default, Russian, English) through a Russian-source dictionary; the chat speaks 20 languages and supports voice input with consent.
- Cookie choice stored only in the browser; optional statistics load only after explicit acceptance.
- Crawl files: `sitemap.xml`, `robots.txt` (search and AI crawlers allowed), `llms.txt`, IndexNow submission script.

## CRM (`apps/crm`)

- Dashboard with key figures, stages, products, languages and requests over time; pipeline board with drag and drop and a keyboard menu; requests list with filters and saved views; request page with several products per request, deal value, history (notes, calls, emails), tasks and reply templates.
- Customers grouped by email, tasks, support tickets with statuses, priorities and assignees.
- Integrations: client chatbots (knowledge, look, languages, allowed websites, usage), website forms, CSV import.
- Data protection tools: retention period, export, deletion of a request or a whole workspace.
- Live updates (polling plus Web Push without payload), outage alerts from a `pg_cron` monitor.
- **Demo mode**: `bun run dev:demo` swaps the database client for an in-memory one with invented data (`src/lib/demo-client.ts`).

## Chatbot engine (`apps/bot`)

See [chatbot-engine.md](chatbot-engine.md).

## Client websites (`templates/website`)

One configuration file (`src/site.config.ts`) describes a client: business data, services, languages (German, English, Polish, Russian, Ukrainian, Turkish), colours, chatbot. Pages, SEO metadata, structured data, Impressum and Datenschutz are generated from it. A preflight script refuses to deploy example data or an indexable site whose legal texts are not reviewed. The contact form posts to the shared database through `accept_site_lead`.
