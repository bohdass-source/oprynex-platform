import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { can, type Role } from "@/lib/crm";

// Records every delete batch; the database answers with the deleted ids.
const batches = vi.hoisted(() => [] as string[][]);
vi.mock("@/lib/supabase", () => ({
  supabase: () => ({
    from: () => ({ delete: () => ({ in: (_col: string, ids: string[]) => ({ select: () => { batches.push(ids); return Promise.resolve({ data: ids.map((id) => ({ id })), error: null }); } }) }) }),
  }),
}));
const { useDeleteLeads } = await import("@/lib/queries");

describe("deleting requests", () => {
  it("is allowed to owners and admins only", () => {
    expect((["owner", "admin", "member"] as Role[]).map((r) => can(r, "deleteLeads"))).toEqual([true, true, false]);
  });
  it("deletes many requests in batches of 200", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useDeleteLeads("ws"), { wrapper });
    const ids = Array.from({ length: 450 }, (_, i) => `id-${i}`);
    act(() => result.current.mutate(ids));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(batches.map((b) => b.length)).toEqual([200, 200, 50]);
  });
});
