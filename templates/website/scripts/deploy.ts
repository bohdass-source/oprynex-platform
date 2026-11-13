// Deploys the built Worker under the name from site.config.ts: https://<worker>.oprynex.workers.dev
import { spawnSync } from "node:child_process";
import { site } from "../src/site.config";

const result = spawnSync("bunx", ["wrangler", "deploy", "--config", ".output/server/wrangler.json", "--name", site.worker], { stdio: "inherit" });
process.exit(result.status ?? 1);
