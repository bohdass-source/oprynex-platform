// Single source of the public address. Moving to an own domain: `bun scripts/move-domain.ts https://example.de`
// rewrites it here and in public/robots.txt, sitemap.xml and llms.txt, and keeps the old host as a permanent redirect.
export const siteUrl = "https://oprynex.de";

// Former public hosts: requests to them are redirected permanently to siteUrl, so links and search results carry over.
export const formerHosts: readonly string[] = ["site.oprynex.workers.dev", "www.oprynex.de"];
