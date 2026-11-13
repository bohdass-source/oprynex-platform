import { createFileRoute } from "@tanstack/react-router";
import { OfferPage } from "@/components/offer-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-chatbot-website")({
  head: () => pageHead("/ki-chatbot-website"),
  component: () => <OfferPage path="/ki-chatbot-website" />,
});
