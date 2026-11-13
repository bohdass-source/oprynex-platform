import { describe, expect, it } from "vitest";
import { LANGUAGES, siteSchema } from "@/lib/config";
import { leadSchema } from "@/lib/lead";
import { isOriginAllowed } from "@/lib/lead.functions";
import { datenschutzMarkdown, germanHours, impressumMarkdown } from "@/lib/legal";
import { buildHead, llmsTxt, robotsTxt, sitemapXml } from "@/lib/seo";
import { BASE_URL, DEFAULT_LANG, pathFor, resolvePath, site } from "@/lib/site";
import { PAGE_BG, contrast, onAccent } from "@/lib/theme";
import { SLUGS, UI, type PageKey } from "@/lib/ui-text";

const PAGES: PageKey[] = ["home", "services", "about", "contact", "impressum", "datenschutz"];

/** Every { de: "…", pl: "…" } object in the config. */
function texts(value: unknown, path = ""): { path: string; text: Record<string, string> }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return Array.isArray(value) ? value.flatMap((v, i) => texts(v, `${path}[${i}]`)) : [];
  }
  const entries = Object.entries(value);
  if (entries.length > 0 && entries.every(([k, v]) => (LANGUAGES as readonly string[]).includes(k) && typeof v === "string")) {
    return [{ path, text: value as Record<string, string> }];
  }
  return entries.flatMap(([k, v]) => texts(v, path ? `${path}.${k}` : k));
}

describe("site.config.ts", () => {
  it("matches the schema", () => {
    expect(siteSchema.safeParse(site).error?.issues ?? []).toEqual([]);
  });

  it("has every text in every site language", () => {
    const missing = texts(site).flatMap(({ path, text }) => site.languages.filter((l) => !text[l]?.trim()).map((l) => `${path}.${l}`));
    expect(missing).toEqual([]);
  });

  it("keeps copy calm: no exclamation marks and no spaced dashes", () => {
    const bad = texts(site).flatMap(({ path, text }) => Object.values(text).filter((t) => /!| - /.test(t)).map((t) => `${path}: ${t}`));
    expect(bad).toEqual([]);
  });

  it("states the tagline in at least two lines", () => {
    for (const l of site.languages) expect(site.home.tagline[l]?.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("uses an accent that reads on the page and carries readable button text", () => {
    const accent = site.theme.accent;
    expect(contrast(accent, onAccent(accent))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, PAGE_BG[site.theme.mode])).toBeGreaterThanOrEqual(3);
  });
});

describe("interface texts", () => {
  it("exist for every language and key", () => {
    const keys = Object.keys(UI.de);
    for (const l of LANGUAGES) expect(Object.keys(UI[l]).sort()).toEqual([...keys].sort());
    for (const l of LANGUAGES) for (const k of keys) if (!(l === "de" && k === "legalGermanOnly")) expect(UI[l][k as keyof typeof UI.de], `${l}.${k}`).toBeTruthy();
  });

  it("use slugs that never collide with each other, a language code or a legal page", () => {
    for (const l of LANGUAGES) {
      const slugs = Object.values(SLUGS[l]);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect([...LANGUAGES, "impressum", "datenschutz"]).not.toContain(s);
      for (const s of slugs) expect(s).toMatch(/^[a-z][a-z-]*$/);
    }
  });
});

describe("URLs", () => {
  it("map every page and language there and back", () => {
    for (const lang of site.languages) for (const page of PAGES) expect(resolvePath(pathFor(page, lang))).toEqual({ page, lang });
  });

  it("serve the default language without a prefix and reject unknown paths", () => {
    expect(pathFor("home", DEFAULT_LANG)).toBe("/");
    expect(resolvePath(`/${DEFAULT_LANG}`)).toBeNull();
    expect(resolvePath("/nicht-da")).toBeNull();
    expect(resolvePath("/impressum/mehr")).toBeNull();
  });
});

describe("SEO", () => {
  it("gives every page a unique title, a description and a self canonical", () => {
    const titles = new Set<string>();
    for (const lang of site.languages) for (const page of PAGES.filter((p) => p !== "impressum" && p !== "datenschutz")) {
      const head = buildHead(page, lang);
      const title = head.meta.find((m) => m["title"])?.["title"] ?? "";
      expect(title.length, `${lang} ${page}`).toBeGreaterThan(10);
      expect(titles.has(title), title).toBe(false);
      titles.add(title);
      const description = head.meta.find((m) => m["name"] === "description")?.["content"] ?? "";
      expect(description.length).toBeGreaterThan(40);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(head.links.find((l) => l["rel"] === "canonical")?.["href"]).toBe(`${BASE_URL}${pathFor(page, lang)}`);
    }
  });

  it("follows indexable in robots meta, robots.txt and the sitemap", () => {
    const robots = buildHead("home", DEFAULT_LANG).meta.find((m) => m["name"] === "robots")?.["content"];
    expect(robots).toBe(site.indexable ? "index, follow" : "noindex, follow");
    expect(robotsTxt()).toContain(site.indexable ? "Sitemap:" : "Disallow: /");
    for (const lang of site.languages) expect(sitemapXml()).toContain(`<loc>${BASE_URL}${pathFor("services", lang)}</loc>`);
    expect(sitemapXml()).not.toContain(`<loc>${BASE_URL}/${site.languages[1] ?? "xx"}/impressum</loc>`);
  });

  it("describes the business for answer engines", () => {
    expect(llmsTxt()).toContain(site.business.name);
    expect(llmsTxt()).toContain(site.business.email);
  });
});

describe("legal texts", () => {
  it("name the business, its address and contact", () => {
    const real = { ...site, example: false };
    const impressum = impressumMarkdown(real);
    for (const part of [site.business.legalName, site.business.street, `${site.business.postalCode} ${site.business.city}`, site.business.email]) expect(impressum).toContain(part);
    expect(datenschutzMarkdown(real)).toContain(site.legal.authority.name);
  });

  it("name Oprynex as the operator of an example site and say the business is made up", () => {
    const demo = { ...site, example: true };
    for (const text of [impressumMarkdown(demo), datenschutzMarkdown(demo)]) {
      expect(text).toContain("Max Mustermann");
      expect(text).toContain("erfunden");
      expect(text).not.toContain(site.business.street);
    }
  });

  it("add the chat section only with a chatbot and keep the numbering without gaps", () => {
    const without = datenschutzMarkdown({ ...site, chatbot: null });
    const withBot = datenschutzMarkdown({ ...site, chatbot: { botId: "9c21916f-f027-494e-adae-e614c0874679" } });
    expect(without).not.toContain("Chat-Assistent");
    expect(withBot).toContain("## 5. Chat-Assistent");
    expect(withBot).toContain("Anthropic PBC");
    const numbers = [...withBot.matchAll(/^## (\d+)\./gm)].map((m) => Number(m[1]));
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  it("writes opening hours in German", () => {
    expect(germanHours("Mo-Fr 07:30-16:30")).toBe("Montag bis Freitag, 07:30 bis 16:30 Uhr");
    expect(germanHours("Sa 09:00-12:00")).toBe("Samstag, 09:00 bis 12:00 Uhr");
  });
});

describe("contact form", () => {
  const lead = { name: "Anna Nowak", email: "anna@example.com", message: "Zwei Zimmer streichen, bitte.", consent: true as const, language: "de" as const };

  it("requires consent and a real message", () => {
    expect(leadSchema.safeParse(lead).success).toBe(true);
    expect(leadSchema.safeParse({ ...lead, consent: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...lead, message: "kurz" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...lead, extra: 1 }).success).toBe(false);
  });

  it("accepts posts only from the site's own addresses", () => {
    expect(isOriginAllowed(`https://${site.worker}.oprynex.workers.dev`, false)).toBe(true);
    expect(isOriginAllowed("https://evil.example", false)).toBe(false);
    expect(isOriginAllowed("http://localhost:8100", false)).toBe(false);
    expect(isOriginAllowed("http://localhost:8100", true)).toBe(true);
  });
});
