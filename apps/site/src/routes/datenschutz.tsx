import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { DATENSCHUTZ_MARKDOWN } from "@/lib/datenschutz-text";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/datenschutz")({
  head: () => pageHead("/datenschutz"),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage markdown={DATENSCHUTZ_MARKDOWN} />;
}
