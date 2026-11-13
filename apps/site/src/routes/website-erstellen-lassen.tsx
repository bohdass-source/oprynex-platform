import { createFileRoute } from "@tanstack/react-router";
import { OfferPage } from "@/components/offer-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/website-erstellen-lassen")({
  head: () => pageHead("/website-erstellen-lassen"),
  component: () => <OfferPage path="/website-erstellen-lassen" />,
});
