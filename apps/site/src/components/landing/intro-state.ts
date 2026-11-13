import { useEffect, useState } from "react";

// Length of both sequences. Keep in step with the delays in landing.css (.lp-intro and its children):
//   sequence 1, 0.1s to 1.5s: the slogan builds word by word, then the logo appears
//   sequence 2, 1.3s to 2.6s: pictures appear on both sides, then the screen opens like double doors
export const INTRO_MS = 2700;

// The intro plays on the first visit only; afterwards this browser skips it (also before hydration, see intro.tsx).
export const INTRO_SEEN_KEY = "oprynex-intro-seen";
function introSeen() { try { return localStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch { return false; } }
/** Not strictly necessary for the site, so it is stored only after acceptance (§ 25 TDDDG) and removed on rejection. */
export function rememberIntro(accepted: boolean) {
  try { if (accepted) localStorage.setItem(INTRO_SEEN_KEY, "1"); else localStorage.removeItem(INTRO_SEEN_KEY); } catch { /* Private mode: the intro may play again. */ }
}

// Module state, so the intro plays once per page load and not again on in-app navigation back to "/".
export const introState = { played: false };

// `enabled` is read once, on the first render: a page that is not the home page never plays it.
export function useIntro(enabled: boolean) {
  const [playing, setPlaying] = useState(enabled && !introState.played);
  useEffect(() => {
    if (!playing) return;
    introState.played = true;
    if (introSeen() || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setPlaying(false); return; }
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const timer = window.setTimeout(() => setPlaying(false), INTRO_MS);
    return () => { window.clearTimeout(timer); root.style.overflow = previous; };
  }, [playing]);
  return { playing, skip: () => setPlaying(false) };
}
