import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { botProblems, can, embedCode, emptyBot, parseOrigins, usageSummary, type Bot, type Role } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

describe("bot settings helpers", () => {
  it("turns typed website addresses into origins", () => {
    expect(parseOrigins("Praxis-Weber.de/kontakt\nhttps://www.praxis-weber.de\n\npraxis-weber.de\nlocalhost:5173")).toEqual(["https://praxis-weber.de", "https://www.praxis-weber.de", "http://localhost:5173"]);
  });
  it("finds the same mistakes the database would refuse", () => {
    expect(botProblems({ ...emptyBot(), name: "Assistent", business: "Praxis" })).toEqual([]);
    expect(botProblems({ ...emptyBot(), enabled: true, name: "", business: "Praxis", languages: [], color: "red", privacy_url: "http://x.de" }))
      .toEqual(["name", "origins", "languages", "color", "privacyUrl"]);
    expect(botProblems({ ...emptyBot(), name: "A", business: "B", quick_replies: ["1", "2", "3", "4", "5", "6", "7"], daily_limit: 0 })).toEqual(["quickReplies", "limits"]);
  });
  it("builds the embed line for the engine", () => {
    expect(embedCode("11111111-1111-4111-8111-111111111111")).toBe('<script src="https://bot.oprynex.workers.dev/widget.js" data-bot="11111111-1111-4111-8111-111111111111" async></script>');
  });
  it("sums questions for today and the last 7 days", () => {
    const rows = [{ bot_id: "a", day: "2026-11-02", questions: 4 }, { bot_id: "a", day: "2026-10-27", questions: 3 }, { bot_id: "a", day: "2026-10-26", questions: 9 }, { bot_id: "b", day: "2026-11-02", questions: 7 }];
    expect(usageSummary(rows, "a", "2026-11-02")).toEqual({ today: 4, week: 7 });
  });
  it("lets only owners and admins manage bots", () => {
    expect((["owner", "admin", "member"] as Role[]).map((r) => can(r, "manageBots"))).toEqual([true, true, false]);
  });
});

// The page with a fake workspace and fake data hooks.
const state = vi.hoisted(() => ({ role: "owner", plan: "internal", bots: [] as unknown[], save: vi.fn() }));
vi.mock("@/lib/auth", () => ({ useWorkspace: () => ({ workspace: { id: "ws", name: "Oprynex", role: state.role, plan: state.plan, status: "active", trial_ends_at: null }, userId: "u" }) }));
vi.mock("@/lib/queries", () => ({
  useBots: () => ({ data: state.bots, isPending: false, isError: false }),
  useBotUsage: () => ({ data: [] }),
  useLeads: () => ({ data: [] }),
  useBotChange: () => ({ save: { mutate: state.save, isPending: false, isError: false }, remove: { mutate: vi.fn(), isPending: false, isError: false } }),
}));
const { Route } = await import("@/routes/bots");

function renderPage() {
  const Page = Route.options.component!;
  const router = createRouter({ routeTree: createRootRoute({ component: () => <Page /> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

const bot: Bot = { ...emptyBot(), id: "11111111-1111-4111-8111-111111111111", workspace_id: "ws", created_at: "", updated_at: "", name: "Praxisbot", business: "Praxis Weber", origins: ["https://praxis-weber.de"], enabled: true };

afterEach(() => { cleanup(); state.role = "owner"; state.plan = "internal"; state.bots = []; state.save.mockReset(); });

describe("bots page", () => {
  it("saves the chosen assistant type, website assistant by default", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neuer Bot" }))[0]!);
    expect((screen.getByLabelText(/^Website-Assistent/) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText(/^Termin-Assistent/));
    fireEvent.change(screen.getByLabelText("Name im Chatfenster"), { target: { value: "Termine" } });
    fireEvent.change(screen.getByLabelText("Unternehmen"), { target: { value: "Praxis Weber" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(state.save.mock.calls[0]![0]).toMatchObject({ draft: { kind: "appointment" } });
  });
  it("creates a bot from the form and normalises the websites", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neuer Bot" }))[0]!);
    fireEvent.change(screen.getByLabelText("Name im Chatfenster"), { target: { value: " Praxisbot " } });
    fireEvent.change(screen.getByLabelText("Unternehmen"), { target: { value: "Praxis Weber" } });
    fireEvent.change(screen.getByLabelText(/^Websites/), { target: { value: "Praxis-Weber.de/kontakt" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(state.save.mock.calls[0]![0]).toMatchObject({ id: null, draft: { name: "Praxisbot", origins: ["https://praxis-weber.de"], languages: ["de"] } });
  });
  it("does not save while a field is wrong and says so", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neuer Bot" }))[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect((await screen.findByRole("alert")).textContent).toContain("markierten Felder");
    expect(state.save).not.toHaveBeenCalled();
  });
  it("shows the embed code for a saved bot", async () => {
    state.bots = [bot];
    renderPage();
    expect(await screen.findByText(embedCode(bot.id))).toBeTruthy();
  });
  it("shows members the settings without a way to change them", async () => {
    state.role = "member";
    state.bots = [bot];
    renderPage();
    expect(await screen.findByText("Nur Inhaber und Admins können Bots ändern.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Speichern" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Neuer Bot" })).toBeNull();
  });
});

describe("bots by plan", () => {
  it("offers no new bot below the Business plan and says why", async () => {
    state.plan = "team";
    renderPage();
    expect(await screen.findByText(/gehören zum Tarif Business/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Neuer Bot" })).toBeNull();
  });
  it("knows which plans include integrations", async () => {
    const { hasIntegrations } = await import("@/lib/crm");
    expect((["internal", "start", "team", "business"] as const).map((plan) => hasIntegrations({ plan, status: "active" }))).toEqual([true, false, false, true]);
    expect(hasIntegrations({ plan: "business", status: "paused" })).toBe(false);
  });
});

describe("bot preview", () => {
  it("links to the engine's demo page in the bot's first language", async () => {
    const { previewUrl } = await import("@/lib/crm");
    expect(previewUrl({ id: "abc", languages: ["en", "de"] })).toBe("https://bot.oprynex.workers.dev/demo/abc?lang=en");
  });
  it("offers the preview only when the engine address is allowed", async () => {
    state.bots = [{ ...bot, origins: ["https://praxis-weber.de", "https://bot.oprynex.workers.dev"] }];
    renderPage();
    expect((await screen.findByRole("link", { name: "Vorschau öffnen" })).getAttribute("href")).toContain(`/demo/${bot.id}`);
    cleanup();
    state.bots = [bot];
    renderPage();
    expect(await screen.findByRole("button", { name: "Vorschau erlauben" })).toBeTruthy();
  });
});
