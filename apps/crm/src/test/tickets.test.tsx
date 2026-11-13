import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { filterTickets, sortTickets, ticketFromLead, type Ticket } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

const base: Ticket = { id: "t", number: 1, workspace_id: "ws", lead_id: null, created_at: "2026-11-01T10:00:00Z", updated_at: "2026-11-01T10:00:00Z", subject: "Login", customer_name: "Anna", customer_email: "anna@example.de", channel: "manual", status: "open", priority: "normal", assigned_to: null };
const tk = (patch: Partial<Ticket>): Ticket => ({ ...base, ...patch });

describe("ticket helpers", () => {
  it("puts urgent tickets first, then the latest change", () => {
    const list = [tk({ id: "a", updated_at: "2026-11-02T09:00:00Z" }), tk({ id: "b", priority: "urgent", updated_at: "2026-11-01T09:00:00Z" }), tk({ id: "c", updated_at: "2026-11-02T11:00:00Z" })];
    expect(sortTickets(list).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("filters by view and search", () => {
    const list = [tk({ id: "open" }), tk({ id: "wait", status: "pending", assigned_to: "me" }), tk({ id: "done", status: "solved", assigned_to: "me" }), tk({ id: "other", number: 42, subject: "Rechnung fehlt" })];
    expect(filterTickets(list, "active", "", "me").map((t) => t.id).sort()).toEqual(["open", "other", "wait"]);
    expect(filterTickets(list, "mine", "", "me").map((t) => t.id)).toEqual(["wait"]);
    expect(filterTickets(list, "solved", "", "me").map((t) => t.id)).toEqual(["done"]);
    expect(filterTickets(list, "all", "#42", "me").map((t) => t.id)).toEqual(["other"]);
    expect(filterTickets(list, "all", "rechnung", "me").map((t) => t.id)).toEqual(["other"]);
  });
  it("takes a ticket's subject and customer from a request", () => {
    expect(ticketFromLead({ id: "l", name: "Ben", email: "Ben@Firma.de", message: "\nDie Rechnung vom März fehlt.\nBitte senden." }))
      .toEqual({ lead_id: "l", subject: "Die Rechnung vom März fehlt.", customer_name: "Ben", customer_email: "ben@firma.de", channel: "request" });
    expect(ticketFromLead({ id: "l", name: "Ben", email: "b@f.de", message: "x".repeat(120) }).subject).toHaveLength(80);
  });
});

// Ticket list with fake data.
const state = vi.hoisted(() => ({ tickets: [] as Ticket[], create: vi.fn() }));
vi.mock("@/lib/auth", () => ({ useWorkspace: () => ({ workspace: { id: "ws", name: "Oprynex", role: "owner", plan: "internal", status: "active", trial_ends_at: null }, workspaces: [], userId: "me" }) }));
vi.mock("@/lib/queries", () => ({
  useTickets: () => ({ data: state.tickets, isPending: false, isError: false }),
  useTeam: () => ({ data: [{ user_id: "me", email: "me@oprynex.de", role: "owner", created_at: "" }] }),
  useTicketChange: () => ({ create: { mutate: state.create, isPending: false, isError: false } }),
}));
const { Route } = await import("@/routes/tickets.index");

function renderList() {
  const Page = Route.options.component!;
  const root = createRootRoute({ component: () => <Page /> });
  const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ["/"] }) });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

afterEach(() => { cleanup(); state.tickets = []; state.create.mockReset(); });

describe("ticket list", () => {
  it("shows open tickets with priority and assignee", async () => {
    state.tickets = [tk({ id: "x", number: 7, subject: "Drucker druckt nicht", priority: "urgent", assigned_to: "me" }), tk({ id: "y", subject: "Erledigt", status: "closed" })];
    renderList();
    expect(await screen.findByText("Drucker druckt nicht")).toBeTruthy();
    expect(screen.getByText("Dringend")).toBeTruthy();
    expect(screen.getByText("me@oprynex.de")).toBeTruthy();
    expect(screen.queryByText("Erledigt")).toBeNull(); // closed tickets are not in the default view
  });
  it("creates a ticket from the form", async () => {
    renderList();
    fireEvent.click(await screen.findByRole("button", { name: "Neues Ticket" }));
    fireEvent.change(screen.getByLabelText("Betreff"), { target: { value: " Passwort vergessen " } });
    fireEvent.change(screen.getByLabelText("E-Mail des Kunden"), { target: { value: "Kunde@Firma.de" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(state.create).toHaveBeenCalled());
    expect(state.create.mock.calls[0]![0]).toMatchObject({ subject: "Passwort vergessen", customer_email: "kunde@firma.de", channel: "phone", priority: "normal" });
  });
  it("refuses a malformed customer email", async () => {
    renderList();
    fireEvent.click(await screen.findByRole("button", { name: "Neues Ticket" }));
    fireEvent.change(screen.getByLabelText("Betreff"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("E-Mail des Kunden"), { target: { value: "kein-mail" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(state.create).not.toHaveBeenCalled();
  });
});
