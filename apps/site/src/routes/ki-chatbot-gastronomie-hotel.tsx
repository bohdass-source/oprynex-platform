import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-gastronomie-hotel")({
  head: () => pageHead("/ki-chatbot-gastronomie-hotel"),
  component: () => <GuidePage path="/ki-chatbot-gastronomie-hotel" />,
});
