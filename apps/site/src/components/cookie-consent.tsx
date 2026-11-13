import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { rememberIntro } from "@/components/landing/intro-state";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { OPEN_COOKIE_SETTINGS_EVENT, readCookieConsent, saveCookieConsent, type CookieConsent as Consent } from "@/lib/cookie-consent";

export function CookieConsent() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(readCookieConsent() === null);
    const show = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, show);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, show);
  }, []);
  function choose(choice: Consent) {
    saveCookieConsent(choice);
    rememberIntro(choice === "accepted");
    setOpen(false);
  }
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border-gold/40 shadow-gold">
        <Cookie className="h-8 w-8 text-gold" aria-hidden="true" />
        <AlertDialogTitle className="font-display text-3xl">{t("Cookies и конфиденциальность")}</AlertDialogTitle>
        <AlertDialogDescription className="leading-relaxed">
          {t("В браузере сохраняются ваше решение и выбранная тема. Только с вашего согласия мы также запоминаем, что вступление уже показано. Рекламных cookies и трекинга сейчас нет. Выбор можно изменить внизу сайта.")}
        </AlertDialogDescription>
        <Button asChild variant="link" className="h-auto justify-start p-0 text-gold"><Link to="/datenschutz" onClick={() => setOpen(false)}>{t("Защита данных")}</Link></Button>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => choose("rejected")}>{t("Отклонить cookies")}</Button>
          <Button variant="outline" onClick={() => choose("accepted")}>{t("Принять cookies")}</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}