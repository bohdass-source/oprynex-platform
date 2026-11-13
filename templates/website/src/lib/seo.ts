// Title, description, canonical, hreflang, Open Graph and schema.org for every page, all from src/site.config.ts.
import type { Lang } from "@/lib/config";
import { germanHours } from "@/lib/legal";
import { BASE_URL, DEFAULT_LANG, NAV_PAGES, pathFor, pick, site, ui } from "@/lib/site";
import { LOCALE, type PageKey } from "@/lib/ui-text";

type Head = { meta: Record<string, string>[]; links: Record<string, string>[]; scripts: { type: string; children: string }[] };

export function pageTitle(page: PageKey, lang: Lang): { title: string; description: string } {
  if (page === "impressum" || page === "datenschutz") {
    return { title: `${ui(lang, page)} · ${site.business.name}`, description: `${ui(lang, page)} ${site.business.name}, ${site.business.city}` };
  }
  const seo = site[page].seo;
  return { title: pick(seo.title, lang), description: pick(seo.description, lang) };
}

/** Legal pages exist in German only, so their copies under other languages point to the German page and are not indexed. */
const isLegal = (page: PageKey) => page === "impressum" || page === "datenschutz";

export function localBusiness(): Record<string, unknown> {
  const b = site.business;
  return {
    "@context": "https://schema.org",
    "@type": b.schemaType,
    "@id": `${BASE_URL}/#business`,
    name: b.name,
    url: `${BASE_URL}/`,
    email: b.email,
    ...(b.phone ? { telephone: b.phone.replace(/ /g, "") } : {}),
    address: { "@type": "PostalAddress", streetAddress: b.street, postalCode: b.postalCode, addressLocality: b.city, addressCountry: b.country },
    areaServed: b.areaServed.map((name) => ({ "@type": "City", name })),
    ...(b.openingHours.length ? { openingHours: b.openingHours } : {}),
    ...(b.logo ? { logo: `${BASE_URL}${b.logo.src}`, image: `${BASE_URL}${b.logo.src}` } : {}),
    ...(b.vatId ? { vatID: b.vatId } : {}),
  };
}

function faqPage(lang: Lang): Record<string, unknown> | null {
  if (site.home.faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: site.home.faq.map((f) => ({ "@type": "Question", name: pick(f.q, lang), acceptedAnswer: { "@type": "Answer", text: pick(f.a, lang) } })),
  };
}

function services(lang: Lang): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: site.services.items.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Service", name: pick(s.title, lang), description: pick(s.text, lang), provider: { "@id": `${BASE_URL}/#business` }, areaServed: site.business.areaServed },
    })),
  };
}

export function buildHead(page: PageKey, lang: Lang): Head {
  const { title, description } = pageTitle(page, lang);
  const legal = isLegal(page);
  const canonical = `${BASE_URL}${pathFor(page, legal ? DEFAULT_LANG : lang)}`;
  const index = site.indexable && (!legal || lang === DEFAULT_LANG);
  const image = site.home.image ?? site.business.logo;
  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: index ? "index, follow" : "noindex, follow" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.business.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: LOCALE[lang].replace("-", "_") },
    ...(image ? [{ property: "og:image", content: `${BASE_URL}${image.src}` }, { property: "og:image:alt", content: pick(image.alt, lang) }] : []),
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
  ];
  const links: Record<string, string>[] = [{ rel: "canonical", href: canonical }];
  if (!legal && site.languages.length > 1) {
    for (const l of site.languages) links.push({ rel: "alternate", hreflang: LOCALE[l], href: `${BASE_URL}${pathFor(page, l)}` });
    links.push({ rel: "alternate", hreflang: "x-default", href: `${BASE_URL}${pathFor(page, DEFAULT_LANG)}` });
  }
  const data = page === "home" ? [localBusiness(), faqPage(lang)] : page === "services" ? [services(lang)] : page === "contact" ? [localBusiness()] : [];
  const scripts = data.filter((d): d is Record<string, unknown> => d !== null)
    .map((d) => ({ type: "application/ld+json", children: JSON.stringify(d).replace(/</g, "\\u003c") }));
  return { meta, links, scripts };
}

export function sitemapXml(): string {
  const pages: PageKey[] = ["home", ...NAV_PAGES, "impressum", "datenschutz"];
  const urls = pages.flatMap((page) => (isLegal(page) ? [DEFAULT_LANG] : site.languages).map((lang) => {
    const alternates = !isLegal(page) && site.languages.length > 1
      ? site.languages.map((l) => `\n    <xhtml:link rel="alternate" hreflang="${LOCALE[l]}" href="${BASE_URL}${pathFor(page, l)}"/>`).join("")
      : "";
    return `  <url>\n    <loc>${BASE_URL}${pathFor(page, lang)}</loc>${alternates}\n  </url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return site.indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
}

/** llms.txt: a plain summary for AI assistants and answer engines (GEO), in the default language. */
export function llmsTxt(): string {
  const b = site.business;
  const l = DEFAULT_LANG;
  return [
    `# ${b.name}`,
    `> ${pick(site.home.subtitle, l).replace(/\n/g, " ")}`,
    `Adresse: ${b.street}, ${b.postalCode} ${b.city}. E-Mail: ${b.email}${b.phone ? `. Telefon: ${b.phone}` : ""}.`,
    `Einsatzgebiet: ${b.areaServed.join(", ")}.`,
    b.openingHours.length ? `Öffnungszeiten: ${b.openingHours.map(germanHours).join("; ")}.` : "",
    `## ${pick(site.services.title, l)}`,
    site.services.items.map((s) => `- ${pick(s.title, l)}: ${pick(s.text, l)}${s.price ? ` (${pick(s.price, l)})` : ""}`).join("\n"),
    site.home.faq.length ? `## ${ui(l, "faqTitle")}\n${site.home.faq.map((f) => `- ${pick(f.q, l)} ${pick(f.a, l)}`).join("\n")}` : "",
    `## Seiten\n${(["home", ...NAV_PAGES] as const).map((p) => `- [${ui(l, p)}](${BASE_URL}${pathFor(p, l)})`).join("\n")}`,
  ].filter(Boolean).join("\n\n") + "\n";
}
