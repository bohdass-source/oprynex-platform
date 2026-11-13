// Asks a live bot a list of questions through the engine, the way the widget does, and prints each answer.
// Uses the demo page's origin, so the bot must list https://bot.oprynex.workers.dev among its websites.
// Every question counts against the bot's limits. Run: bun scripts/probe.ts <bot-id> [questions.txt]
import { readFileSync } from "node:fs";

const ENGINE = process.env["BOT_ENGINE_URL"] ?? "https://bot.oprynex.workers.dev";
const botId = process.argv[2] ?? "";
if (!/^[0-9a-f-]{36}$/.test(botId)) {
  console.error("Usage: bun scripts/probe.ts <bot-id> [questions.txt]   (one question per line, # for comments)");
  process.exit(1);
}
const file = process.argv[3] ?? new URL("../demo/probe-questions.txt", import.meta.url).pathname;
const questions = readFileSync(file, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

for (const question of questions) {
  const response = await fetch(`${ENGINE}/v1/bots/${botId}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ENGINE },
    body: JSON.stringify({ messages: [{ role: "user", content: question }], language: "de" }),
  });
  const body = (await response.json().catch(() => ({}))) as { ok?: boolean; answer?: string; handoff?: boolean; language?: string; reason?: string };
  console.log(`\nQ: ${question}`);
  console.log(body.ok ? `A (${body.language}${body.handoff ? ", handoff" : ""}): ${body.answer}` : `✗ ${response.status} ${body.reason ?? ""}`);
  await new Promise((r) => setTimeout(r, 7000)); // stays under 10 questions per minute
}
