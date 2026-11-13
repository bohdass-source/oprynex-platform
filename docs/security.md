# Security and data protection

## Checked before shutdown

- No secret, key or token in the history of any project repository; `.env` files are ignored, `.env.example` files hold only names.
- Every database table has row level security; every function reachable through the API checks a token, platform admin rights or workspace membership.
- Internal files (`/.env`, `/.git/config`, `/package.json`, build configs) return 404 on every Worker.
- Security headers on every response (see [hosting.md](hosting.md)).

## Principles used throughout

| Principle | Where |
|---|---|
| Validate at both boundaries | One Zod schema per form, used in the browser and on the server; the database functions validate again |
| Fail closed | The lead endpoint trusts only `CF-Connecting-IP` in production and refuses requests without it; unknown origins are refused |
| Least privilege | The CRM browser uses the publishable key; websites and the engine use per-site tokens; the service role key exists only in the website Worker |
| Atomic limits | Rate limit and insert happen in one locked transaction |
| Hash, don't store | IP addresses are kept only as SHA-256 and deleted after 7 days; tokens only as SHA-256 |
| No payload in push | Web Push wakes the CRM tab without data; the browser vendor never sees request content |
| Consent before tracking | Statistics load only after explicit acceptance; rejection and no choice both mean no tracking |
| AI transparency | Both chats say they are AI, ask not to enter sensitive data and never store message texts |

## Data protection features in the CRM

- Retention period per workspace (3 to 120 months) applied by a daily job.
- Delete a single request (for erasure requests) or all spam at once; delete a whole workspace with confirmation.
- Export of requests and customers.
- Data processing agreement (AVV) and privacy texts as examples in `apps/site/src/lib`.

## Not included in this repository

Real requests, customer data, the operator's address and every key. The demo data in the CRM and the chatbot screenshots is invented, and every price is shown as "XXX €".
