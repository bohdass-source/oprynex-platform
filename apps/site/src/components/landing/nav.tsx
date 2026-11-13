import { Moon, Sun } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ComponentProps, type CSSProperties } from "react";
import { isLanguage, useLanguage, type Language } from "@/components/language-provider";
import { linkFocus } from "@/components/landing/classes";
import { ButtonLink, Emblem } from "@/components/landing/primitives";
import { landing } from "@/lib/landing-copy";
import { trackConversion } from "@/lib/offers";

type To = NonNullable<ComponentProps<typeof Link>["to"]>;

// The pages of the site, as in the original navigation.
const links: { to: To; label: typeof landing.nav.services }[] = [
  { to: "/assistants", label: landing.nav.assistants },
  { to: "/industries", label: landing.nav.industries },
  { to: "/services", label: landing.nav.services },
  { to: "/preise", label: landing.nav.pricing },
  { to: "/faq", label: landing.nav.faq },
];

const languages: { code: Language; label: string }[] = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label={landing.nav.language[language]} className="flex items-center rounded-lg bg-lp-raised p-0.5">
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          aria-pressed={language === item.code}
          onClick={() => { if (isLanguage(item.code)) setLanguage(item.code); }}
          className={`rounded-md px-2 py-1 text-sm font-semibold transition-[background-color,color] duration-300 ease-lp ${linkFocus} ${language === item.code ? "bg-lp-fg text-lp-bg" : "text-lp-muted hover:text-lp-fg"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Same storage key and class as the shared toggle; dark stays the server default and the choice is applied after hydration.
function ThemeSwitch() {
  const { language } = useLanguage();
  const [light, setLight] = useState(false);
  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem("oprynex-theme") === "light"; } catch { /* storage can be blocked */ }
    setLight(saved);
    document.documentElement.classList.toggle("light", saved);
  }, []);
  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("oprynex-theme", next ? "light" : "dark"); } catch { /* storage can be blocked */ }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? landing.nav.themeDark[language] : landing.nav.themeLight[language]}
      className={`flex size-8 items-center justify-center rounded-lg text-lp-muted transition-[background-color,color] duration-300 ease-lp hover:bg-lp-raised hover:text-lp-fg ${linkFocus}`}
    >
      {light ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}

/** Floating navigation of every page. Page links sit in the bar from xl up; below that they open in a full height menu. */
export function SiteNav() {
  const { language: l } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open]);

  const current = (to: To) => (pathname === to ? "page" : undefined);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav aria-label={landing.nav.primary[l]} className="flex items-center gap-2 rounded-2xl border border-lp-line bg-lp-surface/70 p-2 backdrop-blur-xl">
        <Link
          to="/"
          onClick={() => { setOpen(false); if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className={`flex items-center gap-2 rounded-lg px-2 py-1 ${linkFocus}`}
        >
          <Emblem size={32} />
          <span className="text-base font-semibold">Oprynex</span>
        </Link>

        <ul className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <li key={String(link.to)}>
              <Link
                to={link.to}
                aria-current={current(link.to)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color] duration-300 ease-lp ${linkFocus} ${pathname === link.to ? "bg-lp-raised text-lp-fg" : "text-lp-muted hover:bg-lp-raised hover:text-lp-fg"}`}
              >
                {link.label[l]}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitch />
          <ThemeSwitch />
          <ButtonLink to="/contact" size="sm" onClick={() => trackConversion("project", "nav_cta")}>{landing.cta[l]}</ButtonLink>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="lp-menu"
          aria-label={open ? landing.nav.close[l] : landing.nav.open[l]}
          onClick={() => setOpen((value) => !value)}
          className={`relative size-8 rounded-lg text-lp-fg transition-colors duration-300 ease-lp hover:bg-lp-raised xl:hidden ${linkFocus}`}
        >
          <span className="lp-bar lp-bar-a" aria-hidden="true" />
          <span className="lp-bar lp-bar-b" aria-hidden="true" />
        </button>
      </nav>

      <div id="lp-menu" data-open={open} inert={!open} className="lp-menu fixed inset-0 -z-10 flex flex-col bg-lp-bg/90 px-4 pb-24 pt-24 backdrop-blur-2xl xl:hidden">
        <ul className="flex flex-col gap-2">
          {links.map((link, i) => (
            <li key={String(link.to)} className="lp-menu-item" style={{ "--i": i } as CSSProperties}>
              <Link to={link.to} aria-current={current(link.to)} onClick={() => setOpen(false)} className={`block rounded-lg px-2 py-2 text-3xl font-semibold ${pathname === link.to ? "text-lp-fg" : "text-lp-muted"} ${linkFocus}`}>{link.label[l]}</Link>
            </li>
          ))}
        </ul>
        <div className="lp-menu-item mt-auto flex flex-col gap-4" style={{ "--i": links.length } as CSSProperties}>
          <div className="flex items-center justify-between">
            <LanguageSwitch />
            <ThemeSwitch />
          </div>
          <ButtonLink to="/contact" onClick={() => trackConversion("project", "menu_cta")}>{landing.cta[l]}</ButtonLink>
        </div>
      </div>
    </header>
  );
}
