import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HELP } from "@/lib/help";
import { I18nProvider } from "@/lib/i18n";
import { Route } from "@/routes/help";

afterEach(cleanup);

describe("help", () => {
  it("has every topic in German, Russian and English, without the site's banned hype", () => {
    for (const topic of HELP) {
      for (const lang of ["de", "ru", "en"] as const) {
        expect(topic.title[lang].length, `${topic.id} ${lang}`).toBeGreaterThan(5);
        expect(topic.body[lang].length, `${topic.id} ${lang}`).toBeGreaterThan(80);
        expect(topic.body[lang]).not.toMatch(/!|garantiert|guaranteed|гарантир/i);
      }
    }
  });
  it("opens a topic as paragraphs and a list", () => {
    const Page = Route.options.component!;
    const router = createRouter({ routeTree: createRootRoute({ component: () => <Page /> }), history: createMemoryHistory() });
    render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
    return screen.findByText("Formular auf die eigene Website setzen").then((summary) => {
      fireEvent.click(summary);
      expect(screen.getByText(/WordPress: Block „Individuelles HTML“/).tagName).toBe("LI");
    });
  });
});
