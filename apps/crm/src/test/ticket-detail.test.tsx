import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Ticket, TicketMessage } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

// A ticket opened through a support form: the customer's own words are the first entry of the conversation.
const ticket: Ticket = {
  id: "t1", number: 1042, workspace_id: "ws", lead_id: null, created_at: "2026-11-03T10:00:00Z", updated_at: "2026-11-03T10:00:00Z",
  subject: "Rechnung fehlt", customer_name: "Anna Klein", customer_email: "anna@example.de", channel: "web", status: "open", priority: "normal", assigned_to: null, form_id: "f1",
};
const messages: TicketMessage[] = [
  { id: "m1", ticket_id: "t1", created_at: "2026-11-03T10:00:00Z", author_id: null, kind: "customer", body: "Ich habe die Rechnung vom Oktober nicht erhalten.", from_status: null, to_status: null },
  { id: "m2", ticket_id: "t1", created_at: "2026-11-03T10:05:00Z", author_id: "u", kind: "note", body: "Buchhaltung fragen.", from_status: null, to_status: null },
];
const idle = { mutate: vi.fn(), isPending: false, isError: false };
vi.mock("@/lib/auth", () => ({ useWorkspace: () => ({ workspace: { id: "ws", name: "Praxis Weber", role: "owner", plan: "start", status: "active", trial_ends_at: null }, userId: "u" }) }));
vi.mock("@/lib/queries", () => ({
  useTicket: () => ({ data: ticket, isPending: false, isError: false, isSuccess: true }),
  useTicketMessages: () => ({ data: messages, isPending: false }),
  useTicketChange: () => ({ update: idle, remove: idle, addMessage: idle, removeMessage: idle }),
  useTeam: () => ({ data: [{ user_id: "u", email: "team@praxis-weber.de", role: "owner" }] }),
}));
vi.mock("@tanstack/react-router", async (original) => {
  const actual = await original<typeof import("@tanstack/react-router")>();
  return { ...actual, createFileRoute: () => (options: Record<string, unknown>) => ({ options, useParams: () => ({ id: "t1" }) }) };
});
const { Route } = await import("@/routes/tickets.$id");

function renderPage() {
  const Page = (Route as unknown as { options: { component: () => React.ReactNode } }).options.component;
  const router = createRouter({ routeTree: createRootRoute({ component: () => <Page /> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

afterEach(cleanup);

describe("ticket from a support form", () => {
  it("shows the channel and the customer's message from the customer, and only the member's own note can be deleted", async () => {
    renderPage();
    expect(await screen.findByText(/#1042 · Website-Formular/)).toBeTruthy();
    expect(screen.getByText("Nachricht des Kunden")).toBeTruthy();
    expect(screen.getByText("Ich habe die Rechnung vom Oktober nicht erhalten.")).toBeTruthy();
    expect(screen.getByText(/anna@example\.de ·/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Eintrag löschen" })).toHaveLength(1);
  });
});
