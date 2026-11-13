import { Link } from "@tanstack/react-router";
import { AuthorBio } from "@/components/author-bio";
import { useLanguage } from "@/components/language-provider";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { guideByPath, type GuidePath } from "@/lib/guides";

const ui = {
  faq: { ru: "Частые вопросы", de: "Häufige Fragen", en: "Frequently asked questions" },
  more: { ru: "Читать дальше", de: "Weiterlesen", en: "Read more" },
};

/** A search-focused content page: one question, a direct answer first, then the details and a short FAQ. */
export function GuidePage({ path }: { path: GuidePath }) {
  const { language: l } = useLanguage();
  const g = guideByPath(path);
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
        <p className="eyebrow">{g.eyebrow[l]}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl"><span className="text-gold-gradient">{g.h1[l]}</span></h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{g.lead[l]}</p>
        <div className="mt-8">
          <Button asChild className="gold-sheen h-auto rounded-sm bg-gold-gradient px-7 py-3.5 text-primary-foreground shadow-gold">
            <Link to="/contact">{g.cta[l]}</Link>
          </Button>
        </div>
        <div className="gold-rule mt-14" />
      </section>
      {g.sections.map((s) => (
        <Section key={s.title.de} title={s.title[l]}>
          <div className="max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
            {s.text.map((t) => <p key={t.de}>{t[l]}</p>)}
          </div>
          {s.list && (
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {s.list.map((i) => <li key={i.de} className="gold-card flex gap-3 rounded-3xl p-6"><span className="text-gold">✓</span>{i[l]}</li>)}
            </ul>
          )}
        </Section>
      ))}
      <Section title={ui.faq[l]}>
        <dl className="max-w-3xl space-y-8">
          {g.faq.map((f) => (
            <div key={f.q.de}>
              <dt className="text-xl">{f.q[l]}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{f.a[l]}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <AuthorBio />
      <Section title={ui.more[l]}>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {g.links.map((link) => <li key={link.to}><Link to={link.to} className="text-gold hover:underline">{link.label[l]} →</Link></li>)}
        </ul>
      </Section>
    </>
  );
}
