import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClosingCTA, PageHero, Section } from "@/components/site";
import { industries } from "@/lib/content";

export const Route = createFileRoute("/industries")({
  head: () => pageHead("/industries"),
  component: Industries,
});

function Industries() {
  const { t, language } = useLanguage();
  const more = { ru: "Подробнее", de: "Mehr erfahren", en: "Learn more" }[language];
  return (
    <>
      <PageHero eyebrow={t("Отрасли")} title={t("Решения для работы с клиентами по отраслям")} text={t("У каждой отрасли свои типовые вопросы и свои границы. Мы начинаем с них, а не с технологии.")} />
      <Section title={t("Где это применимо")}>
        <div className="grid gap-6 md:grid-cols-3">
          {industries.map((i) => (
            <div key={t(i.name)} className="lp-glow h-full">
              <article className="flex h-full flex-col rounded-2xl bg-lp-surface p-7">
                <h3 className="text-2xl text-gold-soft">{t(i.name)}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{t(i.text)}</p>
                <Link to={i.path} className="mt-4 text-sm text-gold hover:underline">{more} →</Link>
              </article>
            </div>
          ))}
        </div>
      </Section>
      <ClosingCTA />
    </>
  );
}
