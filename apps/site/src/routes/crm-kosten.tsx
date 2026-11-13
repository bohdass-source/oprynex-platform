import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/crm-kosten")({
  head: () => pageHead("/crm-kosten"),
  component: () => <GuidePage path="/crm-kosten" />,
});
