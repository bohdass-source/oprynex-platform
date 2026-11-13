import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/lib/site";
import { onAccent } from "@/lib/theme";

// Until the client has a logo: the first letter of the business name on the accent colour.
export const Route = createFileRoute("/favicon.svg")({
  server: {
    handlers: {
      GET: () => {
        const letter = (site.business.name.trim()[0] ?? "·").toUpperCase().replace(/[<>&"]/g, "");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${site.theme.accent}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="${onAccent(site.theme.accent)}">${letter}</text></svg>`;
        return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
