import type { Status } from "@/lib/crm";
import { statusLabel, useI18n } from "@/lib/i18n";

const tone: Record<Status, string> = {
  new: "bg-gold-soft text-text border-gold",
  contacted: "bg-surface-2 text-text border-line",
  proposal: "bg-surface-2 text-text border-text/40",
  won: "bg-surface-2 text-ok border-ok/50",
  lost: "bg-surface-2 text-muted border-line",
  spam: "bg-surface-2 text-muted border-line line-through",
};

/** Stage colour in charts and on the board. */
export const STAGE_COLOR: Record<Status, string> = {
  new: "var(--gold)", contacted: "var(--chart-a)", proposal: "#8b9cf7", won: "var(--ok)", lost: "var(--muted)", spam: "var(--muted)",
};

export function StatusPill({ status }: { status: Status }) {
  const { lang } = useI18n();
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${tone[status]}`}>{statusLabel[status][lang]}</span>;
}
