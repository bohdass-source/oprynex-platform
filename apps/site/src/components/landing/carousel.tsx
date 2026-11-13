import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import { linkFocus } from "@/components/landing/classes";
import { cloneCount, loopTarget, nearestRendered, realIndex } from "@/components/landing/carousel-loop";
import { Reveal } from "@/components/landing/primitives";
import { landing } from "@/lib/landing-copy";
import { AGENT_STATE_EVENT, isAgentOpen } from "@/lib/agent-state";

const arrow = `flex size-10 items-center justify-center rounded-lg border border-lp-line text-lp-fg transition-[background-color,opacity] duration-300 ease-lp hover:bg-lp-raised ${linkFocus}`;

type Ghostable = ReactElement<Record<string, unknown>>;

// A copy of a card for the ends of the row: same look, but hidden from assistive technology and from the keyboard.
const ghost = (card: Ghostable, tag: string) => cloneElement(card, { key: `${String(card.key)}-${tag}`, "aria-hidden": true, inert: true, "data-clone": "" });

/**
 * An endless row of cards that scrolls sideways: swipe, trackpad, the two arrow buttons, the arrow keys on the focused
 * row, or a click on a neighbour. At either end it carries on with the other end, with no stop and no visible jump:
 * copies of the end cards sit beyond the real ones, and once the row has come to rest on a copy it is moved, unseen,
 * onto the matching real card (see carousel-loop.ts).
 *
 * variant "cards": cards snap to the middle of a frame; the middle one is raised, its neighbours shrink and dim.
 * variant "slides": one full width slide at a time, with dots.
 * autoplay (ms): moves on by itself. It stands still while the pointer or the keyboard focus is inside, while a finger
 * is down, while the page or the row is out of view, while the assistant window is open, after the visitor pressed pause, and with reduced motion.
 * Children are the <li> cards.
 */
export function Carousel({ label, children, variant = "cards", dots, className = "", autoplay }: { label: string; children: ReactNode; variant?: "cards" | "slides"; dots?: string[]; className?: string; autoplay?: number }) {
  const { language: l } = useLanguage();
  const items = Children.toArray(children).filter(isValidElement) as Ghostable[];
  const n = items.length;
  const k = cloneCount(n);
  const start = variant === "cards" ? Math.min(1, Math.max(0, n - 1)) : 0; // cards open on the second card
  const rendered = [...items.slice(n - k).map((card) => ghost(card, "pre")), ...items, ...items.slice(0, k).map((card) => ghost(card, "post"))];

  const scroller = useRef<HTMLUListElement>(null);
  const middle = useRef(k + start); // rendered index of the card in the middle of the row
  const holding = useRef(false);
  const settle = useRef(0);
  const [active, setActive] = useState(start);
  const [userPaused, setUserPaused] = useState(false);
  const [engaged, setEngaged] = useState(false); // pointer or focus inside, or a finger down
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [chatting, setChatting] = useState(false); // the assistant window is open

  const cards = useCallback(() => Array.from(scroller.current?.children ?? []) as HTMLElement[], []);
  const centre = (el: HTMLElement, card: HTMLElement) => card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;

  // Marks the card nearest the middle as active. Writes data-active straight to the cards so scrolling never re-renders them.
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const list = cards();
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    list.forEach((card, i) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
      if (distance < bestDistance) { best = i; bestDistance = distance; }
    });
    if (best !== middle.current || !list.some((card) => card.dataset["active"] === "true")) {
      list.forEach((card, i) => { card.dataset["active"] = String(i === best); });
    }
    middle.current = best;
    setActive(realIndex(best, n, k));
  }, [cards, n, k]);

  // Once the row rests on a copy, move it onto the matching real card. Snapping is paused for that one frame.
  const normalize = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const target = loopTarget(middle.current, n, k);
    if (target === null) return;
    const list = cards();
    const from = list[middle.current];
    const to = list[target];
    if (!from || !to) return;
    el.style.scrollSnapType = "none";
    el.scrollLeft += to.offsetLeft - from.offsetLeft;
    requestAnimationFrame(() => { el.style.scrollSnapType = ""; measure(); });
  }, [cards, measure, n, k]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const schedule = () => { window.clearTimeout(settle.current); if (!holding.current) settle.current = window.setTimeout(normalize, 140); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); }); schedule(); };
    const down = () => { holding.current = true; window.clearTimeout(settle.current); };
    const up = () => { holding.current = false; schedule(); };
    const first = el.children[k + start] as HTMLElement | undefined;
    if (first) el.scrollLeft = centre(el, first); // opens on the first slide or the second card, never on a copy
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchend", up, { passive: true });
    el.addEventListener("touchcancel", up, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchend", up);
      el.removeEventListener("touchcancel", up);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(settle.current);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure, normalize, k, start]);

  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const onVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    const onAgent = () => setChatting(isAgentOpen());
    onAgent();
    window.addEventListener(AGENT_STATE_EVENT, onAgent);
    const el = scroller.current;
    const observer = autoplay && el && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => setInView(entries.some((entry) => entry.isIntersecting)), { threshold: 0.3 }) : null;
    if (el) observer?.observe(el);
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener(AGENT_STATE_EVENT, onAgent); observer?.disconnect(); };
  }, [autoplay]);

  // Every change of the middle card (also a manual one) starts the countdown again, so a visitor who moves on by hand is not rushed.
  useEffect(() => {
    if (!autoplay || reduced || userPaused || engaged || chatting || !inView || !pageVisible) return;
    const timer = window.setTimeout(() => goTo(middle.current + 1), autoplay);
    return () => window.clearTimeout(timer);
  }, [autoplay, reduced, userPaused, engaged, chatting, inView, pageVisible, active]); // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(index: number) {
    const el = scroller.current;
    const list = cards();
    const card = list[Math.min(Math.max(index, 0), Math.max(0, list.length - 1))];
    if (!el || !card) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    el.scrollTo?.({ left: centre(el, card), behavior: reduced ? "auto" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(middle.current + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(middle.current - 1); }
  }

  // Clicking a card that is not in the middle brings it there; links and buttons inside keep working.
  function onClick(event: MouseEvent<HTMLUListElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    let card: HTMLElement | null = target;
    while (card && card.parentElement !== scroller.current) card = card.parentElement;
    const index = card ? cards().indexOf(card) : -1;
    if (index >= 0 && index !== middle.current) goTo(index);
  }

  const row = (
    <ul ref={scroller} tabIndex={0} aria-label={label} onKeyDown={onKeyDown} onClick={onClick} className={`lp-carousel lp-carousel--${variant} ${variant === "cards" ? "rounded-3xl" : "rounded-2xl"} ${linkFocus}`}>
      {rendered}
    </ul>
  );
  const controls = (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button type="button" className={arrow} onClick={() => goTo(middle.current - 1)} aria-label={landing.carousel.prev[l]}><CaretLeft size={20} weight="bold" aria-hidden="true" /></button>
      {dots && (
        <div role="group" aria-label={label} className="flex items-center">
          {dots.map((name, r) => (
            <button key={name} type="button" onClick={() => goTo(nearestRendered(r, middle.current, n, k))} aria-label={name} aria-current={r === active ? "true" : undefined} className={`flex size-6 items-center justify-center rounded-full ${linkFocus}`}>
              <span className={`size-2 rounded-full transition-colors duration-300 ease-lp ${r === active ? "bg-lp-fg" : "bg-lp-line"}`} />
            </button>
          ))}
        </div>
      )}
      <button type="button" className={arrow} onClick={() => goTo(middle.current + 1)} aria-label={landing.carousel.next[l]}><CaretRight size={20} weight="bold" aria-hidden="true" /></button>
      {autoplay && !reduced && (
        <button type="button" className={arrow} onClick={() => setUserPaused((value) => !value)} aria-pressed={userPaused} aria-label={userPaused ? landing.carousel.play[l] : landing.carousel.pause[l]}>
          {userPaused ? <Play size={20} weight="bold" aria-hidden="true" /> : <Pause size={20} weight="bold" aria-hidden="true" />}
        </button>
      )}
    </div>
  );

  if (variant === "slides") {
    return (
      <div
        className={className}
        onMouseEnter={() => setEngaged(true)}
        onMouseLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false); }}
        onTouchStart={() => setEngaged(true)}
        onTouchEnd={() => setEngaged(false)}
        onTouchCancel={() => setEngaged(false)}
      >
        {row}
        {controls}
      </div>
    );
  }
  return (
    <Reveal className={`mt-12 ${className}`}>
      <div className="rounded-3xl border border-lp-line bg-lp-bg">{row}</div>
      {controls}
    </Reveal>
  );
}
