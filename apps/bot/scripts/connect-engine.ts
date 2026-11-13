// Gives the deployed engine its database token. Creates a random token, stores it as the Worker secret BOT_ENGINE_TOKEN
// without ever printing it, and prints only its SHA-256 and the SQL that registers it.
// Run once after the first deploy (and again to rotate the token): bun run connect
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const token = randomBytes(32).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");
const put = spawnSync("bunx", ["wrangler", "secret", "put", "BOT_ENGINE_TOKEN", "--name", "bot"], { input: token, stdio: ["pipe", "inherit", "inherit"] });
if (put.status !== 0) process.exit(put.status ?? 1);
console.log("\nRegister the token (Supabase SQL; after a rotation also delete the old row):\n");
console.log(`INSERT INTO private.bot_engine_tokens (token_hash) VALUES ('${hash}');`);
