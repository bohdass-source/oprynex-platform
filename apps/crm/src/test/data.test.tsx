import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { can, type Role } from "@/lib/crm";
import { toCsv } from "@/lib/export";
import { I18nProvider } from "@/lib/i18n";

describe("CSV export", () => {
  it("writes a header even without rows, quotes what needs it and defuses spreadsheet formulas", () => {
    expect(toCsv([], ["name", "email"])).toBe("name,email\r\n");
    const csv = toCsv([{ name: 'Anna "Ani" Klein', email: "anna@example.de", message: "=HYPERLINK(\"x\")", tags: ["a", "b"], empty: null }], ["name", "email", "message", "tags", "empty"]);
    expect(csv).toBe('name,email,message,tags,empty\r\n"Anna ""Ani"" Klein",anna@example.de,"\'=HYPERLINK(""x"")",a | b,\r\n');
  });
  it("lets owners and admins manage the company's data", () => {
    expect((["owner", "admin", "member"] as Role[]).map((r) => can(r, "manageData"))).toEqual([true, true, false]);
  });
});

const state = vi.hoisted(() => ({ role: "owner", plan: "start", read: vi.fn(), downloads: [] as string[], retention: vi.fn(), del: vi.fn(), reload: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  useWorkspace: () => ({ workspace: { id: "ws", name: "Praxis Weber", role: state.role, plan: state.plan, status: "trial", trial_ends_at: null }, userId: "u" }),
  useAuthActions: () => ({ reload: state.reload, switchTo: vi.fn() }),
}));
vi.mock("@/lib/export", async (original) => ({
  ...(await original<typeof import("@/lib/export")>()),
  readCompany: state.read,
  download: (name: string) => state.downloads.push(name),
}));
vi.mock("@/lib/queries", () => ({
  useRetention: () => ({ data: null, isPending: false }),
  useDataChange: () => ({ setRetention: { mutate: state.retention, isPending: false, isError: false }, deleteCompany: { mutate: state.del, isPending: false, isError: false } }),
}));
const { Route } = await import("@/routes/data");

function renderPage() {
  const Page = Route.options.component!;
  const router = createRouter({ routeTree: createRootRoute({ component: () => <Page /> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

afterEach(() => { cleanup(); state.role = "owner"; state.plan = "start"; state.read.mockReset(); state.downloads = []; state.retention.mockReset(); state.del.mockReset(); });

describe("data page", () => {
  it("exports the company as CSV and JSON", async () => {
    state.read.mockResolvedValue({ leads: [{ name: "Anna" }], lead_events: [], tasks: [], tickets: [], ticket_messages: [], web_forms: [], bots: [] });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Anfragen als CSV" }));
    await waitFor(() => expect(state.downloads[0]).toMatch(/^praxis-weber-anfragen-\d{4}-\d{2}-\d{2}\.csv$/));
    fireEvent.click(screen.getByRole("button", { name: "Alles als JSON" }));
    await waitFor(() => expect(state.downloads[1]).toMatch(/^praxis-weber-export-.*\.json$/));
  });
  it("sets the retention in months", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Aufbewahrung"), { target: { value: "6" } });
    expect(state.retention).toHaveBeenCalledWith(6);
  });
  it("deletes the company only after the exact name is typed", async () => {
    renderPage();
    const button = await screen.findByRole("button", { name: "Endgültig löschen" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Namen des Unternehmens eingeben/), { target: { value: "Praxis Weber" } });
    fireEvent.click(button);
    expect(state.del).toHaveBeenCalledWith("Praxis Weber", expect.anything());
  });
  it("never offers deletion to members or for Oprynex's own workspace", async () => {
    state.role = "admin";
    renderPage();
    expect(await screen.findByText("Nur der Inhaber kann das Unternehmen löschen.")).toBeTruthy();
    cleanup();
    state.role = "owner"; state.plan = "internal";
    renderPage();
    expect(await screen.findByText("Der interne Arbeitsbereich von Oprynex kann nicht gelöscht werden.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Endgültig löschen" })).toBeNull();
  });
});
