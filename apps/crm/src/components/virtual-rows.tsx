import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders only the rows in view (plus a margin) inside a scrolling box of fixed-height rows,
 * so a list of a million leads costs the same as a list of fifty.
 */
export function VirtualRows<T>({ items, rowHeight, maxHeight, render, getKey }: {
  items: T[]; rowHeight: number; maxHeight: string; render: (item: T) => ReactNode; getKey: (item: T) => string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const [height, setHeight] = useState(800);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.clientHeight || 800));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const overscan = 8;
  const first = Math.max(0, Math.floor(scroll / rowHeight) - overscan);
  const last = Math.min(items.length, Math.ceil((scroll + height) / rowHeight) + overscan);
  return (
    <div ref={box} onScroll={(e) => setScroll(e.currentTarget.scrollTop)} className="overflow-y-auto" style={{ maxHeight }} role="rowgroup">
      <div style={{ height: items.length * rowHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${first * rowHeight}px)` }}>
          {items.slice(first, last).map((item) => <div key={getKey(item)} style={{ height: rowHeight }}>{render(item)}</div>)}
        </div>
      </div>
    </div>
  );
}
