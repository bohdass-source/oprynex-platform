import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-autohaus")({
  head: () => pageHead("/ki-chatbot-autohaus"),
  component: () => <GuidePage path="/ki-chatbot-autohaus" />,
});
