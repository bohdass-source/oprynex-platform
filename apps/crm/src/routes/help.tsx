import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Mail } from "lucide-react";
import { OPRYNEX_CONTACT } from "@/lib/crm";
import { HELP } from "@/lib/help";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/help")({ component: HelpPage });

/** Plain text to paragraphs and lists: blank lines split paragraphs, lines starting with "- " are list items. */
function Body({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {text.split(/\n{2,}/).map((block) => {
        const lines = block.split("\n");
        const intro = lines.filter((line) => !line.startsWith("- "));
        const items = lines.filter((line) => line.startsWith("- "));
        return (
          <div key={block} className="space-y-1.5">
            {intro.map((line) => <p key={line}>{line}</p>)}
            {items.length > 0 && <ul className="list-disc space-y-1 pl-5">{items.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}

function HelpPage() {
  const { t, lang } = useI18n();
  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("help")}</h1>
        <p className="mt-1 text-sm text-muted">{t("helpIntro")}</p>
      </div>
      <div className="space-y-3">
        {HELP.map((topic) => (
          <details key={topic.id} id={topic.id} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-semibold">
              <span className="flex-1">{topic.title[lang]}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-line p-5"><Body text={topic.body[lang]} /></div>
          </details>
        ))}
      </div>
      <a href={`mailto:${OPRYNEX_CONTACT}?subject=${encodeURIComponent(t("helpMailSubject"))}`} className="btn-ghost"><Mail className="h-4 w-4" aria-hidden="true" />{t("helpContact")}</a>
    </section>
  );
}
