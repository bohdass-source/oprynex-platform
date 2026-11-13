import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/website-kosten")({
  head: () => pageHead("/website-kosten"),
  component: () => <GuidePage path="/website-kosten" />,
});
