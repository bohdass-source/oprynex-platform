import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/pages";
import { buildHead } from "@/lib/seo";
import { DEFAULT_LANG } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => buildHead("home", DEFAULT_LANG),
  component: () => <Page page="home" lang={DEFAULT_LANG} />,
});
