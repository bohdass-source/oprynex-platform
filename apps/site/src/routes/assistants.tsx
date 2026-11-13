import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { createFileRoute } from "@tanstack/react-router";
import { Card, ClosingCTA, PageHero, Section, StatusBadge } from "@/components/site";
import { assistants } from "@/lib/content";

export const Route = createFileRoute("/assistants")({
  head: () => pageHead("/assistants"),
  component: Assistants,
});

function Assistants() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero eyebrow="Oprynex AI" title={t("AI-ассистенты для сайта, магазина и поддержки")} text={t("Мы подбираем ассистента, готовим базу знаний, задаём границы ответов и правила передачи человеку. Внедрение — индивидуальный проект под ваш сайт.")} />
      <Section title={t("Шесть типов ассистентов")}>
        <div className="grid gap-6 md:grid-cols-2">
          {assistants.map((a) => (
            <Card key={t(a.name)}>
              <StatusBadge status="custom" />
              <h3 className="mt-4 text-3xl text-gold-soft">{t(a.name)}</h3>
              <p className="mt-3">{t(a.text)}</p>
              <p className="mt-4 border-l-2 border-gold/60 pl-4 text-sm text-muted-foreground">{t(a.limit)}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section eyebrow={t("Консультант Oprynex")} title={t("Помощник по выбору решения")}>
        <StatusBadge status="live" />
        <p className="mt-5 max-w-2xl text-muted-foreground">{t("AI-ассистент на этом сайте помогает выбрать направление по нише и задаче на одном из 20 языков. Он отвечает только по утверждённым знаниям, не придумывает сроки, подключения или подтверждения записи и передаёт сложные вопросы человеку.")}</p>
      </Section>
      <ClosingCTA />
    </>
  );
}
