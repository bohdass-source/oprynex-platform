import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { createFileRoute } from "@tanstack/react-router";
import { ClosingCTA, Section } from "@/components/site";
import { OfferGrid } from "@/components/offer-card";
import { offers } from "@/lib/offers";
import { steps } from "@/lib/content";

export const Route = createFileRoute("/services")({
  head: () => pageHead("/services"),
  component: Services,
});

const ui = {
  eyebrow: { ru: "Продукты и услуги", de: "Produkte & Leistungen", en: "Products & services" },
  h1: { ru: "Сайты, AI-чатботы и CRM для бизнеса", de: "Websites, KI-Chatbots und CRM für Unternehmen", en: "Websites, AI chatbots and CRM for business" },
  text: { ru: "Сайт под ключ, ассистент для готового сайта или оба вместе, CRM под ваши процессы и консультации. У каждого предложения своя страница с условиями.", de: "Website schlüsselfertig, Assistent für Ihre bestehende Website oder beides zusammen, CRM nach Maß und Beratung. Jedes Angebot hat eine eigene Seite mit den Konditionen.", en: "A turnkey website, an assistant for your existing website or both together, a CRM built for your workflow and consulting. Each offer has its own page with the terms." },
};

function Services() {
  const { t, language: l } = useLanguage();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
        <p className="eyebrow">{ui.eyebrow[l]}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl">{ui.h1[l]}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{ui.text[l]}</p>
        <div className="gold-rule mt-14" />
      </section>
      <Section title={ui.eyebrow[l]}><OfferGrid offers={offers} /></Section>
      <Section eyebrow={t("Процесс")} title={t("Как мы работаем")}>
        <ol className="space-y-4">
          {steps.map(([stepTitle, d], i) => (
            <li key={stepTitle} className="grid gap-2 border-b pb-4 md:grid-cols-[3rem_16rem_1fr]">
              <span className="font-display text-2xl text-gold">{i + 1}</span>
              <h3 className="text-lg">{t(stepTitle)}</h3>
              <span className="text-muted-foreground">{t(d)}</span>
            </li>
          ))}
        </ol>
      </Section>
      <ClosingCTA />
    </>
  );
}
