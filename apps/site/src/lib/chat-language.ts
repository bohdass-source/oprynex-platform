import type { Language } from "@/components/language-provider";

const german = new Set(["und", "ich", "wir", "sie", "nicht", "wie", "was", "ist", "das", "der", "die", "mit", "für", "eine", "kann", "preis", "kosten", "hallo", "guten"]);
const english = new Set(["the", "and", "is", "are", "what", "how", "do", "you", "can", "my", "price", "cost", "hello", "hi", "need", "want"]);

export function detectChatLanguage(text: string, current: Language): Language {
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru";
  const lower = text.toLowerCase();
  const words = lower.match(/\p{L}+/gu) ?? [];
  const de = words.filter(word => german.has(word)).length + (lower.match(/[äöüß]/g)?.length ?? 0);
  const en = words.filter(word => english.has(word)).length;
  return de === en ? current : de > en ? "de" : "en";
}