import { Link } from "@tanstack/react-router";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/landing/classes";
import { createElement, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";

type To = NonNullable<ComponentProps<typeof Link>["to"]>;

export function ButtonLink({ to, children, variant = "primary", size = "md", onClick }: { to: To; children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return <Link to={to} onClick={onClick} className={buttonClass(variant, size)}>{children}</Link>;
}

/** Rises 32px and fades in once when it enters the viewport; nothing is hidden until hydration (see landing.css). */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article" | "ul" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return createElement(as, { ref, className, "data-reveal": "", "data-in": shown ? "true" : "false", style: { "--d": `${delay}ms` } as CSSProperties }, children);
}

export function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <Reveal className="max-w-[680px]">
      <p className="text-sm font-medium text-lp-muted">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-lp-muted">{intro}</p>}
    </Reveal>
  );
}

const padding = { default: "py-16 md:py-24", none: "py-0", wide: "py-24 md:py-40" };

export function Section({ id, children, pad = "default" }: { id?: string; children: ReactNode; pad?: keyof typeof padding }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 md:px-6 ${padding[pad]}`}>
      {children}
    </section>
  );
}

export function Emblem({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <img src="/brand/oprynex-emblem-192.jpg" alt="" width={size} height={size} className={`shrink-0 rounded-full ${className}`} style={{ width: size, height: size }} />;
}
