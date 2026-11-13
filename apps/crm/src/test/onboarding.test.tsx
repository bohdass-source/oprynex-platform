import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onboardingDone, planRequestMailto, type Workspace } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

// This test environment has no browser storage; the card only needs getItem and setItem.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), clear: () => store.clear() });

describe("onboarding and plan helpers", () => {
  it("marks the first steps done from what the company already has", () => {
    expect(onboardingDone({ forms: 0, sites: 0, members: 1, invites: 0, leads: 0, push: false })).toEqual({ form: false, team: false, data: false, push: false });
    expect(onboardingDone({ forms: 0, sites: 1, members: 1, invites: 1, leads: 3, push: true })).toEqual({ form: true, team: true, data: true, push: true });
  });
  it("writes a plan request to Oprynex with the plan and the company", () => {
    expect(planRequestMailto("Praxis Weber", "team", "Oprynex Cloud Tarif")).toBe("mailto:kontakt@example.com?subject=Oprynex%20Cloud%20Tarif%3A%20Team%20%C2%B7%20Praxis%20Weber");
  });
});

// A new company on the Start trial with one member, no forms and no requests yet.
const state = vi.hoisted(() => ({ role: "owner", forms: [] as unknown[], leads: [] as unknown[] }));
const workspace = (): Workspace => ({ id: "ws", name: "Praxis Weber", role: state.role as Workspace["role"], plan: "start", status: "trial", trial_ends_at: new Date(Date.now() + 5 * 86_400_000).toISOString() });
vi.mock("@/lib/auth", () => ({ useWorkspace: () => ({ workspace: workspace(), userId: "u" }) }));
vi.mock("@/lib/push-client", () => ({ pushIsOn: () => false }));
vi.mock("@/lib/queries", () => ({
  useForms: () => ({ data: state.forms }),
  useSites: () => ({ data: [] }),
  useTeam: () => ({ data: [{ user_id: "u", email: "anna@praxis-weber.de", role: "owner" }] }),
  useInvites: () => ({ data: [] }),
  useLeads: () => ({ data: state.leads }),
}));
const { OnboardingCard } = await import("@/components/onboarding");
const { Route } = await import("@/routes/plan");

function renderIn(node: () => ReactNode) {
  const router = createRouter({ routeTree: createRootRoute({ component: node }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

afterEach(() => { cleanup(); state.role = "owner"; state.forms = []; state.leads = []; localStorage.clear(); });

describe("onboarding card", () => {
  it("lists the four first steps with links and hides for good on request", async () => {
    renderIn(() => <OnboardingCard workspace={workspace()} />);
    expect(await screen.findByText("Erste Schritte")).toBeTruthy();
    expect(screen.getByText("0 von 4 erledigt. So kommen Anfragen und Kunden in Ihr CRM.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Los" }).map((a) => a.getAttribute("href"))).toEqual(["/forms", "/team", "/import"]);
    fireEvent.click(screen.getByRole("button", { name: "Ausblenden" }));
    expect(screen.queryByText("Erste Schritte")).toBeNull();
    expect(localStorage.getItem("oprynex-onboarding-hidden-ws")).toBe("1");
  });
  it("counts what is done and stays away from members", async () => {
    state.forms = [{ id: "f" }];
    state.leads = [{ id: "l" }];
    renderIn(() => <OnboardingCard workspace={workspace()} />);
    expect(await screen.findByText("2 von 4 erledigt. So kommen Anfragen und Kunden in Ihr CRM.")).toBeTruthy();
    cleanup();
    state.role = "member";
    renderIn(() => <OnboardingCard workspace={workspace()} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Erste Schritte")).toBeNull();
  });
});

describe("plan page", () => {
  it("shows the plan, trial, seats and an email request for each plan", async () => {
    const Page = Route.options.component!;
    renderIn(() => <Page />);
    expect(await screen.findByText("Nutzer: 1 von 2")).toBeTruthy();
    expect(screen.getByText(/Testphase bis/)).toBeTruthy();
    expect(screen.getByText("Ihr Tarif")).toBeTruthy();
    const continueLink = screen.getByRole("link", { name: "Mit diesem Tarif weitermachen" });
    expect(continueLink.getAttribute("href")).toContain("Start%20%C2%B7%20Praxis%20Weber");
    expect(screen.getAllByRole("link", { name: "Diesen Tarif anfragen" })).toHaveLength(2);
  });
});
