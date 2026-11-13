# CRM

Requests from the website, the chat and client websites in one place: dashboard, pipeline, requests with several products, customers, tasks, support tickets, client chatbots and forms, data protection tools. Per workspace, with row level security.

```bash
bun install
bun run dev:demo     # http://localhost:8090 — invented data, no database, no sign-in
bun run dev          # against your own Supabase project (see .env.example)
bun run test:node26
bun run cf:deploy    # Cloudflare Worker "app"
```

Data model and rules: [AGENTS.md](AGENTS.md) and [../../docs/database.md](../../docs/database.md).
