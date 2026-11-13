import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/language-provider";

/** Author/consultant block for GEO: who wrote and advises, why to trust. */
export function AuthorBio() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="gold-card flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center">
        <img src="/brand/oprynex-emblem-192.jpg" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full shadow-gold" />
        <div>
          <h2 className="text-2xl">{t("Кто вас консультирует")}</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("Max Mustermann — основатель Oprynex. Лично ведёт консультации и проекты: настройка ИИ для обслуживания клиентов, специализированные ИИ-агенты и индивидуальная разработка программного обеспечения для бизнеса.")}
          </p>
          <Link to="/contact" className="mt-4 inline-block text-gold hover:underline">{t("Задать вопрос напрямую →")}</Link>
        </div>
      </div>
    </section>
  );
}
