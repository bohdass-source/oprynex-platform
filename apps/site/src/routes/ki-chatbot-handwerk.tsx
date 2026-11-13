import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-handwerk")({
  head: () => pageHead("/ki-chatbot-handwerk"),
  component: () => <GuidePage path="/ki-chatbot-handwerk" />,
});
