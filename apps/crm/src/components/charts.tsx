// Small dependency-free charts for the dashboard. Every chart also carries its numbers as text for screen readers.
import type { ReactNode } from "react";

type Series = { label: string; color: string; values: number[] };

/** Two smoothed areas over time (like a fulfilment chart); the SVG stretches, the labels stay HTML so they never distort. */
export function AreaChart({ series, labels, summary }: { series: Series[]; labels: string[]; summary: string }) {
  const W = 600, H = 200, n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - 8 - (v / max) * (H - 24);
  const line = (values: number[]) => values.map((v, i) => {
    if (i === 0) return `M${x(0)},${y(v)}`;
    const cx = (x(i - 1) + x(i)) / 2;
    return `C${cx},${y(values[i - 1] ?? 0)} ${cx},${y(v)} ${x(i)},${y(v)}`;
  }).join(" ");
  const step = Math.max(1, Math.ceil(n / 7));
  return (
    <figure>
      <div className="relative h-48">
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[max, max % 2 === 0 ? max / 2 : "", 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-muted"><span className="w-5 text-right">{v}</span><span className="h-px flex-1 bg-line" /></div>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-y-0 left-7 right-0 h-full w-[calc(100%-1.75rem)]" aria-hidden="true">
          <defs>
            {series.map((s, i) => (
              <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {series.map((s, i) => (
            <g key={i}>
              <path d={`${line(s.values)} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill={`url(#area-${i})`} />
              <path d={line(s.values)} fill="none" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      </div>
      <div className="ml-7 mt-2 flex justify-between text-[11px] text-muted" aria-hidden="true">
        {labels.map((label, i) => <span key={i} className={i % step === 0 || i === n - 1 ? "" : "invisible"}>{label}</span>)}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => <span key={s.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}: <b className="text-text">{s.values.reduce((a, b) => a + b, 0)}</b></span>)}
        <span className="sr-only">{summary}</span>
      </figcaption>
    </figure>
  );
}

/** Rounded pillars with a faint track behind each one, one per stage. */
export function Pillars({ items }: { items: { key: string; label: string; value: number; color: string; labelNode?: ReactNode }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="flex h-52 items-end justify-between gap-2">
      {items.map((item) => (
        <li key={item.key} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-sm font-bold">{item.value}</span>
          <div className="relative w-full max-w-9 flex-1 rounded-full bg-surface-2" aria-hidden="true">
            <div className="absolute inset-x-0 bottom-0 rounded-full transition-[height]" style={{ height: `${Math.max(item.value ? 8 : 0, (item.value / max) * 100)}%`, background: item.color }} />
          </div>
          <span className="w-full truncate text-center text-[11px] text-muted" title={item.label}>{item.labelNode ?? item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** A thin share bar, as in a "popularity" column. */
export function ShareBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-2" aria-hidden="true">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}
