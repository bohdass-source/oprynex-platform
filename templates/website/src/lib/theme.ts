// Contrast helpers: the text colour on the accent, and the checks the tests run on a client's colour.
const channel = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Black or white, whichever reads better on the accent. */
export const onAccent = (accent: string) => (contrast(accent, "#ffffff") >= contrast(accent, "#0a0a0a") ? "#ffffff" : "#0a0a0a");

export const PAGE_BG = { light: "#ffffff", dark: "#181818" } as const;
