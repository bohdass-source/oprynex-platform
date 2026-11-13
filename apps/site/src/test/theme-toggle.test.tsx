import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";

// The site always opens in German, so tests that assert Russian labels switch explicitly.
function Russian({ children }: { children: ReactNode }) {
  const { setLanguage } = useLanguage();
  useEffect(() => { setLanguage("ru"); }, [setLanguage]);
  return <>{children}</>;
}

async function renderToggle() {
  const root = createRootRoute();
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <LanguageProvider><Russian><ThemeToggle /></Russian></LanguageProvider>,
  });
  const router = createRouter({ routeTree: root.addChildren([home]), history: createMemoryHistory({ initialEntries: ["/"] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("light");
});

describe("Theme preference", () => {
  it("starts dark and lets the visitor switch to light and back", async () => {
    await renderToggle();
    expect(document.documentElement.classList.contains("light")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Включить светлую тему" }));
    expect(document.documentElement.classList.contains("light")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Включить тёмную тему" }));
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("restores a visitor's selected light theme", async () => {
    localStorage.setItem("oprynex-theme", "light");
    await renderToggle();
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
