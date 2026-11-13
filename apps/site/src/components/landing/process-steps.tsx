import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Reveal } from "@/components/landing/primitives";
import { landing } from "@/lib/landing-copy";

type Point = { x: number; y: number };
type Geometry = { width: number; height: number; points: Point[]; vertical: boolean };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Process steps joined by one dashed line that runs from dot to dot. The line fades in ahead of the reader,
 * and a stronger stripe follows it; each step the stripe reaches moves from a muted to a full state.
 * Horizontal on desktop, vertical on phones. Geometry is measured from the real dots, progress comes from one
 * passive scroll listener throttled through requestAnimationFrame.
 */
export function ProcessSteps() {
  const { language: l } = useLanguage();
  const steps = landing.process.steps;
  const wrap = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const reveal = useRef<SVGRectElement>(null);
  const fill = useRef<SVGRectElement>(null);
  const geometry = useRef<Geometry | null>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [active, setActive] = useState(0);

  const measure = useCallback(() => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    const points = dots.current.flatMap((dot) => {
      if (!dot) return [];
      const rect = dot.getBoundingClientRect();
      return [{ x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top }];
    });
    const first = points[0];
    const second = points[1];
    if (!first || !second || points.length !== steps.length) return;
    const next = { width: box.width, height: box.height, points, vertical: Math.abs(second.x - first.x) < Math.abs(second.y - first.y) };
    geometry.current = next;
    setGeo(next);
  }, [steps.length]);

  const update = useCallback(() => {
    const g = geometry.current;
    const box = wrap.current?.getBoundingClientRect();
    const first = g?.points[0];
    const last = g?.points[g.points.length - 1];
    if (!g || !box || !first || !last) return;
    const vh = window.innerHeight;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = reduced ? 1 : clamp((vh * 0.8 - box.top) / (box.height * 0.9 + vh * 0.1));
    const place = (rect: SVGRectElement | null, fraction: number) => {
      if (!rect) return;
      if (g.vertical) {
        rect.setAttribute("x", "0"); rect.setAttribute("width", String(g.width));
        rect.setAttribute("y", String(first.y)); rect.setAttribute("height", String(Math.max(0, fraction * (last.y - first.y))));
      } else {
        rect.setAttribute("y", "0"); rect.setAttribute("height", String(g.height));
        rect.setAttribute("x", String(first.x)); rect.setAttribute("width", String(Math.max(0, fraction * (last.x - first.x))));
      }
    };
    place(reveal.current, Math.min(1, t + 0.22)); // the dashed line appears a little ahead of the stripe
    place(fill.current, t);
    let reached = 0;
    for (let i = 0; i < steps.length; i += 1) if (t >= i / (steps.length - 1) - 0.001 && (i > 0 || t > 0.02)) reached += 1;
    setActive(reached);
  }, [steps.length]);

  useEffect(() => {
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (wrap.current) observer?.observe(wrap.current);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  useEffect(() => {
    if (!geo) return;
    let frame = 0;
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [geo, update]);

  const first = geo?.points[0];
  const last = geo?.points[geo.points.length - 1];
  return (
    <Reveal className="mt-12">
      <div ref={wrap} className="relative">
        {geo && first && last && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" width={geo.width} height={geo.height}>
            <defs>
              <clipPath id="lp-line-reveal"><rect ref={reveal} x={first.x} y={0} width={0} height={geo.height} /></clipPath>
              <clipPath id="lp-line-fill"><rect ref={fill} x={first.x} y={0} width={0} height={geo.height} /></clipPath>
            </defs>
            <line x1={first.x} y1={first.y} x2={last.x} y2={last.y} strokeWidth={2} strokeDasharray="8 8" clipPath="url(#lp-line-reveal)" style={{ stroke: "var(--lp-line)" }} />
            <line x1={first.x} y1={first.y} x2={last.x} y2={last.y} strokeWidth={2} strokeDasharray="8 8" clipPath="url(#lp-line-fill)" style={{ stroke: "var(--lp-fg)" }} />
          </svg>
        )}
        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-4">
          {steps.map((step, i) => (
            <li key={step.title.de} className="relative pl-10 md:pl-0 md:pt-12">
              <span
                ref={(el) => { dots.current[i] = el; }}
                className="lp-dot absolute left-0 top-6 size-5 rounded-full border-2 md:left-1/2 md:top-0 md:-translate-x-1/2"
                data-active={i < active}
                aria-hidden="true"
              />
              <div className="lp-step h-full rounded-2xl border border-lp-line bg-lp-surface p-6 md:p-8" data-active={i < active}>
                <p className="text-sm font-medium text-lp-muted">{landing.process.step[l]} {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-xl font-semibold">{step.title[l]}</h3>
                <p className="mt-2 text-base text-lp-muted">{step.text[l]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
