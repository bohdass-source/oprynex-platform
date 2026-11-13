import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/language-provider";
import { Carousel } from "@/components/landing/carousel";
import { cloneCount, LOOP_CLONES, loopTarget, nearestRendered, realIndex } from "@/components/landing/carousel-loop";
import { INTRO_SEEN_KEY, introState, rememberIntro } from "@/components/landing/intro-state";
import { SiteShell } from "@/components/site-shell";
import { setAgentOpen } from "@/lib/agent-state";
import { assistants, faq, industries } from "@/lib/content";
import { landing } from "@/lib/landing-copy";
import { offers, type L } from "@/lib/offers";
import { Route as IndexRoute } from "@/routes/index";
import { Route as IndustriesRoute } from "@/routes/industries";

// jsdom has no ResizeObserver; the Radix checkbox of the contact form and the process line observe their size.
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

// The floating assistant and the cookie dialog have their own tests; here the stub only reports whether the
// landing allows the cookie dialog yet.
vi.mock("@/components/site", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/site")>()),
  SiteOverlays: ({ cookies = true }: { cookies?: boolean }) => (cookies ? <p data-testid="cookies">cookie dialog</p> : null),
}));

function collect(value: unknown, out: L[] = []): L[] {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["de"] === "string" && typeof record["ru"] === "string" && typeof record["en"] === "string") out.push(record as unknown as L);
    else for (const child of Object.values(record)) collect(child, out);
  }
  return out;
}

async function mount(page?: { path: string; component: () => ReactNode }) {
  const root = createRootRoute({
    component: () => (
      <LanguageProvider>
        <SiteShell>
          <Outlet />
        </SiteShell>
      </LanguageProvider>
    ),
  });
  const home = createRoute({ getParentRoute: () => root, path: "/", component: IndexRoute.options.component! });
  const contact = createRoute({ getParentRoute: () => root, path: "/contact", component: () => <p>contact</p> });
  const extra = page ? [createRoute({ getParentRoute: () => root, path: page.path, component: page.component })] : [];
  const router = createRouter({ routeTree: root.addChildren([home, contact, ...extra]), history: createMemoryHistory({ initialEntries: [page?.path ?? "/"] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const card0 = (cards: HTMLElement[]) => cards[0]!;

afterEach(() => {
  cleanup();
  document.documentElement.className = "";
  document.documentElement.style.overflow = "";
  introState.played = false;
  localStorage.removeItem(INTRO_SEEN_KEY);
  document.documentElement.removeAttribute("data-intro-seen");
});

describe("landing copy", () => {
  const strings = collect(landing).flatMap((entry) => [entry.ru, entry.de, entry.en]);
  // The badge, headline and subline of the hero are the owner's own wording and keep their hyphens.
  const ruleStrings = collect({ ...landing, hero: {} }).flatMap((entry) => [entry.ru, entry.de, entry.en]);

  it("follows the copy rules: no hyphens, no exclamation marks, no banned filler", () => {
    expect(ruleStrings.length).toBeGreaterThan(100);
    for (const text of ruleStrings) {
      expect(text, text).not.toMatch(/-/);
      expect(text, text).not.toMatch(/!/);
      expect(text, text).not.toMatch(/revolutioni|supercharge|cutting edge|effortless|world class|harness the power/i);
    }
  });

  it("covers every offer in the registry with its own landing text", () => {
    for (const offer of offers) expect(landing.solutions.items[offer.id], offer.id).toBeDefined();
  });

  it("has one assistant name per assistant in the shared content", () => {
    expect(landing.assistants.names).toHaveLength(assistants.length);
  });

  it("keeps the placeholder price out of the page copy", () => {
    expect(strings.some((text) => text.includes("XXX"))).toBe(false);
  });
});

describe("landing page", () => {
  it("opens in German with one h1, one main landmark and a single primary call to action in the hero", async () => {
    await mount();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("KI-Chatbots, CRM und Websites für Unternehmen");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(document.documentElement.lang).toBe("de");

    const hero = document.getElementById("top")!;
    const links = within(hero).getAllByRole("link", { name: /Aufgabe besprechen/ });
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute("href")).toBe("/contact");
    expect(hero.textContent).not.toContain("Persönliche Antwort von Montag bis Samstag"); // the line under the buttons is gone
    // The four promises sit at the foot of the first screen, inside the hero.
    for (const item of landing.trust) expect(within(hero).getByText(item.text.de)).toBeDefined();
    // Beside it, the assistant button with the same glowing ring as the one in the corner.
    expect(within(hero).getByRole("button", { name: /KI-Assistent fragen/ }).closest(".agent-shell")).not.toBeNull();
  });

  it("links every offer to its own page and renders the shared FAQ", async () => {
    await mount();
    const solutions = document.getElementById("loesungen")!;
    for (const offer of offers) {
      expect(solutions.querySelector(`a[href="${offer.path}"]`), offer.path).not.toBeNull();
    }
    expect(document.querySelectorAll("#faq details")).toHaveLength(faq.length);
  });

  it("switches language in place without changing the route", async () => {
    await mount();
    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]!);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("AI chatbots, CRM and websites for business"));
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(screen.getAllByRole("button", { name: "RU" })[0]!);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("AI-чатботы, CRM и сайты для бизнеса"));
  });

  it("opens and closes the mobile menu with a state aware toggle", async () => {
    await mount();
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Menü schließen" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Menü öffnen" }).getAttribute("aria-expanded")).toBe("false"));
  });

  it("lists the six offers as cards in a row that scrolls sideways", async () => {
    await mount();
    const list = screen.getByRole("list", { name: landing.solutions.title.de });
    expect(list.className).toContain("lp-carousel");
    expect(list.querySelectorAll(":scope > li:not([data-clone])")).toHaveLength(offers.length);
    // Copies of the end cards sit at both ends so the row can run on without a stop; they are hidden from assistive technology.
    const copies = list.querySelectorAll<HTMLElement>(":scope > li[data-clone]");
    expect(copies).toHaveLength(2 * LOOP_CLONES);
    for (const copy of copies) expect(copy.getAttribute("aria-hidden")).toBe("true");
    for (const offer of offers) expect(list.querySelector(`a[href="${offer.path}"]`), offer.path).not.toBeNull();
    // The row never ends, so neither arrow is ever disabled. Three rows: the hero examples, the offers, the assistants.
    expect(screen.getAllByRole("button", { name: "Zurück" })[0]!.hasAttribute("disabled")).toBe(false);
    expect(screen.getAllByRole("button", { name: "Weiter" })).toHaveLength(3);
  });

  it("opens the card rows on the second card", async () => {
    const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetLeft");
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const client = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", { configurable: true, get() { return Array.from((this as HTMLElement).parentElement?.children ?? []).indexOf(this as HTMLElement) * 400; } });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 300 });
    Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, get: () => 300 });
    try {
      await mount();
      const list = screen.getByRole("list", { name: landing.solutions.title.de });
      // The second real card sits after the copies: offsetLeft (LOOP_CLONES + 1) * 400 + half its width 150 - half the row 150.
      expect(list.scrollLeft).toBe((LOOP_CLONES + 1) * 400);
      // The hero examples open on the first slide.
      expect(screen.getByRole("list", { name: landing.heroExamplesLabel.de }).scrollLeft).toBe(LOOP_CLONES * 400);
    } finally {
      if (offset) Object.defineProperty(HTMLElement.prototype, "offsetLeft", offset);
      if (width) Object.defineProperty(HTMLElement.prototype, "offsetWidth", width);
      if (client) Object.defineProperty(Element.prototype, "clientWidth", client);
    }
  });

  it("shows every assistant as a card with its task and its limit", async () => {
    await mount();
    const list = screen.getByRole("list", { name: landing.assistants.list.de });
    const real = Array.from(list.querySelectorAll<HTMLElement>(":scope > li:not([data-clone])"));
    expect(real).toHaveLength(assistants.length);
    for (const card of real) expect(within(card).getByText("Grenze")).toBeDefined();
    expect(card0(real).closest(".lp-glow") ?? real[0]!.querySelector(".lp-glow")).not.toBeNull(); // the glowing ring, like the assistant button
    expect(within(list).getByRole("heading", { name: "Assistent für den Support" })).toBeDefined();
  });

  it("marks one card as the raised one and brings a clicked neighbour to the middle", async () => {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo as unknown as typeof HTMLElement.prototype.scrollTo;
    await mount();
    const list = screen.getByRole("list", { name: landing.solutions.title.de });
    const cards = Array.from(list.querySelectorAll<HTMLElement>(":scope > li"));
    expect(cards).toHaveLength(offers.length + 2 * LOOP_CLONES);
    expect(cards.filter((card) => card.dataset["active"] === "true")).toHaveLength(1);
    // A click on plain card text selects that card; the arrows and links keep their own behaviour.
    fireEvent.click(cards[LOOP_CLONES + 2]!.querySelector("p")!);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("puts the photograph behind the hero and keeps the headline text on the left", async () => {
    await mount();
    const hero = document.getElementById("top")!;
    expect(hero.querySelector(".lp-hero-bg img")).not.toBeNull();
    expect(hero.querySelector(".text-left h1")).not.toBeNull();
  });

  it("links the pages of the site from the navigation and keeps the original footer", async () => {
    await mount();
    const nav = document.querySelector("header nav")!;
    for (const href of ["/assistants", "/industries", "/services", "/preise", "/faq"]) {
      expect(nav.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    }
    const footer = document.querySelector("footer")!;
    for (const href of ["/contact", "/impressum", "/datenschutz", "/agb", "/avv"]) {
      expect(footer.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    }
    expect(footer.querySelectorAll("dt")).toHaveLength(2); // address and email, as before
    expect(footer.textContent).toContain("Max Mustermann");
  });

  it("turns an offer card over to show what is included and the price", async () => {
    await mount();
    const list = screen.getByRole("list", { name: landing.solutions.title.de });
    const card = list.querySelector<HTMLElement>(":scope > li:not([data-clone]) .lp-flip")!;
    expect(card.dataset["flipped"]).toBe("false");
    expect(card.textContent).toContain("KI-Lösung"); // the category label stays on the card
    expect(card.closest(".lp-glow")).not.toBeNull(); // glowing ring like the assistant button
    expect(card.querySelector(".lp-flip-face:not(.lp-flip-back) a")).toBeNull(); // no "learn more", no link on the front
    expect(card.textContent).not.toMatch(/Mehr erfahren/);
    fireEvent.click(within(card).getByRole("button", { name: /Preise & Leistungen/ }));
    expect(card.dataset["flipped"]).toBe("true");
    expect(card.querySelector(".lp-flip-back")!.hasAttribute("inert")).toBe(false);
    expect(within(card).getByText(offers[0]!.included[0]!.de)).toBeDefined();
  });

  it("ends the page with the contact form and validates it before sending", async () => {
    await mount();
    const form = document.querySelector<HTMLFormElement>("#kontakt form")!;
    expect(form).not.toBeNull();
    fireEvent.submit(form);
    await waitFor(() => expect(form.querySelectorAll(".text-destructive").length).toBeGreaterThanOrEqual(3));
  });

  it("joins the three process steps with dots on one dashed line", async () => {
    await mount();
    const process = document.getElementById("ablauf")!;
    expect(process.querySelectorAll(".lp-dot")).toHaveLength(landing.process.steps.length);
    expect(process.querySelectorAll(".lp-step")).toHaveLength(landing.process.steps.length);
    expect(process.querySelectorAll("svg line")).toHaveLength(2);
  });

  it("toggles the light theme and remembers it in the browser", async () => {
    await mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Helles Design aktivieren" })[0]!);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("oprynex-theme")).toBe("light");
    localStorage.removeItem("oprynex-theme");
  });
});

describe("industries page", () => {
  it("shows every industry card inside the same turning light ring as the assistant button", async () => {
    await mount({ path: "/industries", component: IndustriesRoute.options.component! as () => ReactNode });
    const rings = document.querySelectorAll("main .lp-glow");
    expect(rings).toHaveLength(industries.length);
    for (const ring of rings) expect(ring.querySelector("article h3")).not.toBeNull();
  });
});

describe("landing stylesheet", () => {
  const css = readFileSync("src/landing.css", "utf8");

  // A careless edit once removed a whole block of rules without any test noticing; keep the load bearing ones pinned.
  it.each([
    [".lp-flip-face", "the two faces of an offer card sit on top of each other"],
    [".lp-flip-inner", "the offer card turns over"],
    [".lp .gold-card", "the inner pages keep their flat cards"],
    [".lp .eyebrow", "the inner pages keep their small headings"],
    [".lp-glow::before", "the light ring turns by transform"],
    [".lp-carousel > li", "the cards of a row keep their width and snapping"],
    [".lp-carousel--slides", "the hero examples are full width slides"],
    [".lp-intro", "the intro covers the page"],
    [".lp-intro-gold", "the intro slogan is gold"],
    [".lp-menu", "the mobile menu opens"],
    [".lp-dot", "the process dots"],
  ])("keeps the rules for %s (%s)", (selector) => {
    expect(css).toContain(selector);
  });

  it("turns the light ring with a transform and never animates a custom property on the cards", () => {
    expect(css).toMatch(/@keyframes lp-ring-turn[\s\S]*rotate\(360deg\)/);
    expect(css).not.toMatch(/\.lp-glow\s*\{[^}]*animation:\s*agent-spin/);
  });

  it("keeps the light theme black and white, with bright gold only for what glows", () => {
    const light = css.slice(css.indexOf("html:root.light:has(.lp)"), css.indexOf("/* One typeface:"));
    const hex = (name: string) => new RegExp(`--lp-${name}:\\s*(#[0-9a-f]{6})`).exec(light)?.[1] ?? "";
    expect(hex("bg")).toBe("#ffffff");
    expect(hex("fg")).toBe("#000000"); // all type is black
    expect(hex("gold")).toBe("#dba812"); // used by the rings and the assistant button only
    // No fill in the components is gold any more.
    for (const file of ["src/components/landing/classes.ts", "src/components/landing/nav.tsx", "src/components/landing/hero.tsx", "src/components/site-shell.tsx"]) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/bg-lp-gold|text-lp-on-gold/);
    }
  });

  it("makes the hero subline a full white with a soft shadow", () => {
    expect(css).toMatch(/\.lp-hero-sub\s*\{[^}]*color:\s*var\(--lp-fg\)[^}]*text-shadow/);
  });
});

describe("endless carousel", () => {
  it("jumps from a copy to the matching real card, and leaves real cards alone", () => {
    const n = 6;
    const k = cloneCount(n);
    expect(k).toBe(LOOP_CLONES);
    for (let index = k; index < k + n; index += 1) expect(loopTarget(index, n, k)).toBeNull();
    expect(loopTarget(k - 1, n, k)).toBe(k - 1 + n); // a copy before the first card -> the same card at the end of the run
    expect(loopTarget(0, n, k)).toBe(n);
    expect(loopTarget(k + n, n, k)).toBe(k); // a copy after the last card -> the first real card
    expect(loopTarget(k + n + k - 1, n, k)).toBe(2 * k - 1); // the last copy shows the real card number k
  });

  it("shows the same card after a jump", () => {
    const n = 6;
    const k = cloneCount(n);
    for (let index = 0; index < n + 2 * k; index += 1) {
      const target = loopTarget(index, n, k);
      if (target !== null) expect(realIndex(target, n, k)).toBe(realIndex(index, n, k));
    }
  });

  it("has no copies for a single card and never more copies than cards", () => {
    expect(cloneCount(1)).toBe(0);
    expect(loopTarget(0, 1, 0)).toBeNull();
    expect(cloneCount(2)).toBe(2);
  });

  it("goes to a dot by the shortest way round", () => {
    const n = 6;
    const k = cloneCount(n);
    // Resting on the last real card (rendered k + 5), the dot for the first card is the copy right after it, not the far one.
    expect(nearestRendered(0, k + 5, n, k)).toBe(k + n);
    // Resting on the first real card, the dot for the last card is the copy right before it.
    expect(nearestRendered(5, k, n, k)).toBe(k - 1);
  });

  it("shows one project card per product beside the headline, with three views and a view that stays", async () => {
    await mount();
    const hero = document.getElementById("top")!;
    const slides = Array.from(hero.querySelectorAll<HTMLElement>(".lp-carousel--slides > li:not([data-clone])"));
    expect(slides).toHaveLength(offers.length);
    expect(landing.examples.map((example) => example.id)).toEqual(offers.map((offer) => offer.id));
    expect(slides[0]!.textContent).toContain("on der Besucherfrage zur Antwort aus Ihren Inhalten");
    // Overview first: a short text and the four steps.
    for (const slide of slides) {
      expect(within(slide).getAllByRole("button", { name: /Überblick|Wichtige Punkte|Im Detail/ })).toHaveLength(3);
      expect(slide.querySelectorAll("ol > li")).toHaveLength(4);
    }
    // The chosen view stays when the row moves on to the next case: every card switches.
    fireEvent.click(within(slides[0]!).getByRole("button", { name: "Im Detail" }));
    for (const [i, slide] of slides.entries()) {
      expect(within(slide).getByRole("button", { name: "Im Detail" }).getAttribute("aria-pressed")).toBe("true");
      expect(slide.textContent).toContain(landing.examples[i]!.left.label.de); // the window of what the customer sees
    }
    fireEvent.click(within(slides[1]!).getByRole("button", { name: "Wichtige Punkte" }));
    expect(slides[2]!.textContent).toContain(offers[2]!.included[0]!.de);
    expect(within(hero).getAllByRole("button", { name: "Weiter" })).toHaveLength(1);
    expect(within(hero).getByRole("button", { name: landing.carousel.pause.de }).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("carousel autoplay", () => {
  function setup() {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo as unknown as typeof HTMLElement.prototype.scrollTo;
    vi.useFakeTimers();
    const view = render(<Carousel variant="slides" label="demo" autoplay={100}><li key="a">a</li><li key="b">b</li><li key="c">c</li></Carousel>);
    return { scrollTo, wrapper: view.container.firstElementChild as HTMLElement };
  }
  afterEach(() => { vi.useRealTimers(); });

  it("moves on by itself", () => {
    const { scrollTo } = setup();
    act(() => { vi.advanceTimersByTime(120); });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("stands still while the pointer is over it", () => {
    const { scrollTo, wrapper } = setup();
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(500); });
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.mouseLeave(wrapper);
    act(() => { vi.advanceTimersByTime(120); });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("stands still after the visitor pressed pause, and starts again on play", () => {
    const { scrollTo } = setup();
    fireEvent.click(screen.getByRole("button", { name: landing.carousel.pause.de }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: landing.carousel.play.de }));
    act(() => { vi.advanceTimersByTime(120); });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("stands still while the assistant window is open, and moves on once it closes", () => {
    const { scrollTo } = setup();
    act(() => { setAgentOpen(true); });
    act(() => { vi.advanceTimersByTime(500); });
    expect(scrollTo).not.toHaveBeenCalled();
    act(() => { setAgentOpen(false); });
    act(() => { vi.advanceTimersByTime(120); });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("starts still when it mounts while the assistant window is already open", () => {
    setAgentOpen(true);
    try {
      const { scrollTo } = setup();
      act(() => { vi.advanceTimersByTime(500); });
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      act(() => { setAgentOpen(false); });
    }
  });
});

describe("landing intro", () => {
  it("plays first, holds the cookie dialog back and ends when skipped", async () => {
    await mount();
    const intro = screen.getByTestId("intro");
    expect(intro.querySelectorAll(".lp-intro-word")).toHaveLength(6); // the slogan is the hero headline
    expect(intro.textContent).toContain("KI-Chatbots, CRM und Websites für Unternehmen");
    // The slogan and the name are gold.
    expect(intro.querySelectorAll(".lp-intro-word.lp-intro-gold")).toHaveLength(6);
    expect(intro.querySelector(".lp-intro-logo .lp-intro-gold")?.textContent).toBe("Oprynex");
    expect(intro.querySelector(".lp-intro-left img")).not.toBeNull();
    expect(intro.querySelector(".lp-intro-right img")).not.toBeNull();
    expect(document.querySelector(".lp")!.getAttribute("data-intro")).toBe("on");
    expect(screen.queryByTestId("cookies")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Intro überspringen" }));
    await waitFor(() => expect(screen.queryByTestId("intro")).toBeNull());
    expect(screen.getByTestId("cookies")).toBeDefined();
    expect(document.querySelector(".lp")!.hasAttribute("data-intro")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("plays once per page load, not again when the home page is mounted again", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Intro überspringen" }));
    cleanup();
    await mount();
    expect(screen.queryByTestId("intro")).toBeNull();
    expect(screen.getByTestId("cookies")).toBeDefined();
  });

  it("plays on the first visit only and skips it for a returning browser", async () => {
    await mount();
    expect(localStorage.getItem(INTRO_SEEN_KEY)).toBeNull(); // not stored before consent
    rememberIntro(true);
    expect(localStorage.getItem(INTRO_SEEN_KEY)).toBe("1");
    cleanup();
    introState.played = false; // a new page load in the same browser
    await mount();
    await waitFor(() => expect(screen.queryByTestId("intro")).toBeNull());
    expect(document.documentElement.style.overflow).toBe("");
  });
});
