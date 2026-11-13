import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { ClosingCTA, Section } from "@/components/site";
import { categoryLabel, offers } from "@/lib/offers";

export const Route = createFileRoute("/preise")({
  head: () => pageHead("/preise"),
  component: Preise,
});

const ui = {
  eyebrow: { ru: "Цены", de: "Preise", en: "Prices" },
  h1: { ru: "Цены Oprynex", de: "Preise von Oprynex", en: "Oprynex prices" },
  intro: { ru: "Проектная цена для сайтов, чатботов и CRM, ежемесячная оплата за работу чатбота и почасовая оплата консультаций.", de: "Projektpreis für Websites, Chatbots und CRM, ein Monatsbetrag für den Betrieb des Chatbots und ein Stundensatz für Beratung.", en: "Project pricing for websites, chatbots and CRM, a monthly fee for running the chatbot and an hourly rate for consulting." },
  services: { ru: "Услуги и стартовые цены", de: "Leistungen und Startpreise", en: "Services and starting prices" },
  note: { ru: "Все цены указаны без НДС (netto); сумма с НДС 19 % = цена × 1,19. Предложения адресованы компаниям и предпринимателям. Точный объём согласуется до начала работы.", de: "Alle Preise netto zzgl. 19 % MwSt. (Brutto = Preis × 1,19). Unsere Angebote richten sich an Unternehmen und Selbstständige. Der genaue Umfang wird vor Beginn vereinbart.", en: "All prices are net, excluding VAT; the amount including 19 % VAT is the price × 1.19. Our offers are aimed at companies and self-employed professionals. Exact scope is agreed before work starts." },
};

function Preise() {
  const { language: l } = useLanguage();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
        <p className="eyebrow">{ui.eyebrow[l]}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl">{ui.h1[l]}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{ui.intro[l]}</p>
        <div className="gold-rule mt-14" />
      </section>
      <Section title={ui.services[l]}>
        <div className="divide-y border-y">
          {offers.map((o) => (
            <div key={o.id} className="grid gap-2 py-5 md:grid-cols-[1fr_14rem_10rem] md:items-center">
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{categoryLabel[o.category][l]}</p><h3 className="text-xl">{o.name[l]}</h3></div>
              <div><span className="font-display text-xl text-gold">{o.price[l]}</span>{o.priceNote && <p className="mt-1 text-sm text-muted-foreground">{o.priceNote[l]}</p>}</div>
              <Link to={o.path} className="text-gold hover:underline">{o.cta[l]} →</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{ui.note[l]}</p>
      </Section>
      <ClosingCTA />
    </>
  );
}
