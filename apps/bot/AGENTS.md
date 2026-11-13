Oprynex Bot: the chatbot engine for client websites. One Cloudflare Worker serves every client bot.

- Hosting: Worker "bot" → https://bot.oprynex.workers.dev, deployed with `bun run cf:deploy` (builds the widget, type checks, tests, deploys).
- Secrets (the owner sets them; never commit or print them): ANTHROPIC_API_KEY (`bunx wrangler secret put ANTHROPIC_API_KEY --name bot`) and BOT_ENGINE_TOKEN (`bun run connect` creates it, stores it without printing and prints the SQL that registers its SHA-256).
- Database: the shared Supabase project; tables and functions come from oprynex-app/database/migrations/0105_client_bots.sql. The engine uses only the publishable key plus its token and calls three functions: bot_engine_config, accept_bot_question, accept_bot_lead. Bots are created and edited in the CRM (workspace owners and admins).
- Demo and preview: GET /demo/<bot-id>?lang=de|en|ru is a bare noindex page with the widget; it works only for bots whose origins include https://bot.oprynex.workers.dev. demo/ holds the made-up dental demo bot (README has its id). `bun scripts/probe.ts <bot-id> [questions.txt]` asks test questions through the live engine (counts against limits). The owner-facing workflow is the user-level skill ~/.claude/skills/client-chatbot.
- Embedding on a client site: `<script src="https://bot.oprynex.workers.dev/widget.js" data-bot="BOT-ID" async></script>`; the site's origin must be in the bot's origins. Optional data-lang="de|en|ru".
- Privacy: chat texts are never stored or logged, only counters per visitor hash (SHA-256 of the IP, never the IP) and the request a visitor sends with consent. The widget keeps the conversation in page memory only.
- The rules every bot follows live in src/prompt.ts; the client's knowledge comes after them, marked as data. The model settings in src/model.ts match the Oprynex site chat.
- The widget (src/widget/widget.js) is plain JavaScript in a closed Shadow DOM; all visitor and AI text is set with textContent. scripts/build-widget.ts turns it into src/widget.gen.ts (generated, not committed).
- The Oprynex site and its own chat are separate and stay untouched by this repo.
