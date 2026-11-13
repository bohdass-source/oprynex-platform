import { createFileRoute } from "@tanstack/react-router";
import { AGB_MARKDOWN } from "@/lib/agb-text";
import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/agb")({
  head: () => pageHead("/agb"),
  component: () => <LegalPage markdown={AGB_MARKDOWN} />,
});
