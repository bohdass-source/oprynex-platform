import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/queries", () => ({ usePlatformChange: () => ({ create: { mutate: create, isPending: false, isError: false } }) }));
const { NewCompany } = await import("@/components/new-company");

afterEach(() => { cleanup(); create.mockReset(); });

describe("setting up a client's company", () => {
  it("sends name, plan, trial and the client's email, and only when both are valid", () => {
    render(<QueryClientProvider client={new QueryClient()}><I18nProvider><NewCompany /></I18nProvider></QueryClientProvider>);
    const button = screen.getByRole("button", { name: "Unternehmen anlegen" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Name des Unternehmens"), { target: { value: " Praxis Weber " } });
    fireEvent.change(screen.getByLabelText("E-Mail des Kunden (Inhaber)"), { target: { value: "Inhaber@Praxis-Weber.de" } });
    fireEvent.change(screen.getByLabelText("Testphase"), { target: { value: "0" } });
    fireEvent.click(button);
    expect(create).toHaveBeenCalledWith({ name: "Praxis Weber", plan: "team", email: "inhaber@praxis-weber.de", trialDays: 0 }, expect.anything());
  });
});
