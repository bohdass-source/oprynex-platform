import { ArrowRight, Clock, EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { ContactForm } from "@/components/contact-form";
import { Markdown, withBreaks } from "@/components/markdown";
import { Reveal } from "@/components/reveal";
import { PageLink } from "@/components/shell";
import type { Lang, Text } from "@/lib/config";
import { datenschutzMarkdown, germanHours, impressumMarkdown } from "@/lib/legal";
import { pathFor, pick, site, ui } from "@/lib/site";
import { LOCALE, type PageKey } from "@/lib/ui-text";

const lines = (value: Text, lang: Lang) => withBreaks(pick(value, lang).split("\n"));
const container = "mx-auto w-full max-w-5xl px-4";

function SectionTitle({ id, children }: { id: string; children: string }) {
  return <h2 id={id} className="text-3xl font-bold sm:text-4xl">{children}</h2>;
}

function Hero({ lang }: { lang: Lang }) {
  const h = site.home;
  const b = site.business;
  return (
    <section aria-labelledby="hero-title" className={`${container} grid items-center gap-12 py-16 md:grid-cols-[1fr_20rem] md:py-24`}>
      <div>
        {h.badge && <p className="mb-4 inline-flex rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold text-muted">{pick(h.badge, lang)}</p>}
        <h1 id="hero-title" className="hero-title max-w-[680px] pb-2 text-4xl font-bold sm:text-6xl">{lines(h.title, lang)}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-muted">{pick(h.subtitle, lang)}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <PageLink path={pathFor("contact", lang)} className="btn-primary">{pick(h.cta, lang)}<ArrowRight size={18} aria-hidden="true" /></PageLink>
          {h.proof && <p className="text-sm text-muted">{pick(h.proof, lang)}</p>}
        </div>
      </div>
      {h.image ? (
        <img src={h.image.src} alt={pick(h.image.alt, lang)} className="aspect-[4/5] w-full rounded-2xl object-cover" fetchPriority="high" />
      ) : (
        <ul className="card space-y-4 p-6 text-sm">
          <li className="flex gap-3"><MapPin size={20} className="shrink-0 text-accent" aria-hidden="true" /><span>{b.areaServed.join(", ")}</span></li>
          {b.openingHours.length > 0 && <li className="flex gap-3"><Clock size={20} className="shrink-0 text-accent" aria-hidden="true" /><span>{b.openingHours.map(hoursText(lang)).join("; ")}</span></li>}
          {b.phone && <li className="flex gap-3"><Phone size={20} className="shrink-0 text-accent" aria-hidden="true" /><a href={`tel:${b.phone.replace(/ /g, "")}`} className="rounded-lg hover:underline">{b.phone}</a></li>}
          <li className="flex gap-3"><EnvelopeSimple size={20} className="shrink-0 text-accent" aria-hidden="true" /><a href={`mailto:${b.email}`} className="rounded-lg break-all hover:underline">{b.email}</a></li>
        </ul>
      )}
    </section>
  );
}

/** schema.org hours are written in German; other languages show the plain form "Mo-Fr 07:30-16:30". */
// Weekday codes of schema.org openingHours; 1 January 2024 was a Monday, so day n of that week names the weekday.
const DAY_INDEX: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 7 };
/** "Mo-Fr 07:30-16:30" in the page language: German in full sentences, other languages with their own weekday names. */
const hoursText = (lang: Lang) => (spec: string) => {
  if (lang === "de") return germanHours(spec);
  const [days = "", time = ""] = spec.split(" ");
  const day = (code: string) => new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, DAY_INDEX[code] ?? 1)));
  const [from = "", to] = days.split("-");
  return `${day(from)}${to ? ` – ${day(to)}` : ""}, ${time.replace("-", "–")}`;
};

function Benefits({ lang }: { lang: Lang }) {
  return (
    <Reveal labelledBy="benefits-title" className={`${container} py-16`}>
      <SectionTitle id="benefits-title">{ui(lang, "benefitsTitle")}</SectionTitle>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {site.home.benefits.map((b) => (
          <li key={pick(b.title, lang)} className="card p-6">
            <h3 className="text-lg font-semibold">{pick(b.title, lang)}</h3>
            <p className="mt-2 text-muted">{pick(b.text, lang)}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function ServiceList({ lang, limit }: { lang: Lang; limit?: number }) {
  const items = limit ? site.services.items.slice(0, limit) : site.services.items;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((s) => (
        <li key={pick(s.title, lang)} className="card flex flex-col p-6">
          <h3 className="text-lg font-semibold">{pick(s.title, lang)}</h3>
          <p className="mt-2 text-muted">{pick(s.text, lang)}</p>
          {s.price && <p className="mt-auto pt-4 text-base font-semibold">{pick(s.price, lang)}</p>}
        </li>
      ))}
    </ul>
  );
}

function ServicesPreview({ lang }: { lang: Lang }) {
  return (
    <Reveal labelledBy="services-title" className={`${container} py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle id="services-title">{pick(site.services.title, lang)}</SectionTitle>
        {site.services.items.length > 4 && (
          <PageLink path={pathFor("services", lang)} className="btn-ghost text-sm">{ui(lang, "allServices")}<ArrowRight size={16} aria-hidden="true" /></PageLink>
        )}
      </div>
      <div className="mt-8"><ServiceList lang={lang} limit={4} /></div>
    </Reveal>
  );
}

/** Large tagline; each word turns from muted to full colour once it crosses a line at 60 % of the viewport. */
function Tagline({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const words = Array.from(ref.current?.querySelectorAll<HTMLElement>(".tagline-word") ?? []);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      words.forEach((w) => { w.dataset["on"] = ""; });
      return;
    }
    // One scroll listener throttled to a frame; it also lights words that a fast scroll jumped past.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.6;
      let delay = 0;
      for (const word of words) {
        if (word.dataset["on"] === undefined && word.getBoundingClientRect().top < line) {
          word.style.transitionDelay = `${delay}ms`;
          word.dataset["on"] = "";
          delay += 70;
        }
      }
    };
    const onScroll = () => { frame ||= requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [lang]);
  const rows = pick(site.home.tagline, lang).split("\n");
  return (
    <section aria-label={rows.join(" ")} className={`${container} py-24`}>
      <p ref={ref} aria-hidden="true" className="max-w-[680px] text-4xl font-bold sm:text-5xl">
        {rows.map((row, r) => (
          <span key={r} className="block">
            {row.split(" ").map((word, w) => <span key={w} className="tagline-word">{word}{" "}</span>)}
          </span>
        ))}
      </p>
    </section>
  );
}

function Steps({ lang }: { lang: Lang }) {
  return (
    <Reveal labelledBy="steps-title" className={`${container} py-16`}>
      <SectionTitle id="steps-title">{ui(lang, "stepsTitle")}</SectionTitle>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {site.home.steps.map((s, i) => (
          <li key={pick(s.title, lang)} className="card p-6">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent" aria-hidden="true">{i + 1}</span>
            <h3 className="mt-4 text-lg font-semibold">{pick(s.title, lang)}</h3>
            <p className="mt-2 text-muted">{pick(s.text, lang)}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function Faq({ lang }: { lang: Lang }) {
  if (site.home.faq.length === 0) return null;
  return (
    <Reveal labelledBy="faq-title" className={`${container} py-16`}>
      <SectionTitle id="faq-title">{ui(lang, "faqTitle")}</SectionTitle>
      <div className="mt-8 space-y-2">
        {site.home.faq.map((f) => (
          <details key={pick(f.q, lang)} className="card group p-4">
            <summary className="cursor-pointer list-none rounded-lg text-lg font-semibold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {pick(f.q, lang)}
                <span aria-hidden="true" className="text-2xl text-muted transition-transform duration-300 ease-out-soft group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-muted">{pick(f.a, lang)}</p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}

function ContactDetails({ lang }: { lang: Lang }) {
  const b = site.business;
  return (
    <dl className="space-y-4 text-base">
      <div><dt className="text-sm font-semibold text-muted">{ui(lang, "address")}</dt><dd>{b.street}<br />{b.postalCode} {b.city}</dd></div>
      {b.phone && <div><dt className="text-sm font-semibold text-muted">{ui(lang, "phone")}</dt><dd><a href={`tel:${b.phone.replace(/ /g, "")}`} className="rounded-lg hover:underline">{b.phone}</a></dd></div>}
      <div><dt className="text-sm font-semibold text-muted">{ui(lang, "email")}</dt><dd><a href={`mailto:${b.email}`} className="rounded-lg break-all hover:underline">{b.email}</a></dd></div>
      {b.openingHours.length > 0 && <div><dt className="text-sm font-semibold text-muted">{ui(lang, "hours")}</dt><dd>{b.openingHours.map((h) => <span key={h} className="block">{hoursText(lang)(h)}</span>)}</dd></div>}
    </dl>
  );
}

/** The contact block every content page ends with. */
function ContactSection({ lang, title, intro, heading = "h2" }: { lang: Lang; title: string; intro: string; heading?: "h1" | "h2" }) {
  const Heading = heading;
  return (
    <section aria-labelledby="contact-title" className={`${container} grid gap-12 py-16 md:grid-cols-[1fr_1.4fr]`}>
      <div>
        <Heading id="contact-title" className={heading === "h1" ? "text-4xl font-bold sm:text-5xl" : "text-3xl font-bold sm:text-4xl"}>{title}</Heading>
        <p className="mt-4 text-muted">{intro}</p>
        <div className="mt-8"><ContactDetails lang={lang} /></div>
      </div>
      <ContactForm lang={lang} />
    </section>
  );
}

function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className={`${container} pb-8 pt-16`}>
      <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 max-w-[680px] text-lg text-muted">{intro}</p>}
    </header>
  );
}

function LegalPage({ lang, source }: { lang: Lang; source: string }) {
  const note = ui(lang, "legalGermanOnly");
  return (
    <article lang="de" className={`${container} max-w-3xl py-16`}>
      {note && <p lang={lang} className="mb-8 rounded-lg border border-line bg-surface p-4 text-sm text-muted">{note}</p>}
      <Markdown source={source} />
    </article>
  );
}

export function Page({ page, lang }: { page: PageKey; lang: Lang }) {
  const contactTitle = pick(site.contact.title, lang);
  const contactIntro = pick(site.contact.intro, lang);
  switch (page) {
    case "home":
      return (<><Hero lang={lang} /><Benefits lang={lang} /><ServicesPreview lang={lang} /><Tagline lang={lang} /><Steps lang={lang} /><Faq lang={lang} /><ContactSection lang={lang} title={contactTitle} intro={contactIntro} /></>);
    case "services":
      return (
        <>
          <PageHeader title={pick(site.services.title, lang)} intro={pick(site.services.intro, lang)} />
          <section aria-label={pick(site.services.title, lang)} className={`${container} pb-8`}>
            <ServiceList lang={lang} />
            {site.services.priceNote && <p className="mt-4 text-sm text-muted">{pick(site.services.priceNote, lang)}</p>}
          </section>
          <ContactSection lang={lang} title={contactTitle} intro={contactIntro} />
        </>
      );
    case "about":
      return (
        <>
          <PageHeader title={pick(site.about.title, lang)} />
          <section aria-label={pick(site.about.title, lang)} className={`${container} grid gap-12 pb-8 md:grid-cols-[1.4fr_1fr]`}>
            <div className="space-y-4 text-lg text-muted">{pick(site.about.body, lang).split(/\n{2,}/).map((p) => <p key={p}>{p}</p>)}</div>
            <div className="space-y-4">
              {site.about.image && <img src={site.about.image.src} alt={pick(site.about.image.alt, lang)} className="aspect-[4/3] w-full rounded-2xl object-cover" loading="lazy" />}
              {site.about.facts.length > 0 && (
                <dl className="card space-y-4 p-6">
                  {site.about.facts.map((f) => <div key={pick(f.label, lang)}><dt className="text-sm font-semibold text-muted">{pick(f.label, lang)}</dt><dd className="text-base font-semibold">{pick(f.value, lang)}</dd></div>)}
                </dl>
              )}
            </div>
          </section>
          <ContactSection lang={lang} title={contactTitle} intro={contactIntro} />
        </>
      );
    case "contact":
      return <ContactSection lang={lang} title={contactTitle} intro={contactIntro} heading="h1" />;
    case "impressum":
      return <LegalPage lang={lang} source={impressumMarkdown(site)} />;
    case "datenschutz":
      return <LegalPage lang={lang} source={datenschutzMarkdown(site)} />;
  }
}

export function NotFound({ lang }: { lang: Lang }) {
  return (
    <section className={`${container} py-24`}>
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{ui(lang, "notFoundTitle")}</h1>
      <p className="mt-4 max-w-[680px] text-lg text-muted">{ui(lang, "notFoundText")}</p>
      <PageLink path={pathFor("home", lang)} className="btn-primary mt-8">{ui(lang, "backHome")}</PageLink>
    </section>
  );
}
