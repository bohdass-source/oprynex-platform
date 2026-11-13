import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-dsgvo")({
  head: () => pageHead("/ki-chatbot-dsgvo"),
  component: () => <GuidePage path="/ki-chatbot-dsgvo" />,
});
