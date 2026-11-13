// Runs before every deploy (bun run cf:deploy). Stops a deploy that would publish example data, unreviewed legal texts
// or placeholders. ALLOW_EXAMPLE=1 deploys the template's own example business as a demo.
import { siteSchema } from "../src/lib/config";
import { site } from "../src/site.config";

const errors: string[] = [];
const warnings: string[] = [];
const parsed = siteSchema.safeParse(site);
if (!parsed.success) errors.push(...parsed.error.issues.map((i) => `config ${i.path.join(".")}: ${i.message}`));
if (site.example && process.env["ALLOW_EXAMPLE"] !== "1") errors.push("site.config.ts still holds the example business (example: true).");
if (site.indexable && !site.legal.reviewed) errors.push("indexable is true, but the client has not confirmed Impressum and Datenschutz (legal.reviewed).");
if (site.indexable && !site.domain) warnings.push("indexable without an own domain: search engines will index the workers.dev address.");
const placeholders = /\b(TODO|TBD|XXX|Lorem|Mustermann|Musterstraße)\b|\.example\b|example\.com/i;
const walk = (value: unknown, path: string): void => {
  if (typeof value === "string") { if (placeholders.test(value) && !site.example) errors.push(`placeholder in ${path}: "${value}"`); return; }
  if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
};
walk(site, "");
if (!site.indexable) warnings.push("noindex: fine for a trial link; set indexable: true at launch.");

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ preflight passed for ${site.business.name} (${site.worker})`);
