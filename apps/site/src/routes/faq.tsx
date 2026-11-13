import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/components/language-provider";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site";
import { AuthorBio } from "@/components/author-bio";
import { faq } from "@/lib/content";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("/faq"),
  component: FAQ,
});

function FAQ() {
  const { t } = useLanguage();
  return <><PageHero eyebrow={t("FAQ")} title={t("Частые вопросы о сайтах, ассистентах и проектах Oprynex")} text={t("О сайтах, ассистентах, ценах и ходе проектов.")} /><section className="mx-auto max-w-6xl px-6 py-12"><div className="divide-y border-y">{faq.map(([q, a]) => <details key={t(q)} className="group py-5"><summary className="flex cursor-pointer list-none justify-between gap-4 text-lg"><h2 className="text-lg">{t(q)}</h2><span className="text-gold transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-muted-foreground">{t(a)}</p></details>)}</div></section><AuthorBio /></>;
}