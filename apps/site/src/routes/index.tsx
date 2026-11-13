import { createFileRoute } from "@tanstack/react-router";
import { ContactSection } from "@/components/contact-section";
import { Hero } from "@/components/landing/hero";
import { Assistants, Faq, Pricing, Problem, Process, Solutions, Tagline } from "@/components/landing/sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("/"),
  component: Index,
});

// The home page is the landing. Navigation, footer, intro and overlays come from the shared shell (site-shell.tsx).
function Index() {
  return (
    <>
      <Hero />
      <Problem />
      <Solutions />
      <Tagline />
      <Process />
      <Assistants />
      <Pricing />
      <Faq />
      <ContactSection />
    </>
  );
}
