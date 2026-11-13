import { createFileRoute } from "@tanstack/react-router";
import { OfferPage } from "@/components/offer-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/crm-entwicklung")({
  head: () => pageHead("/crm-entwicklung"),
  component: () => <OfferPage path="/crm-entwicklung" />,
});
