import type { ReactNode } from "react";
import { statusLabel, type Status } from "@/lib/content";
import { useLanguage } from "@/components/language-provider";
import { AgentWidget } from "@/components/agent-widget";
import { CookieConsent } from "@/components/cookie-consent";
import { ContactSection } from "@/components/contact-section";

/** Floating assistant and cookie dialog, shared by every page shell. The landing holds the dialog back until its intro has played. */
export function SiteOverlays({ cookies = true }: { cookies?: boolean }) {
  return (
    <>
      <AgentWidget />
      {cookies && <CookieConsent />}
    </>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLanguage();
  const cls = {
    live: "border-status-live text-status-live",
    dev: "border-status-dev/60 text-status-dev",
    custom: "border-status-custom/60 text-status-custom border-dashed",
  }[status];
  return (
    <span className={`gold-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] uppercase tracking-wider ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-status-live" : "bg-transparent border border-current"}`} />
      {t(statusLabel[status])}
    </span>
  );
}

export function Section({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <section className="reveal mx-auto max-w-6xl px-6 py-20">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 max-w-3xl text-4xl md:text-5xl">{title}</h2>
      {intro && <p className="mt-4 max-w-2xl text-muted-foreground">{intro}</p>}
      <div className="mt-12">{children}</div>
    </section>
  );
}

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{text}</p>
      <div className="gold-rule mt-14" />
    </section>
  );
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="live" />
      <StatusBadge status="dev" />
      <StatusBadge status="custom" />
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="gold-card gold-sheen h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold">{children}</div>;
}

/** Closing block of the inner pages: the same promise and contact form as the landing. */
export function ClosingCTA() {
  return <ContactSection />;
}
