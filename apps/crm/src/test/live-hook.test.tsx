import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Every query returns rows from `table`: the list query gets all of them, the probe the newest id.
const state = vi.hoisted(() => ({ rows: [] as { id: string; status: string; name: string; company: string | null }[], listCalls: 0 }));
vi.mock("@/lib/supabase", () => ({
  supabase: () => ({
    from: () => ({
      select: (columns: string) => {
        const chain = {
          eq: () => chain,
          order: () => chain,
          limit: (n: number) => {
            if (columns === "id") return Promise.resolve({ data: state.rows.slice(0, n).map(({ id }) => ({ id })), error: null });
            state.listCalls += 1;
            return Promise.resolve({ data: [...state.rows], error: null });
          },
        };
        return chain;
      },
    }),
  }),
}));
import { PROBE_MS, useLiveRequests } from "@/lib/live";

function Probe() {
  useLiveRequests("ws", { title: "Oprynex CRM", arrival: "New request" });
  return null;
}

afterEach(() => { cleanup(); vi.useRealTimers(); state.rows = []; state.listCalls = 0; });

describe("live requests", () => {
  it("reloads the list when a newer request exists and counts it in the tab title", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    state.rows = [{ id: "a", status: "contacted", name: "Anna", company: null }];
    const router = createRouter({ routeTree: createRootRoute({ component: Probe }), history: createMemoryHistory() });
    render(<QueryClientProvider client={new QueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
    await waitFor(() => expect(state.listCalls).toBe(1));
    expect(document.title).toBe("Oprynex CRM");

    state.rows = [{ id: "b", status: "new", name: "Ben", company: "Bau GmbH" }, ...state.rows];
    await vi.advanceTimersByTimeAsync(PROBE_MS);
    await waitFor(() => expect(document.title).toBe("(1) Oprynex CRM"));
    expect(state.listCalls).toBe(2);

    await vi.advanceTimersByTimeAsync(PROBE_MS); // nothing newer: no second reload
    expect(state.listCalls).toBe(2);
  });
});
