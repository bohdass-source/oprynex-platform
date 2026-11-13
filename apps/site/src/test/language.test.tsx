import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { isLanguage, LanguageProvider, useLanguage } from "@/components/language-provider";

function Controls() {
  const { language, setLanguage } = useLanguage();
  return <><output data-testid="language">{language}</output><button onClick={() => setLanguage("de")}>DE</button><button onClick={() => setLanguage("en")}>EN</button></>;
}
async function mount() {
  const root = createRootRoute();
  const home = createRoute({ getParentRoute: () => root, path: "/", component: () => <LanguageProvider><Controls /></LanguageProvider> });
  const router = createRouter({ routeTree: root.addChildren([home]), history: createMemoryHistory({ initialEntries: ["/"] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}
afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.lang = "de"; });
it("accepts only the three requested site languages", () => {
  expect(["ru", "de", "en"].every(isLanguage)).toBe(true);
  expect(isLanguage("fr")).toBe(false);
});
it("uses German when no visitor preference has been saved", async () => {
  await mount();
  expect(screen.getByTestId("language").textContent).toBe("de");
  await waitFor(() => expect(document.documentElement.lang).toBe("de"));
});
it.each(["ru", "en"])("opens in German even when %s was previously saved", async (language) => {
  localStorage.setItem("oprynex-language", language);
  await mount();
  await waitFor(() => expect(document.documentElement.lang).toBe("de"));
  expect(screen.getByTestId("language").textContent).toBe("de");
});
it("allows switching to English but opens in German after reload", async () => {
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "EN" }));
  await waitFor(() => expect(document.documentElement.lang).toBe("en"));
  expect(screen.getByTestId("language").textContent).toBe("en");
  cleanup();
  await mount();
  await waitFor(() => expect(document.documentElement.lang).toBe("de"));
  expect(screen.getByTestId("language").textContent).toBe("de");
});