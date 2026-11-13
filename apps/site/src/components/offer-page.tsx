import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { OfferGrid } from "@/components/offer-card";
import { AuthorBio } from "@/components/author-bio";
import { Section } from "@/components/site";
import { guides } from "@/lib/guides";
import { categoryLabel, offerByPath, offers, trackConversion, type OfferPath } from "@/lib/offers";

const ui = {
  included: { ru: "Что входит", de: "Leistungsumfang", en: "What's included" },
  process: { ru: "Как проходит работа", de: "Ablauf", en: "How it works" },
  price: { ru: "Стоимость", de: "Preis", en: "Price" },
  priceNote: { ru: "Цены указаны без НДС (+19 %). Точная стоимость зависит от объёма и согласуется до начала работы.", de: "Preise netto zzgl. 19 % MwSt. Der genaue Preis hängt vom Umfang ab und wird vor Projektbeginn vereinbart.", en: "Prices are net, plus 19 % VAT. The exact price depends on scope and is agreed before work starts." },
  allPrices: { ru: "Все цены", de: "Alle Preise", en: "All prices" },
  guides: { ru: "Полезно знать", de: "Ratgeber", en: "Guides" },
  options: { ru: "Варианты и цены", de: "Varianten und Preise", en: "Options and prices" },
  other: { ru: "Другие решения", de: "Weitere Lösungen", en: "Other solutions" },
};

export function OfferPage({ path }: { path: OfferPath }) {
  const { language: l } = useLanguage();
  const o = offerByPath(path);
  const related = guides.filter((g) => g.offer === path);
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
        <p className="eyebrow">{categoryLabel[o.category][l]}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl"><span className="text-gold-gradient">{o.h1[l]}</span></h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{o.short[l]}</p>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">{o.intro[l]}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button asChild className="gold-sheen h-auto rounded-sm bg-gold-gradient px-7 py-3.5 text-primary-foreground shadow-gold">
            <Link to={o.ctaTo} onClick={() => trackConversion(o.id, "page_cta")}>{o.cta[l]}</Link>
          </Button>
          <span className="font-display text-2xl text-gold">{o.price[l]}</span>
        </div>
        <div className="gold-rule mt-14" />
      </section>
      <Section title={ui.included[l]}>
        <ul className="grid gap-4 md:grid-cols-2">
          {o.included.map((i) => <li key={i.de} className="gold-card flex gap-3 rounded-3xl p-6"><span className="text-gold">✓</span>{i[l]}</li>)}
        </ul>
      </Section>
      {o.options && (
        <Section title={ui.options[l]}>
          <ul className="grid gap-6 md:grid-cols-3">
            {o.options.map((option) => (
              <li key={option.name.de} className="gold-card flex flex-col rounded-3xl p-7">
                <h3 className="text-2xl">{option.name[l]}</h3>
                <p className="mt-2 font-display text-2xl text-gold">{option.price[l]}</p>
                <ul className="mt-5 space-y-2 text-sm">{option.items.map((item) => <li key={item.de} className="flex gap-2"><span className="text-gold">✓</span>{item[l]}</li>)}</ul>
              </li>
            ))}
          </ul>
          {o.optionsNote && <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">{o.optionsNote[l]}</p>}
        </Section>
      )}
      <Section title={ui.process[l]}>
        <ol className="grid gap-6 md:grid-cols-3">
          {o.steps.map((s, i) => (
            <li key={s.de} className="border-t border-gold/40 pt-5">
              <span className="font-display text-3xl text-gold">{i + 1}</span>
              <h3 className="mt-2 text-xl">{s[l]}</h3>
            </li>
          ))}
        </ol>
      </Section>
      <Section title={ui.price[l]}>
        <div className="gold-card rounded-3xl p-8">
          <p className="font-display text-4xl text-gold">{o.price[l]}</p>
          {o.priceNote && <p className="mt-2 text-lg text-gold">{o.priceNote[l]}</p>}
          <p className="mt-3 text-muted-foreground">{ui.priceNote[l]}</p>
          <Link to="/preise" className="mt-5 inline-block text-gold hover:underline">{ui.allPrices[l]} →</Link>
        </div>
      </Section>
      {related.length > 0 && (
        <Section title={ui.guides[l]}>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {related.map((g) => <li key={g.path}><Link to={g.path} className="text-gold hover:underline">{g.name[l]} →</Link></li>)}
          </ul>
        </Section>
      )}
      <AuthorBio />
      <Section title={ui.other[l]}>
        <OfferGrid offers={offers.filter((x) => x.id !== o.id)} />
      </Section>
    </>
  );
}
