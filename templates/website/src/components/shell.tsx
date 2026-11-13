import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/config";
import { NAV_PAGES, langOf, pathFor, pick, resolvePath, site, ui } from "@/lib/site";
import { LANGUAGE_NAME, type PageKey } from "@/lib/ui-text";

/** In-app link to one of the site's paths ("/", "/leistungen", "/pl/uslugi"). */
export function PageLink({ path, className, children, ...aria }: { path: string; className?: string; children: ReactNode; "aria-current"?: "page" | undefined }) {
  const props = { className, children, "aria-current": aria["aria-current"] };
  return path === "/" ? <Link to="/" {...props} /> : <Link to="/$" params={{ _splat: path.slice(1) }} {...props} />;
}

function usePage(): { page: PageKey | null; lang: Lang } {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resolved = resolvePath(pathname);
  return resolved ?? { page: null, lang: langOf(pathname) };
}

function Brand({ lang }: { lang: Lang }) {
  const logo = site.business.logo;
  return (
    <PageLink path={pathFor("home", lang)} className="flex items-center gap-2 rounded-lg text-base font-bold">
      {logo && <img src={logo.src} alt="" className="h-8 w-8 rounded-lg object-contain" />}
      <span>{site.business.name}</span>
    </PageLink>
  );
}

function LanguageLinks({ page, lang, className = "" }: { page: PageKey | null; lang: Lang; className?: string }) {
  if (site.languages.length < 2) return null;
  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label={ui(lang, "language")}>
      {site.languages.map((l) => (
        <a key={l} href={pathFor(page ?? "home", l)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} title={LANGUAGE_NAME[l]}
          className={`rounded-lg px-2 py-1 text-sm font-semibold uppercase transition-colors duration-300 ease-out-soft ${l === lang ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}>
          {l}
        </a>
      ))}
    </div>
  );
}

/** Two lines that turn into a cross; drawn by hand so the change is animated. */
function MenuIcon({ open }: { open: boolean }) {
  const line = "absolute left-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-500 ease-out-soft";
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <span className={`${line} top-2 ${open ? "translate-y-1 rotate-45" : ""}`} />
      <span className={`${line} top-4 ${open ? "-translate-y-1 -rotate-45" : ""}`} />
    </span>
  );
}

function Navigation({ page, lang }: { page: PageKey | null; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  const links = NAV_PAGES.filter((p) => p !== "contact");
  return (
    <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav aria-label={site.business.name} className="relative z-50 flex w-full max-w-5xl items-center gap-4 rounded-2xl border border-line bg-bg/80 py-2 pl-4 pr-2 backdrop-blur-xl">
        <Brand lang={lang} />
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((p) => (
            <PageLink key={p} path={pathFor(p, lang)} aria-current={page === p ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-300 ease-out-soft ${page === p ? "text-text" : "text-muted hover:text-text"}`}>
              {ui(lang, p)}
            </PageLink>
          ))}
          <LanguageLinks page={page} lang={lang} className="ml-2" />
          <PageLink path={pathFor("contact", lang)} aria-current={page === "contact" ? "page" : undefined} className="btn-primary ml-2 text-sm">{pick(site.home.cta, lang)}</PageLink>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={ui(lang, open ? "menuClose" : "menuOpen")}
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg text-text md:hidden">
          <MenuIcon open={open} />
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-40 flex flex-col bg-bg/95 px-6 pb-12 pt-24 backdrop-blur-2xl md:hidden">
          <ul className="space-y-2">
            {(["home", ...NAV_PAGES] as const).map((p, i) => (
              <li key={p} className="menu-link" style={{ animationDelay: `${Math.min(i * 60, 340)}ms` }}>
                <PageLink path={pathFor(p, lang)} aria-current={page === p ? "page" : undefined}
                  className={`block rounded-lg py-2 text-3xl font-semibold ${page === p ? "text-text" : "text-muted"}`}>{ui(lang, p)}</PageLink>
              </li>
            ))}
          </ul>
          <LanguageLinks page={page} lang={lang} className="mt-auto" />
        </div>
      )}
    </header>
  );
}

function Footer({ lang }: { lang: Lang }) {
  const b = site.business;
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div className="space-y-2">
          <Brand lang={lang} />
          <address className="text-sm not-italic text-muted">{b.street}<br />{b.postalCode} {b.city}</address>
        </div>
        <div className="space-y-1 text-sm">
          <a href={`mailto:${b.email}`} className="block rounded-lg text-muted hover:text-text">{b.email}</a>
          {b.phone && <a href={`tel:${b.phone.replace(/ /g, "")}`} className="block rounded-lg text-muted hover:text-text">{b.phone}</a>}
        </div>
        <ul className="space-y-1 text-sm">
          {(["impressum", "datenschutz"] as const).map((p) => (
            <li key={p}><PageLink path={pathFor(p, lang)} className="rounded-lg text-muted hover:text-text">{ui(lang, p)}</PageLink></li>
          ))}
        </ul>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-8 text-xs text-muted">© {new Date().getFullYear()} {b.legalName}</p>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { page, lang } = usePage();
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-lg bg-accent px-3 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{ui(lang, "skip")}</a>
      <Navigation page={page} lang={lang} />
      <main id="main" tabIndex={-1} className="pt-24">
        {site.example && <p className="mx-auto mt-2 max-w-5xl px-4 text-center text-sm font-semibold text-muted" role="note">{ui(lang, "demoNote")}</p>}
        {children}
      </main>
      <Footer lang={lang} />
    </>
  );
}
