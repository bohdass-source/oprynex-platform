import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-arztpraxis")({
  head: () => pageHead("/ki-chatbot-arztpraxis"),
  component: () => <GuidePage path="/ki-chatbot-arztpraxis" />,
});
