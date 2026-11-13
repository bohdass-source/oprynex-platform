// Pure helpers for the endless carousel. The row is rendered as: k copies of the last cards, the n real cards,
// k copies of the first cards. A copy looks exactly like its original, so when the middle of the row rests on a
// copy the row can jump by one full run to the real card without any visible change.

/** How many copies sit at each end of the row. */
export const LOOP_CLONES = 3;

export function cloneCount(n: number): number {
  return n > 1 ? Math.min(LOOP_CLONES, n) : 0;
}

/** Rendered index to jump to when the middle card is a copy, or null when it is inside the real run. */
export function loopTarget(index: number, n: number, k: number): number | null {
  if (k === 0) return null;
  if (index < k) return index + n;
  if (index >= k + n) return index - n;
  return null;
}

/** Index among the real cards for a rendered index. */
export function realIndex(index: number, n: number, k: number): number {
  return n === 0 ? 0 : (((index - k) % n) + n) % n;
}

/** Rendered index of a real card that is nearest to the card the row rests on now. */
export function nearestRendered(real: number, current: number, n: number, k: number): number {
  const total = n + 2 * k;
  const options = [k + real - n, k + real, k + real + n].filter((index) => index >= 0 && index < total);
  return options.reduce((best, index) => (Math.abs(index - current) < Math.abs(best - current) ? index : best), options[0] ?? k + real);
}
