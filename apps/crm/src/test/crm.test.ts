import { describe, expect, it } from "vitest";
import { countByStatus, filterLeads, isoDate, replyMailto, sortTasks, taskGroup, type Lead, type Task } from "@/lib/crm";

const lead = (over: Partial<Lead>): Lead => ({
  id: "1", workspace_id: "w", created_at: "2026-10-30T10:00:00Z", updated_at: "2026-10-30T10:00:00Z", name: "Anna Müller", email: "anna@autohaus.de",
  company: "Autohaus Müller", message: "Wir brauchen einen Chatbot", source: "contact_form", chat_topic: null, language: "de", page_path: "/", consent_at: "2026-10-30T10:00:00Z",
  status: "new", assigned_to: null, product: null, value_eur: null, ...over,
});
const task = (over: Partial<Task>): Task => ({ id: "t", workspace_id: "w", lead_id: null, created_at: "2026-10-30T10:00:00Z", title: "Call", due_date: null, done_at: null, ...over });

describe("leads", () => {
  const leads = [lead({ id: "a" }), lead({ id: "b", status: "proposal", name: "Ivan", company: null, email: "ivan@x.ru" }), lead({ id: "c", status: "won" }), lead({ id: "d", status: "spam", message: "Buy cheap stuff now" })];
  it("opens on unfinished requests and filters by one status", () => {
    expect(filterLeads(leads, "open", "").map((l) => l.id)).toEqual(["a", "b"]);
    expect(filterLeads(leads, "won", "").map((l) => l.id)).toEqual(["c"]);
    expect(filterLeads(leads, "all", "").length).toBe(4);
  });
  it("searches name, email, company and message case-insensitively", () => {
    expect(filterLeads(leads, "all", "IVAN@").map((l) => l.id)).toEqual(["b"]);
    expect(filterLeads(leads, "all", "cheap").map((l) => l.id)).toEqual(["d"]);
    expect(filterLeads(leads, "open", "autohaus").map((l) => l.id)).toEqual(["a"]);
  });
  it("counts each status and the open group", () => {
    expect(countByStatus(leads)).toMatchObject({ all: 4, open: 2, new: 1, proposal: 1, won: 1, spam: 1, lost: 0 });
  });
  it("builds a reply link with a subject in the visitor's language", () => {
    expect(replyMailto({ email: "a@b.de", language: "de" }, "Oprynex")).toBe("mailto:a%40b.de?subject=Ihre%20Anfrage%20bei%20Oprynex");
    expect(replyMailto({ email: "a@b.de", language: "de" }, "Praxis Weber")).toContain("Ihre%20Anfrage%20bei%20Praxis%20Weber");
    expect(replyMailto({ email: "a@b.pl", language: "pl" }, "Oprynex")).toContain("Your%20request");
  });
});

describe("tasks", () => {
  const today = "2026-10-31";
  it("groups by due date", () => {
    expect(taskGroup(task({ due_date: "2026-10-30" }), today)).toBe("overdue");
    expect(taskGroup(task({ due_date: today }), today)).toBe("today");
    expect(taskGroup(task({ due_date: "2026-11-02" }), today)).toBe("upcoming");
    expect(taskGroup(task({}), today)).toBe("someday");
    expect(taskGroup(task({ due_date: "2026-10-01", done_at: "2026-10-02T00:00:00Z" }), today)).toBe("done");
  });
  it("sorts open by date, undated after, done last", () => {
    const sorted = sortTasks([task({ id: "done", done_at: "2026-10-30T00:00:00Z" }), task({ id: "none" }), task({ id: "late", due_date: "2026-11-05" }), task({ id: "soon", due_date: "2026-11-01" })]);
    expect(sorted.map((t) => t.id)).toEqual(["soon", "late", "none", "done"]);
  });
  it("formats a local date like a Postgres date", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("request number search", () => {
  it("finds a request by the 8 character number the site shows the visitor", async () => {
    const { filterLeads } = await import("@/lib/crm");
    const lead = { id: "1c662a74-e18f-46fc-ae02-c2304326b367", name: "A", email: "a@b.de", company: null, message: "x", status: "new" } as unknown as Parameters<typeof filterLeads>[0][number];
    expect(filterLeads([lead], "all", "1C662A74")).toHaveLength(1);
    expect(filterLeads([lead], "all", "2c662a74")).toHaveLength(0);
  });
});

describe("reply templates", () => {
  it("fill name, company and ticket number in the customer's language", async () => {
    const { REPLY_TEMPLATES, replyLanguage, replyLink } = await import("@/lib/reply-templates");
    const solved = REPLY_TEMPLATES.find((tpl) => tpl.id === "solved")!;
    const link = replyLink("anna@example.de", "Re: [#7] Login", solved, "de", { name: "Anna Klein", company: "Praxis Weber", number: "#7" });
    const body = decodeURIComponent(link.split("&body=")[1]!);
    expect(body).toContain("Guten Tag Anna Klein");
    expect(body).toContain("Ihr Anliegen (#7) ist erledigt");
    expect(body).toContain("Praxis Weber");
    expect(body).not.toMatch(/\{\w+\}|Oprynex/);
    expect(replyLink("a@b.de", "Hallo", null, "de", { name: "A", company: "B" })).toBe("mailto:a%40b.de?subject=Hallo");
    expect([replyLanguage("ru", "de"), replyLanguage("pl", "de"), replyLanguage(null, "ru")]).toEqual(["ru", "en", "ru"]);
  });
  it("exist in all three languages without leftover placeholders", async () => {
    const { REPLY_TEMPLATES } = await import("@/lib/reply-templates");
    for (const tpl of REPLY_TEMPLATES) for (const lang of ["de", "ru", "en"] as const) {
      expect(tpl.body[lang]).toContain("{company}");
      expect(tpl.body[lang].replace(/\{(name|company|number)\}/g, "")).not.toMatch(/\{/);
    }
  });
});

describe("support figures", () => {
  it("count open, waiting, done in 30 days and the oldest open ticket", async () => {
    const { ticketStats } = await import("@/lib/crm");
    const now = new Date("2026-11-03T12:00:00Z");
    const at = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
    const rows = [
      { status: "open" as const, created_at: at(5), updated_at: at(1) },
      { status: "pending" as const, created_at: at(2), updated_at: at(2) },
      { status: "solved" as const, created_at: at(40), updated_at: at(10) },
      { status: "closed" as const, created_at: at(90), updated_at: at(60) },
    ];
    expect(ticketStats(rows, now)).toEqual({ open: 1, pending: 1, done30: 1, oldestOpenDays: 5 });
    expect(ticketStats([], now).oldestOpenDays).toBeNull();
  });
});
