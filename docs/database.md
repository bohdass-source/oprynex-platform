# Database

Postgres 17 on Supabase (Frankfurt). The schema is created by the 26 migrations in `database/migrations`, applied in file-name order: `0000–0004` belong to the website (lead intake, chat quota), `0100–0120` to the CRM.

## Tables

| Schema | Table | Holds |
|---|---|---|
| public | `workspaces`, `workspace_members`, `workspace_invites` | Companies, members with roles (owner, admin, member), invitations |
| public | `leads`, `lead_events` | Requests with status, products, value, source; their history |
| public | `tasks` | To-dos, optionally linked to a request |
| public | `tickets`, `ticket_messages` | Support tickets and their conversation |
| public | `bots`, `bot_usage` | Client chatbots and their daily question counts |
| public | `web_forms`, `sites` | Website forms and client websites, each with a token hash |
| public | `push_subscriptions` | Browsers that receive CRM notifications |
| public | `lead_rate_limits`, `chat_rate_limits`, `chat_daily_usage` | Per-visitor (IP hash) and global quotas |
| private | `bot_engine_tokens`, `bot_engine_usage`, `bot_visitor_limits` | Chatbot engine access and limits |
| private | `platform_admins`, `cloud_settings`, `push_hook` | Platform settings, not reachable through the API |

22 tables, 38 row level security policies, 45 functions.

## Access model

- **Row level security on every table.** Members see only rows of their workspaces (`private.is_workspace_member`); admins and owners may do more (`private.is_workspace_admin`). Column grants limit what a member may update on a request (status, assignee, products, value).
- **Helpers in a private schema.** `SECURITY DEFINER` helpers live in `private`, which the API does not expose, so they cannot be called over `/rest/v1/rpc`.
- **Public entry points check a token.** `accept_site_lead`, `accept_bot_lead`, `accept_form_lead`, `bot_engine_config` and similar functions run as definer but first compare the caller's token with a stored SHA-256.
- **Service-role-only tables.** Rate limit tables have row level security without policies and grants only for the service role.

## Things worth a look

- `0000_private_leads_and_atomic_hourly_limit.sql` — one function locks per IP hash and saves a lead plus the rolling-hour quota atomically (5 requests per hour).
- `0001_chat_rate_limits.sql` — chat quota: 10 per minute and 60 per day per visitor, 1 500 per day in total.
- `0115_data_protection.sql` — retention period per workspace and a daily `pg_cron` clean-up of old requests and IP hashes (7 days).
- `0118_outage_alerts.sql` — a `pg_cron` job every 10 minutes asks the CRM to check the site, database and engine and to alert the owner.
- `0120_lead_products.sql` — several products per request; a trigger keeps the older single `product` column equal to the first entry, so older code kept working during the change.

## Applying the migrations

```bash
# with the Supabase CLI against a new project
supabase db push            # or apply each file in order in the SQL editor
```

After applying, add your own sign-in address to `workspace_invites` (migration `0100` invites `owner@example.com`) and sign in once; the invitation turns into a membership.
