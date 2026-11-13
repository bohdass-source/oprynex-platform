// URLs and language helpers. Default language: no prefix (/leistungen); other languages: /pl/uslugi.
import { site } from "@/site.config";
import type { Lang, Text } from "@/lib/config";
import { SLUGS, UI, type PageKey, type UiKey } from "@/lib/ui-text";

export { site };
export const DEFAULT_LANG: Lang = site.languages[0] ?? "de";
export const NAV_PAGES = ["services", "about", "contact"] as const satisfies readonly PageKey[];

/** The site's address: its own domain once connected, otherwise the Worker trial address. */
export const BASE_URL = site.domain ?? `https://${site.worker}.oprynex.workers.dev`;

export const pick = (value: Text, lang: Lang): string => value[lang] ?? value[DEFAULT_LANG] ?? "";
export const ui = (lang: Lang, key: UiKey): string => UI[lang][key];

export function pathFor(page: PageKey, lang: Lang): string {
  const prefix = lang === DEFAULT_LANG ? "" : `/${lang}`;
  if (page === "home") return prefix || "/";
  if (page === "impressum" || page === "datenschutz") return `${prefix}/${page}`;
  return `${prefix}/${SLUGS[lang][page]}`;
}

/** Maps a pathname to a page and language; null for anything the site does not have (404). */
export function resolvePath(pathname: string): { page: PageKey; lang: Lang } | null {
  const parts = pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part).toLowerCase());
  let lang = DEFAULT_LANG;
  const first = parts[0];
  if (first && first !== DEFAULT_LANG && (site.languages as readonly string[]).includes(first)) {
    lang = first as Lang;
    parts.shift();
  }
  if (parts.length === 0) return { page: "home", lang };
  if (parts.length > 1) return null;
  const slug = parts[0];
  if (slug === "impressum" || slug === "datenschutz") return { page: slug, lang };
  const page = NAV_PAGES.find((key) => SLUGS[lang][key] === slug);
  return page ? { page, lang } : null;
}

/** Language of any path, also of addresses that do not exist (for the 404 page). */
export function langOf(pathname: string): Lang {
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return first && (site.languages as readonly string[]).includes(first) ? (first as Lang) : DEFAULT_LANG;
}
