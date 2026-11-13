import { describe, expect, it, vi } from "vitest";
import { outages, runChecks } from "@/lib/status.server";

describe("system status", () => {
  it("reports each part up or down, and the engine's database link only on 200", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("site.oprynex")) return new Response(null, { status: 200 });
      if (u.includes("/auth/v1/health")) return new Response("{}", { status: 200 });
      if (u.includes("/v1/bots/")) return new Response("{}", { status: 403 });
      if (u.startsWith("https://bot.")) return new Response("ok", { status: 200 });
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const checks = await runChecks({ VAPID_PRIVATE_JWK: undefined }, fetcher);
    expect(Object.fromEntries(checks.map((c) => [c.id, c.ok]))).toEqual({ site: true, database: true, engine: true, engineDb: false, push: false });
  });
  it("marks a part down when it cannot be reached", async () => {
    const fetcher = vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    const checks = await runChecks({ VAPID_PRIVATE_JWK: "x" }, fetcher);
    expect(checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["site", "database", "engine", "engineDb"]);
    expect(checks.find((c) => c.id === "site")?.ms).toBeNull();
  });
  it("reaches the site and the engine through the Worker bindings when they exist", async () => {
    const fetcher = vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
    const site = { fetch: vi.fn(async () => new Response(null, { status: 200 })) };
    const bot = { fetch: vi.fn(async () => new Response("{}", { status: 200 })) };
    const checks = await runChecks({ VAPID_PRIVATE_JWK: "x", site, bot }, fetcher);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(site.fetch).toHaveBeenCalledTimes(1);
    expect(bot.fetch).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("calls only what fails twice an outage, and only the site and the engine", async () => {
    let siteCalls = 0;
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("site.oprynex")) return new Response(null, { status: siteCalls++ === 0 ? 503 : 200 });
      if (u.includes("/v1/bots/")) return new Response("{}", { status: 403 });
      if (u.startsWith("https://bot.")) return new Response("down", { status: 502 });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await outages({}, fetcher, 0)).toEqual(["engine"]);
    const healthy = vi.fn(async (url: string | URL | Request) => new Response("{}", { status: String(url).includes("/v1/bots/") ? 403 : 200 })) as unknown as typeof fetch;
    expect(await outages({}, healthy, 0)).toEqual([]);
  });
});
