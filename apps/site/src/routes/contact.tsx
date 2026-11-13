import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { createFileRoute } from "@tanstack/react-router";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/site";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("/contact"),
  component: Contact,
});

function Contact() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero eyebrow={t("Консультация")} title={t("Консультация по сайту, CRM и автоматизации")} text={t("Работа с клиентами, сайт, CRM или первая версия продукта — начнём с вашей задачи.")} />
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="reveal">
          <p className="eyebrow">{t("Консультации напрямую")}</p>
          <h2 className="mt-4 text-4xl">Max Mustermann</h2>
          <p className="mt-5 text-muted-foreground">{t("Заполните форму — мы изучим задачу и ответим лично.")}</p>
        </div>
        <div className="reveal">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
