import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/language-provider";
import { buttonClass, textLink } from "@/components/landing/classes";
import { Emblem } from "@/components/landing/primitives";
import { openCookieSettings } from "@/lib/cookie-consent";
import { OPERATOR } from "@/lib/operator";

/** Footer of every page, with the content of the original site: who, what, address, email, slogan and legal links. */
export function SiteFooter() {
  const { t, language } = useLanguage();
  return (
    <footer className="border-t border-lp-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
        <div>
          <div className="flex items-center gap-3">
            <Emblem size={48} />
            <p className="text-2xl font-semibold">Oprynex</p>
          </div>
          <p className="mt-5 max-w-lg text-sm text-lp-muted">Max Mustermann · {t("Персональная настройка ИИ для обслуживания клиентов, специализированные ИИ-агенты и индивидуальная разработка программного обеспечения для бизнеса")}</p>
          <Link to="/contact" className={`${textLink} mt-4`}>
            {t("Обсудить задачу →")}
          </Link>
        </div>
        <dl className="grid gap-6 text-sm md:justify-self-end">
          <div><dt className="font-semibold">{t("Адрес")}</dt><dd className="mt-2 text-lp-muted"><address className="not-italic">{OPERATOR.street}<br />{OPERATOR.postalCode} {OPERATOR.city}, {OPERATOR.country[language]}</address></dd></div>
          <div><dt className="font-semibold">{t("Электронная почта")}</dt><dd className="mt-2 text-lp-muted"><a href={`mailto:${OPERATOR.email}`} className="underline-offset-2 hover:underline">{OPERATOR.email}</a></dd></div>
        </dl>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-lp-line px-4 pb-28 pt-6 sm:flex-row sm:items-center sm:justify-between md:px-6 sm:pb-24">
        <p className="text-sm font-medium">{t("Одна платформа. Безграничные возможности.")}</p>
        <nav aria-label={t("Юридическая информация")} className="flex flex-wrap gap-2 sm:justify-end">
          <button type="button" onClick={openCookieSettings} className={buttonClass("secondary", "sm")}>{t("Cookies")}</button>
          <Link to="/impressum" className={buttonClass("secondary", "sm")}>{t("Сведения об операторе")}</Link>
          <Link to="/datenschutz" className={buttonClass("secondary", "sm")}>{t("Защита данных")}</Link>
          <Link to="/agb" className={buttonClass("secondary", "sm")}>{t("Общие условия")}</Link>
          <Link to="/avv" className={buttonClass("secondary", "sm")}>{t("Обработка данных по поручению")}</Link>
        </nav>
      </div>
    </footer>
  );
}
