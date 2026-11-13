# How it was built

Three weeks from the first prototype to a running platform with its own domain, a CRM and a chatbot engine for clients. Development was done by one person with Claude Code as an AI pair programmer: the owner decided what to build and approved every price, text and deployment; the AI wrote and tested most of the code under the rules kept in each project's `AGENTS.md`.

| Project | Commits | Period |
|---|---|---|
| Website | 194 | 16 Oct – 7 Nov 2026 |
| CRM | 36 | 31 Oct – 7 Nov 2026 |
| Chatbot engine | 10 | 2 – 4 Nov 2026 |
| Website template | 4 | 1 – 4 Nov 2026 |

## 1. Prototype in a website builder (16–28 October)

The site started as a TanStack Start template in an AI website builder (Lovable): landing page, offer cards, FAQ, a first chat with prepared answers, German and English, a logo and an emblem. Many small iterations on layout and copy.

## 2. Own hosting and a real backend (29 October)

The project moved out of the builder to Cloudflare Workers with its own Supabase project in Frankfurt. The first migration created the private `leads` table and an atomic rate-limited `accept_lead` function. The chat got free-text answers through the Claude API with quotas in the database, 20 visitor languages and voice input.

## 3. Redesign and content (30–31 October)

One shared shell for every page, a landing page built to a strict design system (spacing scale, type scale, flat colours, one accent), an intro animation, endless carousels, a light and a dark theme. Approved prices filled into a single price registry. SEO and GEO: per-page metadata, structured data, `llms.txt`, a crawler-friendly `robots.txt`.

## 4. The CRM (31 October – 3 November)

A separate app on the same database: workspaces and roles, pipeline board, request history, tasks, import and merge, then support tickets, assignment, customer cards, plans for a subscription product, integrations, push notifications, website forms, data protection tools and outage alerts. Twenty-one migrations; the larger ones were tried in a dry run first (applied inside a transaction with checks, then rolled back) before the real run.

## 5. Chatbot engine and client websites (1–4 November)

A website template where one config file describes a client, with legal texts generated from it, and a chatbot engine that serves every client bot from one Worker. Two demo client sites showed both together during development. Bots and forms are managed in the CRM.

## 6. Going live (4–5 November)

Own domain, `www` redirect, email routing, notification emails, security headers, legal texts for business customers, Google and Bing verification, IndexNow.

## 7. Focus and search content (6–7 November)

Fourteen search guides (nine industries, costs, data protection), the offer narrowed to four products (website, chatbot, website with chatbot, custom CRM, plus consulting by email), several products per request in the CRM and a consulting package with credit towards a project.

## 8. Archive (13 November)

The project is no longer developed. The work was collected here: one repository, a clean history without personal data, a demo mode for the CRM, screenshots of every screen and this documentation.

## Practices that carried the project

- **Tests before every deployment**: unit, component and accessibility tests, type check and build in one command chain.
- **Registries instead of copies**: prices, offers, guides, translations and SEO data each live in one place, and tests check that pages, chat and crawl files agree.
- **Dry runs for database changes**: larger migrations were applied inside a transaction with checks and rolled back before they were applied for real.
- **Rules written down**: each project has an `AGENTS.md` with the decisions that must survive later changes (privacy rules, copy rules, speed rules), so neither a person nor an AI agent breaks them unknowingly.
