import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { translations } from "@/lib/translations";
import { seoTranslations } from "@/lib/seo-translations";

const dictionary = { ...translations, ...seoTranslations };

export type Language = "ru" | "de" | "en";
export function isLanguage(value: unknown): value is Language {
  return value === "ru" || value === "de" || value === "en";
}
export function translate(text: string, language: Language): string {
  return language === "ru" ? text : dictionary[text]?.[language] ?? text;
}
const LanguageContext = createContext({ language: "de" as Language, setLanguage: (_: Language) => {}, t: (text: string) => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    document.documentElement.lang = language;
    // Route heads remain the source of metadata; translate their values after navigation.
    const update = () => {
      const sourceText = (text: string) => Object.entries(dictionary).find(([, value]) => value.en === text || value.de === text)?.[0] ?? text;
      const title = translate(sourceText(document.title), language);
      if (document.title !== title) document.title = title;
      document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').forEach((el) => {
        const source = sourceText(el.content);
        const content = translate(source, language);
        if (el.content !== content) el.content = content;
      });
    };
    const timer = window.setTimeout(update, 0);
    const observer = new MutationObserver(update);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [language, pathname]);
  function setLanguage(next: Language) {
    setLanguageState(next);
  }
  return <LanguageContext.Provider value={{ language, setLanguage, t: (text) => translate(text, language) }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);