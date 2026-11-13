import { createFileRoute } from "@tanstack/react-router";
import { OfferPage } from "@/components/offer-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/beratung")({
  head: () => pageHead("/beratung"),
  component: () => <OfferPage path="/beratung" />,
});
