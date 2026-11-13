// End-to-end check of the live engine after setup: both demo bots load on their demo sites, the dental bot answers one
// question (a real AI call), and each demo bot accepts one marked test request. Test requests use the address below so
// they are easy to find and delete in the CRM (Claude deletes them with SQL afterwards).
//   bun scripts/smoke.ts
const ENGINE = "https://bot.oprynex.workers.dev";
export const SMOKE_EMAIL = "smoke-test@oprynex.invalid";
const DEMOS = [
  { name: "Zahnarzt", bot: "9c21916f-f027-494e-adae-e614c0874679", site: "https://demo-zahnarzt.oprynex.workers.dev", kind: "appointment" },
  { name: "Elektriker", bot: "1e0498d9-0e19-4fb8-b6cc-16272158f2de", site: "https://demo-elektriker.oprynex.workers.dev", kind: "lead" },
] as const;

let failed = 0;
const report = (ok: boolean, line: string) => { if (!ok) failed++; console.log(`${ok ? "✓" : "✗"} ${line}`); };
const call = (path: string, origin: string, body?: unknown) =>
  fetch(`${ENGINE}${path}`, { method: body ? "POST" : "GET", headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });

for (const demo of DEMOS) {
  const config = await call(`/v1/bots/${demo.bot}`, demo.site);
  const data = (await config.json().catch(() => ({}))) as { bot?: { kind?: string } };
  report(config.status === 200 && data.bot?.kind === demo.kind, `${demo.name}: bot loads on its demo site (${config.status}, kind ${data.bot?.kind ?? "?"})`);
}

const dental = DEMOS[0];
const chat = await call(`/v1/bots/${dental.bot}/chat`, dental.site, { messages: [{ role: "user", content: "Wann haben Sie am Mittwoch geöffnet?" }], language: "de" });
const answer = (await chat.json().catch(() => ({}))) as { ok?: boolean; answer?: string; reason?: string };
report(Boolean(answer.ok && answer.answer), `Zahnarzt: AI answer ${answer.ok ? `"${answer.answer?.slice(0, 120)}"` : `failed (${answer.reason ?? chat.status})`}`);

for (const demo of DEMOS) {
  const message = demo.kind === "appointment" ? "Wunschtermin: Testlauf. Bitte ignorieren, automatischer Test." : "Automatischer Test der Anfrage. Bitte ignorieren.";
  const lead = await call(`/v1/bots/${demo.bot}/lead`, demo.site, { name: "Oprynex Smoke Test", email: SMOKE_EMAIL, message, consent: true, language: "de", pagePath: "/smoke" });
  const saved = (await lead.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
  report(Boolean(saved.ok), `${demo.name}: test request ${saved.ok ? "saved" : `refused (${saved.reason ?? lead.status})`}`);
}

console.log(failed ? `\n${failed} check(s) failed.` : `\nAll checks passed. Test requests use ${SMOKE_EMAIL}.`);
process.exit(failed ? 1 : 0);
