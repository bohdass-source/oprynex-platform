import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskList } from "@/components/task-list";
import { I18nProvider } from "@/lib/i18n";
import type { Task } from "@/lib/crm";

const { signInWithOtp, verifyOtp } = vi.hoisted(() => ({ signInWithOtp: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: () => ({ auth: { signInWithOtp, verifyOtp, signOut: vi.fn() }, from: vi.fn() }) }));
import { LoginScreen } from "@/routes/__root";

afterEach(() => { cleanup(); signInWithOtp.mockReset(); });

function withProviders(node: ReactNode) {
  const router = createRouter({ routeTree: createRootRoute({ component: () => <>{node}</> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

describe("login", () => {
  it("sends a sign-in link that returns to the dashboard", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    withProviders(<LoginScreen />);
    fireEvent.change(await screen.findByLabelText("E-Mail"), { target: { value: " owner@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Anmeldelink senden" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Link gesendet"));
    expect(signInWithOtp).toHaveBeenCalledWith({ email: "owner@example.com", options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
  });
  it("signs in with the code from the email and explains a wrong one", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    withProviders(<LoginScreen />);
    fireEvent.change(await screen.findByLabelText("E-Mail"), { target: { value: "a@b.de" } });
    fireEvent.click(screen.getByRole("button", { name: "Anmeldelink senden" }));
    fireEvent.change(await screen.findByLabelText("Code aus der E-Mail"), { target: { value: "12 34-56" } });
    fireEvent.click(screen.getByRole("button", { name: "Mit Code anmelden" }));
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ email: "a@b.de", token: "123456", type: "email" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Code");
  });
  it("explains a failed send", async () => {
    signInWithOtp.mockResolvedValue({ error: { message: "rate limit" } });
    withProviders(<LoginScreen />);
    fireEvent.change(await screen.findByLabelText("E-Mail"), { target: { value: "a@b.de" } });
    fireEvent.click(screen.getByRole("button", { name: "Anmeldelink senden" }));
    expect((await screen.findByRole("alert")).textContent).toContain("konnte nicht gesendet");
  });
});

describe("task list", () => {
  it("shows overdue tasks first and links tasks to their request", async () => {
    const tasks: Task[] = [
      { id: "1", workspace_id: "w", lead_id: "lead-1", created_at: "2026-01-01T00:00:00Z", title: "Angebot senden", due_date: "2020-01-01", done_at: null },
      { id: "2", workspace_id: "w", lead_id: null, created_at: "2026-01-01T00:00:00Z", title: "Website prüfen", due_date: null, done_at: null },
    ];
    withProviders(<TaskList tasks={tasks} workspaceId="w" showLead />);
    const headings = (await screen.findAllByRole("heading")).map((h) => h.textContent);
    expect(headings).toEqual(["Überfällig", "Ohne Datum"]);
    expect(screen.getByRole("link", { name: "Zur Anfrage" }).getAttribute("href")).toBe("/leads/lead-1");
  });
});
