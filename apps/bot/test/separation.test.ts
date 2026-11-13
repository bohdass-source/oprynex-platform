import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The owner's rule: the client bot engine never touches the Oprynex site or the site's own chat.
// This test fails if engine code starts to reference them or to use a key that could reach their data.
const FORBIDDEN = [
  "site.oprynex", // the Oprynex website
  "oprynex-site", // its repository
  "chat-knowledge", // the site chat's knowledge
  "accept_lead(", "accept_chat_request", "chat_rate_limits", "chat_daily_usage", // the site's intake and chat quotas
  "SERVICE_ROLE", "service_role", // the database key that bypasses row level security
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("separation from the Oprynex site", () => {
  const sources = [...files("src"), ...files("scripts"), "wrangler.jsonc"].filter((f) => !f.endsWith(".gen.ts"));
  it.each(sources)("%s does not reference the site, its chat or the service role key", (file) => {
    const text = readFileSync(file, "utf8");
    for (const word of FORBIDDEN) expect(text, `${file} mentions ${word}`).not.toContain(word);
  });
});
