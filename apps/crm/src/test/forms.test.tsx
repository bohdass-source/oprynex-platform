import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { can, emptyForm, formEmbedCode, formPreviewUrl, formProblems, type Role, type WebForm } from "@/lib/crm";
import { I18nProvider } from "@/lib/i18n";

const ID = "22222222-2222-4222-8222-222222222222";
const SUPPORT = "33333333-3333-4333-8333-333333333333";

describe("website form helpers", () => {
  it("finds the same mistakes the database would refuse", () => {
    expect(formProblems({ ...emptyForm(), name: "Kontakt", origins: ["https://firma.de"], privacy_url: "https://firma.de/datenschutz" })).toEqual([]);
    expect(formProblems({ ...emptyForm(), name: "Entwurf", enabled: false })).toEqual([]);
    expect(formProblems({ ...emptyForm(), name: "", color: "red", daily_limit: 0 })).toEqual(["name", "origins", "color", "privacyUrl", "limits"]);
    expect(formProblems({ ...emptyForm(), name: "K", origins: ["https://firma.de"], privacy_url: "http://firma.de/datenschutz" })).toEqual(["privacyUrl"]);
  });
  it("builds the two embed lines and the preview address for the engine", () => {
    expect(formEmbedCode(ID)).toBe(`<div data-oprynex-form="${ID}"></div>\n<script src="https://bot.oprynex.workers.dev/form.js" async></script>`);
    expect(formPreviewUrl(ID)).toBe(`https://bot.oprynex.workers.dev/form-demo/${ID}`);
  });
  it("lets only owners and admins manage forms", () => {
    expect((["owner", "admin", "member"] as Role[]).map((r) => can(r, "manageForms"))).toEqual([true, true, false]);
  });
});

// The page with a fake workspace and fake data hooks. Forms are on every plan, so the workspace here is on Start.
const state = vi.hoisted(() => ({ role: "owner", forms: [] as unknown[], save: vi.fn() }));
vi.mock("@/lib/auth", () => ({ useWorkspace: () => ({ workspace: { id: "ws", name: "Praxis Weber", role: state.role, plan: "start", status: "trial", trial_ends_at: null }, userId: "u" }) }));
vi.mock("@/lib/queries", () => ({
  useForms: () => ({ data: state.forms, isPending: false, isError: false }),
  useLeads: () => ({ data: [{ form_id: ID }, { form_id: ID }, { form_id: null }] }),
  useTickets: () => ({ data: [{ form_id: SUPPORT }, { form_id: null }] }),
  useFormChange: () => ({ save: { mutate: state.save, isPending: false, isError: false }, remove: { mutate: vi.fn(), isPending: false, isError: false } }),
}));
const { Route } = await import("@/routes/forms");

function renderPage() {
  const Page = Route.options.component!;
  const router = createRouter({ routeTree: createRootRoute({ component: () => <Page /> }), history: createMemoryHistory() });
  return render(<QueryClientProvider client={new QueryClient()}><I18nProvider><RouterProvider router={router} /></I18nProvider></QueryClientProvider>);
}

const form: WebForm = { ...emptyForm(), id: ID, workspace_id: "ws", created_at: "", updated_at: "", name: "Kontakt Startseite", origins: ["https://praxis-weber.de"], privacy_url: "https://praxis-weber.de/datenschutz" };

afterEach(() => { cleanup(); state.role = "owner"; state.forms = []; state.save.mockReset(); });

describe("website forms page", () => {
  it("creates a form on the Start plan, normalises the websites and names the company in the consent preview", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neues Formular" }))[0]!);
    expect(screen.getByText(/dass Praxis Weber meine Angaben/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name (nur im CRM sichtbar)"), { target: { value: " Kontakt " } });
    fireEvent.change(screen.getByLabelText(/^Websites/), { target: { value: "Praxis-Weber.de/kontakt" } });
    fireEvent.change(screen.getByLabelText(/^Link zu Ihrer Datenschutzerklärung/), { target: { value: "https://praxis-weber.de/datenschutz" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(state.save.mock.calls[0]![0]).toMatchObject({ id: null, draft: { name: "Kontakt", origins: ["https://praxis-weber.de"], privacy_url: "https://praxis-weber.de/datenschutz", enabled: true } });
  });
  it("does not save an active form without the privacy policy link", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neues Formular" }))[0]!);
    fireEvent.change(screen.getByLabelText("Name (nur im CRM sichtbar)"), { target: { value: "Kontakt" } });
    fireEvent.change(screen.getByLabelText(/^Websites/), { target: { value: "praxis-weber.de" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(await screen.findByText("Bitte die markierten Felder prüfen.")).toBeTruthy();
    expect(state.save).not.toHaveBeenCalled();
  });
  it("shows the embed code and the requests of a saved form", async () => {
    state.forms = [form];
    renderPage();
    expect(await screen.findByText(/data-oprynex-form="22222222/)).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
  it("creates a support form without the company field", async () => {
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: "Neues Formular" }))[0]!);
    expect(screen.getByLabelText("Feld „Firma“ anzeigen")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Support: Fragen bestehender Kunden als Ticket"));
    expect(screen.queryByLabelText("Feld „Firma“ anzeigen")).toBeNull();
    fireEvent.change(screen.getByLabelText("Name (nur im CRM sichtbar)"), { target: { value: "Support" } });
    fireEvent.change(screen.getByLabelText(/^Websites/), { target: { value: "praxis-weber.de" } });
    fireEvent.change(screen.getByLabelText(/^Link zu Ihrer Datenschutzerklärung/), { target: { value: "https://praxis-weber.de/datenschutz" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(state.save.mock.calls[0]![0]).toMatchObject({ draft: { purpose: "support" } });
  });
  it("counts tickets for a support form", async () => {
    state.forms = [{ ...form, id: SUPPORT, name: "Support", purpose: "support" }];
    renderPage();
    expect((await screen.findAllByText(/Tickets aus dem Formular/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });
  it("is read only for members", async () => {
    state.role = "member";
    state.forms = [form];
    renderPage();
    expect(await screen.findByText("Nur Inhaber und Admins können Formulare ändern.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Neues Formular" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Speichern" })).toBeNull();
  });
});
