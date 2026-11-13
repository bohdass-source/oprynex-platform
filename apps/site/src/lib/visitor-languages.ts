// Languages a visitor can use with the chat and in leads (the site UI itself stays de/ru/en).
export const VISITOR_LANGUAGES = ["de", "en", "fr", "es", "it", "nl", "pl", "pt", "ro", "cs", "hu", "bg", "el", "sv", "da", "fi", "tr", "ru", "uk", "kk"] as const;
export type VisitorLanguage = (typeof VISITOR_LANGUAGES)[number];

// Shown in the chat language menu, each in its own language.
export const VISITOR_LANGUAGE_NATIVE: Record<VisitorLanguage, string> = {
  de: "Deutsch", en: "English", fr: "Français", es: "Español", it: "Italiano", nl: "Nederlands", pl: "Polski",
  pt: "Português", ro: "Română", cs: "Čeština", hu: "Magyar", bg: "Български", el: "Ελληνικά", sv: "Svenska",
  da: "Dansk", fi: "Suomi", tr: "Türkçe", ru: "Русский", uk: "Українська", kk: "Қазақша",
};

// Used in instructions to the model.
export const VISITOR_LANGUAGE_ENGLISH: Record<VisitorLanguage, string> = {
  de: "German", en: "English", fr: "French", es: "Spanish", it: "Italian", nl: "Dutch", pl: "Polish",
  pt: "Portuguese", ro: "Romanian", cs: "Czech", hu: "Hungarian", bg: "Bulgarian", el: "Greek", sv: "Swedish",
  da: "Danish", fi: "Finnish", tr: "Turkish", ru: "Russian", uk: "Ukrainian", kk: "Kazakh",
};

// Browser speech recognition locale per language.
export const SPEECH_LOCALE: Record<VisitorLanguage, string> = {
  de: "de-DE", en: "en-US", fr: "fr-FR", es: "es-ES", it: "it-IT", nl: "nl-NL", pl: "pl-PL", pt: "pt-PT",
  ro: "ro-RO", cs: "cs-CZ", hu: "hu-HU", bg: "bg-BG", el: "el-GR", sv: "sv-SE", da: "da-DK", fi: "fi-FI",
  tr: "tr-TR", ru: "ru-RU", uk: "uk-UA", kk: "kk-KZ",
};

// Chat buttons and labels exist in de/ru/en only; other languages get English labels.
export function uiLanguageFor(language: VisitorLanguage): "de" | "ru" | "en" {
  return language === "de" || language === "ru" ? language : "en";
}
