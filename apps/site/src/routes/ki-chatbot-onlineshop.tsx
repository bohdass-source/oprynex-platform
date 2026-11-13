import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-onlineshop")({
  head: () => pageHead("/ki-chatbot-onlineshop"),
  component: () => <GuidePage path="/ki-chatbot-onlineshop" />,
});
