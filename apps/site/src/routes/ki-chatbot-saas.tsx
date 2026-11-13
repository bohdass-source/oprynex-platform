import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-saas")({
  head: () => pageHead("/ki-chatbot-saas"),
  component: () => <GuidePage path="/ki-chatbot-saas" />,
});
