import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-immobilien")({
  head: () => pageHead("/ki-chatbot-immobilien"),
  component: () => <GuidePage path="/ki-chatbot-immobilien" />,
});
