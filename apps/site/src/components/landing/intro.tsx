import type { CSSProperties } from "react";
import hero from "@/assets/hero.jpg";
import { useLanguage } from "@/components/language-provider";
import { Emblem } from "@/components/landing/primitives";
import { landing } from "@/lib/landing-copy";
import { INTRO_SEEN_KEY } from "@/components/landing/intro-state";

/** Full screen intro. Server rendered and driven by CSS only, so it also ends by itself without JavaScript. */
export function Intro({ onSkip }: { onSkip: () => void }) {
  const { language: l } = useLanguage();
  const words = landing.hero.title.map((line) => line[l]).join(" ").split(" ");
  return (
    <div className="lp-intro" data-testid="intro">
      {/* Runs while the HTML is parsed, so a returning visitor never sees the intro flash before hydration. */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("${INTRO_SEEN_KEY}")==="1")document.documentElement.setAttribute("data-intro-seen","")}catch(e){}` }} />
      <div className="lp-intro-panel lp-intro-left">
        <img src={hero} alt="" width={1600} height={1000} className="lp-intro-img lp-intro-img-left" />
      </div>
      <div className="lp-intro-panel lp-intro-right">
        <img src={hero} alt="" width={1600} height={1000} className="lp-intro-img lp-intro-img-right" />
      </div>

      <div className="lp-intro-center" aria-hidden="true">
        <div className="lp-intro-logo flex flex-col items-center gap-3">
          <Emblem size={96} />
          <span className="lp-intro-gold text-2xl font-semibold">Oprynex</span>
        </div>
        <p className="mt-8 max-w-[680px] px-4 text-center text-3xl font-semibold md:text-5xl" style={{ "--step": `${Math.min(110, Math.round(600 / words.length))}ms` } as CSSProperties}>
          {words.map((word, i) => (
            <span key={`${word}-${i}`}>
              <span className="lp-intro-word lp-intro-gold" style={{ "--i": i } as CSSProperties}>{word}</span>{" "}
            </span>
          ))}
        </p>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="lp-intro-skip absolute bottom-6 right-6 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition-[background-color] duration-300 ease-lp hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {landing.intro.skip[l]}
      </button>
    </div>
  );
}
