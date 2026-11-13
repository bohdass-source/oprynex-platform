import { createFileRoute } from "@tanstack/react-router";
import { GuidePage } from "@/components/guide-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ki-beratung")({
  head: () => pageHead("/ki-beratung"),
  component: () => <GuidePage path="/ki-beratung" />,
});
