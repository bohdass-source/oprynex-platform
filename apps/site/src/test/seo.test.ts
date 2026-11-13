import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guides } from "@/lib/guides";
import { eur, offers, prices } from "@/lib/offers";
import { ogImage, pageHead, seoPages, siteUrl, type SeoPath } from "@/lib/seo";

const publicDir = join(__dirname, "../../public");

const commercial: SeoPath[] = ["/", "/ki-chatbot-website", "/website-erstellen-lassen", "/crm-entwicklung", "/beratung", "/preise", ...guides.map((g) => g.path)];
const paths = Object.keys(seoPages) as SeoPath[];

describe("SEO metadata (GEO checklist)", () => {
  it("commercial pages: German title 50-65 chars, description 140-165 chars", () => {
    for (const path of commercial) {
      const { title, description } = seoPages[path].de;
      expect(title.length, `${path} title`).toBeGreaterThanOrEqual(50);
      expect(title.length, `${path} title`).toBeLessThanOrEqual(65);
      expect(description.length, `${path} description`).toBeGreaterThanOrEqual(140);
      expect(description.length, `${path} description`).toBeLessThanOrEqual(165);
    }
  });

  it("every page has unique German titles and descriptions", () => {
    const titles = paths.map((p) => seoPages[p].de.title);
    const descriptions = paths.map((p) => seoPages[p].de.description);
    expect(new Set(titles).size).toBe(paths.length);
    expect(new Set(descriptions).size).toBe(paths.length);
  });

  it("home page carries ProfessionalService schema with the founder", () => {
    const scripts = pageHead("/").scripts.map((s) => JSON.parse(s.children));
    const business = scripts.find((s) => s["@type"] === "ProfessionalService");
    expect(business).toBeDefined();
    expect(business.founder.name).toBe("Max Mustermann");
  });

  it("FAQ page carries FAQPage schema with at least 5 questions", () => {
    const scripts = pageHead("/faq").scripts.map((s) => JSON.parse(s.children));
    const faq = scripts.find((s) => s["@type"] === "FAQPage");
    expect(faq).toBeDefined();
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(5);
    for (const q of faq.mainEntity) {
      expect(q["@type"]).toBe("Question");
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
    }
  });

  it("FAQPage schema is built from the visible FAQ, in German and without leftover Russian", async () => {
    const { faq: visible } = await import("@/lib/content");
    const { translations } = await import("@/lib/translations");
    const schema = pageHead("/faq")
      .scripts.map((s) => JSON.parse(s.children))
      .find((s) => s["@type"] === "FAQPage");
    expect(schema.mainEntity).toHaveLength(visible.length);
    visible.forEach(([q, a], i) => {
      expect(schema.mainEntity[i].name).toBe(translations[q]?.de);
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(translations[a]?.de);
    });
    expect(JSON.stringify(schema)).not.toMatch(/[А-Яа-яЁё]/);
  });

  it("every page has a self-referencing canonical", () => {
    for (const path of paths) {
      const head = pageHead(path);
      expect(head.links).toEqual([{ rel: "canonical", href: `${siteUrl}${path}` }]);
    }
  });

  it("every page has a share image with size and alt text", () => {
    for (const path of paths) {
      const meta = pageHead(path).meta;
      const content = (key: string) => meta.find((m) => ("property" in m && m.property === key) || ("name" in m && m.name === key));
      expect(content("og:image"), path).toMatchObject({ content: ogImage.url });
      expect(content("twitter:image"), path).toMatchObject({ content: ogImage.url });
      expect(content("og:image:width"), path).toMatchObject({ content: "1200" });
      expect(content("og:image:height"), path).toMatchObject({ content: "630" });
      expect(content("og:image:alt"), path).toBeDefined();
    }
    expect(existsSync(join(publicDir, "brand/oprynex-og.jpg"))).toBe(true);
  });

  it("the offer pages carry Service schema without prices (hidden in the public demo)", () => {
    for (const offer of offers) {
      const scripts = pageHead(offer.path).scripts.map((s) => JSON.parse(s.children));
      const service = scripts.find((s) => s["@type"] === "Service");
      expect(service, offer.path).toBeDefined();
      expect(service.provider["@id"]).toBe(`${siteUrl}/#business`);
      // Prices are hidden in the public demo, so the markup carries no offer.
      expect(service.offers, offer.path).toBeUndefined();
    }
  });
});

describe("guides", () => {
  it("carry Article and FAQPage schema in German, built from the visible questions", () => {
    for (const guide of guides) {
      const scripts = pageHead(guide.path).scripts.map((s) => JSON.parse(s.children));
      const article = scripts.find((s) => s["@type"] === "Article");
      const faq = scripts.find((s) => s["@type"] === "FAQPage");
      expect(article.author.name, guide.path).toBe("Max Mustermann");
      expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(guide.faq.map((f) => f.q.de));
      expect(JSON.stringify(scripts), guide.path).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  it("name prices only from the registry and promise no compliance, rankings or proof", () => {
    const euros = new Set([prices.chatbot, prices.chatbotMonthly, prices.website, prices.crm, prices.consultHour].map((n) => eur(n, "de")));
    const text = guides.map((g) => JSON.stringify(g)).join(" ");
    for (const amount of text.matchAll(/(?:ab|von|bei) (\d[\d.]*\s€)/g)) expect(euros).toContain(amount[1]);
    expect(text).not.toMatch(/garantiert|zertifiziert nach|100 %|Kundenstimme/i);
    for (const guide of guides) {
      expect(guide.faq.length, guide.path).toBeGreaterThanOrEqual(3);
      for (const field of [guide.h1, guide.lead]) {
        expect(field.ru, guide.path).toMatch(/[А-Яа-яЁё]/);
        expect(field.de, guide.path).not.toMatch(/[А-Яа-яЁё]/);
        expect(field.en, guide.path).not.toMatch(/[А-Яа-яЁё]/);
      }
    }
  });

  it("show the same amounts as the offers and link every industry card to its page", async () => {
    const { industries } = await import("@/lib/content");
    for (const i of industries) expect(guides.map((g) => g.path), i.name).toContain(i.path);
    expect(new Set(industries.map((i) => i.path)).size).toBe(industries.length);
    const texts = guides.map((g) => g.sections.flatMap((s) => s.text.map((t) => t.de)).join(" "));
    expect(new Set(texts).size).toBe(guides.length);
  });

  it("link only to routes that exist and are linked from their offer page", () => {
    for (const guide of guides) {
      for (const link of guide.links) expect(Object.keys(seoPages), link.to).toContain(link.to);
      expect(offers.map((o) => o.path)).toContain(guide.offer);
    }
  });
});

describe("crawler files in public/", () => {
  const read = (file: string) => readFileSync(join(publicDir, file), "utf8");
  const sitemapUrls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("sitemap.xml lists every public route exactly once, with a valid lastmod", () => {
    expect([...sitemapUrls].sort()).toEqual(paths.map((p) => `${siteUrl}${p}`).sort());
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    const lastmods = [...read("sitemap.xml").matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    expect(lastmods).toHaveLength(sitemapUrls.length);
    for (const d of lastmods) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("every route file has a matching SEO entry", () => {
    const routeFiles = readdirSync(join(__dirname, "../routes")).filter((f) => f.endsWith(".tsx") && !f.startsWith("__"));
    const routePaths = routeFiles.map((f) => (f === "index.tsx" ? "/" : `/${f.replace(/\.tsx$/, "")}`));
    expect(routePaths.sort()).toEqual([...paths].sort());
  });

  it("robots.txt points at the sitemap, keeps public pages open and lists AI crawlers", () => {
    const robots = read("robots.txt");
    expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    expect(robots).toMatch(/User-agent: \*\nAllow: \/\nDisallow: \/_serverFn\//);
    for (const bot of ["Googlebot", "Bingbot", "Applebot", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "Claude-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(robots, bot).toContain(`User-agent: ${bot}`);
    }
    // A blanket "Disallow: /" would hide the whole site from every search engine.
    expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
  });

  it("llms.txt only links to pages that exist in the sitemap", () => {
    const links = [...read("llms.txt").matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) expect(sitemapUrls, link).toContain(link);
    expect(read("llms.txt")).toMatch(/^# Oprynex\n\n> /);
  });
});

describe("current facts in crawl files and FAQ", () => {
  it("llms.txt and the FAQ name 20 languages and no longer claim unpublished prices or a buyable Cloud", async () => {
    const { readFileSync } = await import("node:fs");
    const llms = readFileSync("public/llms.txt", "utf8");
    expect(llms).toContain("20 Sprachen");
    expect(llms).not.toMatch(/Preise stehen noch nicht fest|13 Sprachen/);
    const { faq } = await import("@/lib/content");
    const text = faq.flat().join(" ");
    expect(text).toContain("На 20 языках");
    expect(text).not.toMatch(/13 языков|доступен по подписке|а не заранее/);
  });

  it("no longer offers Oprynex Cloud or MVP in the crawl files and redirects their old pages", async () => {
    const { readFileSync } = await import("node:fs");
    const llms = readFileSync("public/llms.txt", "utf8");
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    expect(llms).not.toMatch(/Oprynex Cloud|MVP|\/platform/);
    for (const old of ["/cloud", "/platform", "/mvp-entwicklung", "/mvp-kosten", "/crm-kleine-unternehmen"]) {
      expect(sitemap).not.toContain(`oprynex.de${old}<`);
      const { canonicalRedirect } = await import("@/lib/http-policy");
      const r = canonicalRedirect(new Request(`${siteUrl}${old}?utm=a`));
      expect(r?.status, old).toBe(308);
      expect(r?.headers.get("location"), old).not.toContain(old + "?");
    }
  });
});
