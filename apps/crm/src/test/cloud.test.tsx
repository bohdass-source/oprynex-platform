import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOUD_PLANS, ROLES, pickWorkspace, rolesForPlan, seatLimit, trialDaysLeft } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

describe("plans", () => {
  it("use the example plan prices and seats", () => {
    // Same numbers as `prices.cloud` and `prices.users` in oprynex-site/src/lib/offers.ts.
    expect(Object.fromEntries(Object.entries(CLOUD_PLANS).map(([k, v]) => [k, [v.price, v.users]]))).toEqual({ start: [30, 2], team: [100, 5], business: [200, 12] });
  });
  it("limit seats and roles by plan", () => {
    expect([seatLimit("start"), seatLimit("team"), seatLimit("business"), seatLimit("internal")]).toEqual([2, 5, 12, null]);
    expect(rolesForPlan("start", ROLES)).toEqual(["owner", "member"]);
    expect(rolesForPlan("team", ROLES)).toEqual(["owner", "admin", "member"]);
  });
  it("counts trial days left", () => {
    const now = new Date("2026-11-02T10:00:00Z");
    expect(trialDaysLeft({ status: "trial", trial_ends_at: "2026-11-16T10:00:00Z" }, now)).toBe(13);
    expect(trialDaysLeft({ status: "trial", trial_ends_at: "2026-11-02T20:00:00Z" }, now)).toBe(0);
    expect(trialDaysLeft({ status: "trial", trial_ends_at: "2026-11-01T10:00:00Z" }, now)).toBeLessThan(0);
    expect(trialDaysLeft({ status: "active", trial_ends_at: null }, now)).toBeNull();
  });
  it("opens the remembered workspace, or the oldest one", () => {
    const list = [{ id: "a" }, { id: "b" }];
    expect(pickWorkspace(list, "b")?.id).toBe("b");
    expect(pickWorkspace(list, "gone")?.id).toBe("a");
    expect(pickWorkspace([], null)).toBeUndefined();
  });
});

// Sign-up screen with a fake database call.
const state = vi.hoisted(() => ({ mutate: vi.fn(), reload: vi.fn(), error: null as unknown }));
vi.mock("@/lib/queries", () => ({ useCreateWorkspace: () => ({ mutate: state.mutate, isPending: false, isError: !!state.error, error: state.error }) }));
vi.mock("@/lib/auth", () => ({ AuthProvider: ({ children }: { children: ReactNode }) => children, useAuth: () => ({ kind: "loading" }), useAuthActions: () => ({ reload: state.reload, switchTo: vi.fn() }) }));
vi.mock("@/lib/supabase", () => ({ supabase: () => ({ auth: { signOut: vi.fn() } }) }));
const { CreateWorkspace } = await import("@/routes/__root");

function renderSignup() {
  const router = createRouter({ routeTree: createRootRoute({ component: () => <CreateWorkspace email="neu@firma.de" /> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

afterEach(() => { cleanup(); state.mutate.mockReset(); state.error = null; });

describe("self sign-up", () => {
  it("creates the company on the chosen plan and reloads into it", async () => {
    state.mutate.mockImplementation((_vars, options: { onSuccess: () => void }) => options.onSuccess());
    renderSignup();
    fireEvent.change(await screen.findByLabelText("Name des Unternehmens"), { target: { value: "  Bau Müller GmbH " } });
    fireEvent.click(screen.getByLabelText(/^start/i));
    fireEvent.click(screen.getByRole("button", { name: "14 Tage kostenlos testen" }));
    await waitFor(() => expect(state.mutate).toHaveBeenCalled());
    expect(state.mutate.mock.calls[0]![0]).toEqual({ name: "Bau Müller GmbH", plan: "start" });
    expect(state.reload).toHaveBeenCalled();
  });
  it("needs a company name", async () => {
    renderSignup();
    fireEvent.click(await screen.findByRole("button", { name: "14 Tage kostenlos testen" }));
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it("explains that one account creates one company", async () => {
    state.error = { message: "already_created" };
    renderSignup();
    expect((await screen.findByRole("alert")).textContent).toContain("schon ein Unternehmen");
  });
});
