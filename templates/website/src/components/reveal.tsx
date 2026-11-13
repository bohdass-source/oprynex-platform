import { useEffect, useRef, type ReactNode } from "react";

/** A section that rises and fades in once when it enters the viewport (styles in styles.css, reduced motion respected). */
export function Reveal({ children, className = "", id, labelledBy }: { children: ReactNode; className?: string; id?: string; labelledBy?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.dataset["shown"] = ""; return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { el.dataset["shown"] = ""; observer.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} id={id} aria-labelledby={labelledBy} className={`reveal ${className}`}>{children}</section>;
}
