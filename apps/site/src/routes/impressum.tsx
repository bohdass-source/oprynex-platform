import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { IMPRESSUM_MARKDOWN } from "@/lib/impressum-text";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/impressum")({
  head: () => pageHead("/impressum"),
  component: () => <LegalPage markdown={IMPRESSUM_MARKDOWN} />,
});
