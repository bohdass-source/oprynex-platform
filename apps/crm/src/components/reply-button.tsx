import { Mail } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { REPLY_TEMPLATES, replyLanguage, replyLink } from "@/lib/reply-templates";

/** "Reply" with an optional ready text: the member's email program opens with subject and body filled in. */
export function ReplyButton({ to, subject, kind, language, name, company, number }: {
  to: string; subject: string; kind: "lead" | "ticket"; language?: string | null; name: string; company: string; number?: string | undefined;
}) {
  const { t, lang } = useI18n();
  const [chosen, setChosen] = useState("");
  const templates = REPLY_TEMPLATES.filter((tpl) => tpl.for === kind || tpl.for === "both");
  const template = templates.find((tpl) => tpl.id === chosen) ?? null;
  const replyLang = replyLanguage(language, lang);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`template-${kind}`}>{t("replyTemplate")}</label>
      <select id={`template-${kind}`} className="field h-10 w-auto py-1 text-sm" value={chosen} onChange={(e) => setChosen(e.target.value)}>
        <option value="">{t("replyNoTemplate")}</option>
        {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.title[lang]}</option>)}
      </select>
      <a href={replyLink(to, subject, template, replyLang, { name, company, number })} className="btn-primary"><Mail className="h-4 w-4" aria-hidden="true" />{t("reply")}</a>
    </div>
  );
}
