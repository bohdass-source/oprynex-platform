// Spots a mistyped mail provider in an address ("ptotonmail.com") and proposes the likely one, so a request
// does not reach the CRM with an address nobody can answer. Only suggests; the visitor decides.
const PROVIDERS = [
  "gmail.com", "googlemail.com", "gmx.de", "gmx.net", "gmx.at", "gmx.ch", "web.de", "t-online.de", "freenet.de", "posteo.de",
  "outlook.com", "outlook.de", "hotmail.com", "hotmail.de", "live.com", "live.de", "yahoo.com", "yahoo.de", "icloud.com", "me.com",
  "aol.com", "protonmail.com", "proton.me", "mail.ru", "yandex.ru", "ya.ru", "ukr.net", "mail.com", "bluewin.ch",
];

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length]!;
}

/** The corrected address when the domain is one or two letters away from a common provider; otherwise null. */
export function suggestEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1);
  if (!domain.includes(".") || PROVIDERS.includes(domain)) return null;
  let best: string | null = null;
  let bestDistance = 3;
  for (const provider of PROVIDERS) {
    const d = distance(domain, provider);
    if (d < bestDistance) { best = provider; bestDistance = d; }
  }
  // Short domains need an exact provider length match, or "web.de" would correct many real company domains.
  if (!best || (bestDistance === 2 && domain.length < 8)) return null;
  return `${email.slice(0, at)}@${best}`;
}
