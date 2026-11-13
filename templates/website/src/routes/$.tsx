import { createFileRoute, notFound } from "@tanstack/react-router";
import { Page } from "@/components/pages";
import { buildHead } from "@/lib/seo";
import { resolvePath } from "@/lib/site";

// Every page except "/": /leistungen, /pl, /pl/uslugi, /impressum … Unknown paths answer 404.
export const Route = createFileRoute("/$")({
  loader: ({ params }) => {
    const resolved = resolvePath(`/${params._splat ?? ""}`);
    if (!resolved) throw notFound();
    return resolved;
  },
  head: ({ loaderData }) => (loaderData ? buildHead(loaderData.page, loaderData.lang) : {}),
  component: function SitePage() {
    const { page, lang } = Route.useLoaderData();
    return <Page page={page} lang={lang} />;
  },
});
