import { ArrowRight, ArrowsLeftRight, Browser, Check, CheckCircle, Cloud, Database, LockKey, SealCheck, UserSwitch, UsersThree } from "@phosphor-icons/react";
import { Fragment, useState, type CSSProperties } from "react";
import heroImage from "@/assets/hero.jpg";
import { AskAgentButton } from "@/components/agent-widget";
import { useLanguage } from "@/components/language-provider";
import { Carousel } from "@/components/landing/carousel";
import { offerIcons } from "@/components/landing/offer-icons";
import { ButtonLink, Emblem } from "@/components/landing/primitives";
import { landing, solutionCopy, type Example } from "@/lib/landing-copy";
import { categoryLabel, offers, trackConversion } from "@/lib/offers";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Bubble({ side, children, clamp }: { side: "visitor" | "assistant"; children: string; clamp?: boolean }) {
  const visitor = side === "visitor";
  return (
    <div className={`flex ${visitor ? "justify-end" : "justify-start gap-2"}`}>
      {!visitor && <Emblem size={24} className="mt-1" />}
      <p className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${visitor ? "bg-lp-fg text-lp-bg" : "bg-lp-raised"}`}>{clamp ? <span className="line-clamp-2">{children}</span> : children}</p>
    </div>
  );
}

// Four steps of a case: the first two are done, the third is under way, the last is still ahead.
function Steps({ steps, columns }: { steps: Example["right"]["steps"]; columns?: boolean }) {
  const { language: l } = useLanguage();
  return (
    <ol className={columns ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
      {steps.map((step, i) => {
        const state = i < 2 ? "done" : i === 2 ? "now" : "next";
        return (
          <li key={step.de} aria-current={state === "now" ? "step" : undefined} className={`flex items-center gap-2 text-sm ${state === "next" ? "text-lp-muted" : "font-medium"}`}>
            {state === "done" ? <CheckCircle size={20} weight="fill" className="shrink-0" aria-hidden="true" /> : <span aria-hidden="true" className={`size-5 shrink-0 rounded-full border-2 ${state === "now" ? "border-lp-fg bg-lp-hover" : "border-lp-line"}`} />}
            {step[l]}
          </li>
        );
      })}
    </ol>
  );
}

// Illustration of one case, not a screenshot. Top: what the customer sees. Below: what happens on your side.
function Detail({ example }: { example: Example }) {
  const { language: l } = useLanguage();
  const { left, right } = example;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-2xl border border-lp-line bg-lp-raised/60 p-3 text-left">
        <div className="flex items-center gap-2 text-sm font-medium text-lp-muted"><Browser size={20} aria-hidden="true" />{left.label[l]}</div>
        {left.rows.map((row) =>
          row.kind === "tag" ? (
            <p key={row.text.de} className="flex items-center gap-2 self-start rounded-lg border border-lp-line px-3 py-2 text-sm font-medium"><ArrowsLeftRight size={16} className="shrink-0" aria-hidden="true" />{row.text[l]}</p>
          ) : (
            <Bubble key={row.text.de} side={row.kind}>{row.text[l]}</Bubble>
          ),
        )}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-lp-line bg-lp-raised/60 p-3 text-left">
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-lp-muted">
          <span className="flex items-center gap-2"><Emblem size={20} />{right.label[l]}</span>
          <span className="flex items-center gap-2 truncate"><UsersThree size={16} className="shrink-0" aria-hidden="true" /><span className="truncate">{right.meta[l]}</span></span>
        </div>
        <Steps steps={right.steps} columns />
      </div>
    </div>
  );
}

/**
 * Project card for one case. Three views of the same case: a short overview, the key points and the detailed example.
 * The chosen view stays when the carousel moves on to the next case.
 */
function CaseCard({ example, tab, onTab }: { example: Example; tab: number; onTab: (index: number) => void }) {
  const { language: l } = useLanguage();
  const offer = offers.find((item) => item.id === example.id);
  const Icon = offerIcons[example.id] ?? Cloud;
  const label = offer ? solutionCopy(offer).label[l] : example.id;
  const heading = example.caption[l].replace(/^[^:]+:\s*/, "");
  return (
    <div className="flex h-full w-full flex-col rounded-3xl border border-lp-line bg-lp-surface/80 p-5 text-left backdrop-blur-md md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-lp-line bg-lp-raised"><Icon size={24} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{label}</p>
          {offer && <p className="text-sm text-lp-muted">{categoryLabel[offer.category][l]}</p>}
        </div>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{heading.charAt(0).toUpperCase() + heading.slice(1)}</h2>

      <div role="group" aria-label={landing.caseCard.views[l]} className="mt-4 flex gap-0.5 rounded-lg bg-lp-raised p-0.5">
        {landing.caseCard.tabs.map((name, i) => (
          <button
            key={name.de}
            type="button"
            aria-pressed={tab === i}
            onClick={() => onTab(i)}
            className={`flex-1 rounded-md px-2 py-1 text-sm font-semibold transition-[background-color,color] duration-300 ease-lp focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-fg ${tab === i ? "bg-lp-fg text-lp-bg" : "text-lp-muted hover:text-lp-fg"}`}
          >
            {name[l]}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[22rem] flex-1">
        {tab === 0 && (
          <div className="flex h-full flex-col gap-4">
            <p className="text-base">{example.overview[l]}</p>
            <div className="flex flex-col gap-2 rounded-2xl border border-lp-line bg-lp-raised/60 p-3">
              {example.left.rows.filter((row) => row.kind !== "tag").slice(0, 2).map((row) => (
                <Bubble key={row.text.de} side={row.kind as "visitor" | "assistant"} clamp>{row.text[l]}</Bubble>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-sm font-medium text-lp-muted">{landing.caseCard.steps[l]}</p>
              <div className="mt-3"><Steps steps={example.right.steps} columns /></div>
            </div>
          </div>
        )}
        {tab === 1 && offer && (
          <div className="flex h-full flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {offer.included.map((item) => (
                <li key={item.de} className="flex items-start gap-2 text-base"><Check size={20} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />{item[l]}</li>
              ))}
            </ul>
            <p className="rounded-lg bg-lp-raised px-3 py-2 text-sm text-lp-muted"><span className="font-semibold text-lp-fg">{landing.solutions.fitLabel[l]}:</span> {solutionCopy(offer).fit[l]}</p>
            <p className="mt-auto text-xl font-semibold">{offer.price[l]}</p>
          </div>
        )}
        {tab === 2 && <Detail example={example} />}
      </div>
    </div>
  );
}

function HeroExamples() {
  const { language: l } = useLanguage();
  const [tab, setTab] = useState(0);
  const names = landing.examples.map((example) => landing.solutions.items[example.id]?.label[l] ?? example.id);
  return (
    <Carousel variant="slides" autoplay={3000} label={landing.heroExamplesLabel[l]} dots={names} className="lp-enter w-full min-w-0">
      {landing.examples.map((example) => (
        <li key={example.id} className="flex">
          <CaseCard example={example} tab={tab} onTab={setTab} />
        </li>
      ))}
    </Carousel>
  );
}

const trustIcons = { approved: SealCheck, handover: UserSwitch, data: Database, consent: LockKey } as const;

// The four promises, at the foot of the first screen.
function TrustStrip() {
  const { language: l } = useLanguage();
  return (
    <ul className="lp-enter mt-10 grid gap-6 rounded-2xl border border-lp-line bg-lp-surface/70 p-6 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4" style={delay(600)}>
      {landing.trust.map((item) => {
        const Icon = trustIcons[item.icon as keyof typeof trustIcons];
        return (
          <li key={item.icon} className="flex items-start gap-3">
            <Icon size={24} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{item.text[l]}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function Hero() {
  const { language: l } = useLanguage();
  const h = landing.hero;
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-12 pt-28 md:px-6 md:pb-16 md:pt-28">
      <div className="lp-hero-bg" aria-hidden="true">
        <img src={heroImage} alt="" width={1600} height={1000} fetchPriority="high" className="lp-hero-img" />
        <div className="absolute inset-0 bg-lp-bg/45" />
      </div>
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex max-w-[680px] flex-col items-start text-left">
            <p className="lp-enter rounded-full border border-lp-line bg-lp-surface/70 px-3 py-1 text-sm font-medium text-lp-muted backdrop-blur-md">{h.badge[l]}</p>
            <h1 className="lp-enter lp-hero-title mt-6 pb-2 text-3xl min-[420px]:text-4xl" style={delay(80)}>
              {h.title.map((line, i) => (
                <Fragment key={line.de}>
                  {i > 0 && " "}
                  <span className="block">{line[l]}</span>
                </Fragment>
              ))}
            </h1>
            <p className="lp-enter lp-hero-sub mt-6 text-lg" style={delay(160)}>{h.sub[l]}</p>
            <div className="lp-enter mt-8 flex flex-wrap items-center gap-4" style={delay(240)}>
              <ButtonLink to="/contact" onClick={() => trackConversion("project", "hero_cta")}>
                {landing.cta[l]}
                <ArrowRight size={20} weight="bold" aria-hidden="true" />
              </ButtonLink>
              <AskAgentButton />
            </div>
          </div>
          <HeroExamples />
        </div>
        <TrustStrip />
      </div>
    </section>
  );
}
