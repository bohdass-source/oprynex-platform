# Website

Public website of Oprynex: landing page, offer pages, search guides, prices, FAQ, contact form, AI chat and legal pages, in German, Russian and English. TanStack Start on Cloudflare Workers, Supabase for requests and chat quotas, Claude API for the chat.

```sh
bun install
cp .env.example .env    # optional: contact form and AI chat need these values
bun run dev             # http://localhost:8080
bun run test:node26     # tests
bun run cf:deploy       # build and deploy the Worker "site"
```

How it works: [../../docs/architecture.md](../../docs/architecture.md), [../../docs/ai-chat.md](../../docs/ai-chat.md). The rules every change follows are in [AGENTS.md](AGENTS.md).
