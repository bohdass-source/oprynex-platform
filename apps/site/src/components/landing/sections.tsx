import {
  ArrowRight, Browser, CalendarCheck, ClipboardText, Hand, Headset, Plus,
  ShoppingBag, ShoppingCart, XCircle,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { openAgent } from "@/components/agent-widget";
import { useLanguage } from "@/components/language-provider";
import { assistants, faq } from "@/lib/content";
import { landing } from "@/lib/landing-copy";
import { offers } from "@/lib/offers";
import { linkFocus, textLink } from "@/components/landing/classes";
import { ProcessSteps } from "@/components/landing/process-steps";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/landing/primitives";
import { Carousel } from "@/components/landing/carousel";
import { OfferCard } from "@/components/offer-card";

type Icon = ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string; "aria-hidden"?: boolean | "true" }>;

export function Problem() {
  const { language: l } = useLanguage();
  const p = landing.problem;
  return (
    <Section>
      <SectionHead eyebrow={p.eyebrow[l]} title={p.title[l]} />
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-lp-line bg-lp-surface p-6 md:p-8">
          <h3 className="text-xl font-semibold text-lp-muted">{p.beforeLabel[l]}</h3>
          <ul className="mt-6 flex flex-col gap-4">
            {p.before.map((item) => (
              <li key={item.de} className="flex items-start gap-3 text-base">
                <XCircle size={24} className="mt-0.5 shrink-0 text-lp-muted" aria-hidden="true" />
                {item[l]}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={100} className="rounded-2xl border border-lp-line bg-lp-raised p-6 md:p-8">
          <h3 className="text-xl font-semibold">{p.afterLabel[l]}</h3>
          <ol className="mt-6 flex flex-col gap-6">
            {p.flow.map((step, i) => (
              <li key={step.title.de} className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lp-fg text-sm font-semibold text-lp-bg">{i + 1}</span>
                <div>
                  <p className="text-base font-semibold">{step.title[l]}</p>
                  <p className="mt-1 text-base text-lp-muted">{step.text[l]}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}

export function Solutions() {
  const { language: l } = useLanguage();
  const s = landing.solutions;
  return (
    <Section id="loesungen">
      <SectionHead eyebrow={s.eyebrow[l]} title={s.title[l]} intro={s.intro[l]} />
      <Carousel label={s.title[l]}>
        {offers.map((offer) => (
          <li key={offer.id} className="flex">
            <OfferCard offer={offer} />
          </li>
        ))}
      </Carousel>
    </Section>
  );
}

// Words switch from muted to full colour one at a time as the block scrolls through the viewport.
// One passive scroll listener, throttled through requestAnimationFrame.
export function Tagline() {
  const { language: l } = useLanguage();
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(0);
  const words = landing.tagline.text[l].split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const total = words.length;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setActive(total); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh * 0.8 - rect.top) / (rect.height + vh * 0.2)));
      setActive(Math.ceil(progress * total));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [words.length, l]);

  return (
    <Section pad="wide">
      <p className="text-sm font-medium text-lp-muted">{landing.tagline.label[l]}</p>
      <p ref={ref} className="mt-4 max-w-[680px] text-4xl font-semibold md:text-5xl" style={{ textWrap: "balance" }}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            <span className="lp-word" data-on={i < active}>{word}</span>{" "}
          </span>
        ))}
      </p>
    </Section>
  );
}

export function Process() {
  const { language: l } = useLanguage();
  const p = landing.process;
  return (
    <Section id="ablauf">
      <SectionHead eyebrow={p.eyebrow[l]} title={p.title[l]} />
      <ProcessSteps />
    </Section>
  );
}

const assistantIcons: Icon[] = [Browser, ShoppingBag, ShoppingCart, ClipboardText, CalendarCheck, Headset];

export function Assistants() {
  const { language: l, t } = useLanguage();
  const a = landing.assistants;
  return (
    <Section>
      <SectionHead eyebrow={a.eyebrow[l]} title={a.title[l]} intro={a.intro[l]} />
      <Carousel label={a.list[l]}>
        {assistants.map((assistant, i) => {
          const Icon = assistantIcons[i] ?? Browser;
          return (
            <li key={assistant.name} className="flex">
              <div className="lp-glow w-full">
              <article className="lp-card flex h-full w-full flex-col rounded-2xl bg-lp-surface p-6 transition-[background-color] duration-500 ease-lp">
                <span className="flex size-10 items-center justify-center rounded-lg border border-lp-line bg-lp-raised"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="mt-6 text-xl font-semibold">{a.names[i]?.[l] ?? t(assistant.name)}</h3>
                <p className="mt-4 text-sm font-medium text-lp-muted">{a.task[l]}</p>
                <p className="mt-1 text-base">{t(assistant.text)}</p>
                <div className="mt-6 flex items-start gap-3 rounded-lg bg-lp-raised p-3">
                  <Hand size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-lp-muted">{a.limit[l]}</p>
                    <p className="mt-1 text-sm">{t(assistant.limit)}</p>
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  <button type="button" onClick={openAgent} className={textLink}>
                    {a.try[l]}
                    <ArrowRight size={16} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              </article>
              </div>
            </li>
          );
        })}
      </Carousel>
      <Reveal className="mt-4">
        <Link to="/assistants" className={textLink}>{a.all[l]}<ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
      </Reveal>
    </Section>
  );
}

export function Pricing() {
  const { language: l } = useLanguage();
  const p = landing.pricing;
  return (
    <Section id="preise">
      <SectionHead eyebrow={p.eyebrow[l]} title={p.title[l]} />
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {p.models.map((model, i) => (
          <Reveal as="li" key={model.name.de} delay={i * 80} className="flex">
            <div className="w-full rounded-2xl border border-lp-line bg-lp-surface p-6 md:p-8">
              <p className="text-sm font-medium text-lp-muted">{model.who[l]}</p>
              <h3 className="mt-2 text-2xl font-semibold">{model.name[l]}</h3>
              <p className="mt-4 text-base text-lp-muted">{model.text[l]}</p>
            </div>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[680px] text-sm text-lp-muted">{p.note[l]}</p>
        <ButtonLink to="/preise" variant="secondary">{p.all[l]}</ButtonLink>
      </Reveal>
    </Section>
  );
}

export function Faq() {
  const { language: l, t } = useLanguage();
  const f = landing.faq;
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SectionHead eyebrow={f.eyebrow[l]} title={f.title[l]} />
        <Reveal className="flex flex-col gap-2">
          {faq.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-lp-line bg-lp-surface px-6 py-4">
              <summary className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg text-base font-semibold ${linkFocus}`}>
                <h3 className="text-base font-semibold">{t(question)}</h3>
                <Plus size={20} className="lp-plus shrink-0" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-base text-lp-muted">{t(answer)}</p>
            </details>
          ))}
          <Link to="/faq" className={`${textLink} mt-4 self-start`}>{f.more[l]}<ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
        </Reveal>
      </div>
    </Section>
  );
}
