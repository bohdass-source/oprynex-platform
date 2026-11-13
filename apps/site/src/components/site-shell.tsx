import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import { Intro } from "@/components/landing/intro";
import { useIntro } from "@/components/landing/intro-state";
import { SiteNav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteOverlays } from "@/components/site";
import { landing } from "@/lib/landing-copy";
import { captureVisitSource } from "@/lib/visit-source";
import { watchSiteStats } from "@/lib/site-stats";

/**
 * The one shell of every page: floating navigation, the page, the footer, the assistant and the cookie dialog.
 * Everything inside `.lp` shares the flat tokens of landing.css. Only the home page plays the intro, and the
 * cookie dialog waits for it. Scroll animations arm after hydration, so server rendered content is never hidden.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const { language: l } = useLanguage();
  const home = useRouterState({ select: (state) => state.location.pathname === "/" });
  const [motion, setMotion] = useState(false);
  const { playing, skip } = useIntro(home);
  useEffect(() => setMotion(true), []);
  useEffect(captureVisitSource, []);
  useEffect(watchSiteStats, []);
  return (
    <div className="lp min-h-screen" data-motion={motion ? "on" : undefined} data-intro={playing ? "on" : undefined}>
      {playing && <Intro onSkip={skip} />}
      <a href="#main" className="sr-only rounded-lg bg-lp-fg px-3 py-2 text-sm font-semibold text-lp-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">{landing.skip[l]}</a>
      <SiteNav />
      <main id="main" className={home ? undefined : "pt-12"}>{children}</main>
      <SiteFooter />
      <SiteOverlays cookies={!playing} />
    </div>
  );
}
