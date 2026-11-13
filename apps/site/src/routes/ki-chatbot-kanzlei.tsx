import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-kanzlei")({
  head: () => pageHead("/ki-chatbot-kanzlei"),
  component: () => <GuidePage path="/ki-chatbot-kanzlei" />,
});
