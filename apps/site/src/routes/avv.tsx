import { createFileRoute } from "@tanstack/react-router";
import { AVV_MARKDOWN } from "@/lib/avv-text";
import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/avv")({
  head: () => pageHead("/avv"),
  component: () => <LegalPage markdown={AVV_MARKDOWN} />,
});
