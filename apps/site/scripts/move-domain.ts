// Moves the public site to a new address in one step: `bun scripts/move-domain.ts https://oprynex.de`
// Rewrites siteUrl (src/lib/site-url.ts) and the crawl files in public/, and keeps the old host in formerHosts
// so it answers with a permanent redirect. Afterwards: tests, build, deploy, then add the domain to the Worker.
import { readFileSync, writeFileSync } from "node:fs";

const arg = process.argv[2] ?? "";
const next = new URL(arg);
if (next.protocol !== "https:" || next.pathname !== "/" || next.search || next.hash || next.port) {
  console.error("Give the new address as https://host, without a path, for example https://oprynex.de");
  process.exit(1);
}
const newOrigin = next.origin;

const sourceFile = "src/lib/site-url.ts";
let source = readFileSync(sourceFile, "utf8");
const current = source.match(/export const siteUrl = "([^"]+)";/)?.[1];
if (!current) throw new Error(`siteUrl not found in ${sourceFile}`);
if (current === newOrigin) {
  console.log(`The site already uses ${newOrigin}.`);
  process.exit(0);
}
const oldHost = new URL(current).host;
const formerMatch = source.match(/export const formerHosts: readonly string\[] = \[([^\]]*)\];/);
if (!formerMatch) throw new Error(`formerHosts not found in ${sourceFile}`);
const former = [...formerMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((h) => h !== next.host);
if (!former.includes(oldHost)) former.push(oldHost);
source = source
  .replace(`export const siteUrl = "${current}";`, `export const siteUrl = "${newOrigin}";`)
  .replace(formerMatch[0], `export const formerHosts: readonly string[] = [${former.map((h) => JSON.stringify(h)).join(", ")}];`);
writeFileSync(sourceFile, source);

for (const file of ["public/robots.txt", "public/sitemap.xml", "public/llms.txt"]) {
  const text = readFileSync(file, "utf8");
  const count = text.split(current).length - 1;
  writeFileSync(file, text.split(current).join(newOrigin));
  console.log(`${file}: ${count} address(es) updated`);
}
console.log(`siteUrl is now ${newOrigin}; ${oldHost} redirects there.`);
console.log("Next: bun run test:node26, bunx tsc --noEmit, bun run build, then deploy and connect the domain to the Worker.");
