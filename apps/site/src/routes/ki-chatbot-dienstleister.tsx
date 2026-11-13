import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-dienstleister")({
  head: () => pageHead("/ki-chatbot-dienstleister"),
  component: () => <GuidePage path="/ki-chatbot-dienstleister" />,
});
