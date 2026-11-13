import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { NotFound } from "@/components/pages";
import { Shell } from "@/components/shell";
import { langOf, site } from "@/lib/site";
import { onAccent } from "@/lib/theme";
import { LOCALE } from "@/lib/ui-text";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: site.theme.mode === "dark" ? "#181818" : "#ffffff" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootDocument,
  component: () => <Shell><Outlet /></Shell>,
  notFoundComponent: () => <NotFoundPage />,
});

function NotFoundPage() {
  const lang = langOf(useRouterState({ select: (s) => s.location.pathname }));
  return <NotFound lang={lang} />;
}

/** Theme, accent and font come from the config, so the server renders the final look; data-js turns on scroll effects. */
function RootDocument({ children }: { children: ReactNode }) {
  const lang = langOf(useRouterState({ select: (s) => s.location.pathname }));
  const style = { "--accent": site.theme.accent, "--on-accent": onAccent(site.theme.accent) } as React.CSSProperties;
  return (
    <html lang={LOCALE[lang]} data-theme={site.theme.mode} data-font={site.theme.font} style={style} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      </head>
      <body>
        {children}
        <Scripts />
        {site.chatbot && <script src="https://bot.oprynex.workers.dev/widget.js" data-bot={site.chatbot.botId} data-lang={lang} async />}
      </body>
    </html>
  );
}
