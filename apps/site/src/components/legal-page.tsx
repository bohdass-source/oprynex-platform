import type { ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";

// Legal pages (Datenschutz, Impressum) are German-only documents written as simple markdown.
export function renderPolicy(markdown: string): ReactNode[] {
  const out: ReactNode[] = [];
  const blocks = markdown.trim().split(/\n\s*\n/);
  blocks.forEach((block, i) => {
    const lines = block.split("\n");
    const first = lines[0] ?? "";
    if (first.startsWith("# ")) out.push(<h1 key={i} className="font-display text-4xl text-gold-gradient md:text-5xl">{first.slice(2)}</h1>);
    else if (first.startsWith("## ")) out.push(<h2 key={i} className="mt-10 font-display text-2xl">{first.slice(3)}</h2>);
    else if (lines.some(l => l.startsWith("- "))) {
      const intro = lines.filter(l => !l.startsWith("- "));
      out.push(<div key={i} className="space-y-2">{intro.length > 0 && <p>{intro.join(" ")}</p>}<ul className="list-disc space-y-1 pl-6">{lines.filter(l => l.startsWith("- ")).map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul></div>);
    } else out.push(<p key={i} className="whitespace-pre-line">{block}</p>);
  });
  return out;
}


export function LegalPage({ markdown }: { markdown: string }) {
  const { language } = useLanguage();
  const note = language === "ru" ? "Юридически значимая версия — на немецком языке." : language === "en" ? "The legally binding version is in German." : null;
  return <section lang="de" className="mx-auto max-w-3xl space-y-4 px-6 pb-16 pt-32 leading-relaxed text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground">
    {note && <p lang={language} className="rounded-2xl border border-gold/40 px-4 py-3 text-sm text-gold">{note}</p>}
    {renderPolicy(markdown)}
  </section>;
}
