import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyForm, type WebForm } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

// Accessibility of the pages built this week, checked with axe: labels, button names, roles, lists, headings.
// Colour contrast needs real layout and is left to the browser; jsdom cannot measure it.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), clear: () => store.clear() });

const idle = { mutate: vi.fn(), isPending: false, isError: false };
const form: WebForm = { ...emptyForm(), id: "22222222-2222-4222-8222-222222222222", workspace_id: "ws", created_at: "", updated_at: "", name: "Kontakt", origins: ["https://praxis-weber.de"], privacy_url: "https://praxis-weber.de/datenschutz" };
vi.mock("@/lib/auth", () => ({
  useWorkspace: () => ({ workspace: { id: "ws", name: "Praxis Weber", role: "owner", plan: "team", status: "trial", trial_ends_at: new Date(Date.now() + 5 * 86_400_000).toISOString() }, userId: "u" }),
  useAuthActions: () => ({ reload: vi.fn(), switchTo: vi.fn() }),
}));
vi.mock("@/lib/push-client", () => ({ pushIsOn: () => false }));
vi.mock("@/lib/queries", () => ({
  useForms: () => ({ data: [form], isPending: false, isError: false }),
  useSites: () => ({ data: [] }),
  useTeam: () => ({ data: [{ user_id: "u", email: "anna@praxis-weber.de", role: "owner" }] }),
  useInvites: () => ({ data: [] }),
  useLeads: () => ({ data: [] }),
  useTickets: () => ({ data: [] }),
  useFormChange: () => ({ save: idle, remove: idle }),
  useRetention: () => ({ data: null, isPending: false }),
  useDataChange: () => ({ setRetention: idle, deleteCompany: idle }),
  usePlatformChange: () => ({ create: idle, update: idle, setSignup: idle }),
}));

const pages: [string, () => Promise<() => ReactNode>, string][] = [
  ["forms", async () => (await import("@/routes/forms")).Route.options.component as () => ReactNode, "Website-Formulare"],
  ["data", async () => (await import("@/routes/data")).Route.options.component as () => ReactNode, "Daten"],
  ["plan", async () => (await import("@/routes/plan")).Route.options.component as () => ReactNode, "Tarif"],
  ["help", async () => (await import("@/routes/help")).Route.options.component as () => ReactNode, "Hilfe"],
  ["onboarding", async () => { const { OnboardingCard } = await import("@/components/onboarding"); const { useWorkspace } = await import("@/lib/auth"); return () => <OnboardingCard workspace={useWorkspace().workspace} />; }, "Erste Schritte"],
  ["new company", async () => (await import("@/components/new-company")).NewCompany, "Unternehmen für einen Kunden anlegen"],
];

afterEach(cleanup);

describe("accessibility of the new pages", () => {
  it("catches real problems (the check itself works)", async () => {
    const { container } = render(<main><button type="button"><svg aria-hidden="true" /></button><input /></main>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations.map((v) => v.id).sort()).toEqual(["button-name", "label"]);
  });
  it.each(pages)("%s has no axe violations", async (_name, load, heading) => {
    const Page = await load();
    const router = createRouter({ routeTree: createRootRoute({ component: () => <main><Page /></main> }), history: createMemoryHistory() });
    const { container } = render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
    await screen.findByText(heading);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
