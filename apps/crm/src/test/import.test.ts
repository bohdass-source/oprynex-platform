import { describe, expect, it } from "vitest";
import { PERMISSIONS, can } from "@/lib/crm";
import { buildRows, guessMapping, parseCsv, parseDate, rowsToImport } from "@/lib/importer";

const NOW = new Date("2026-10-31T12:00:00Z");

describe("csv import", () => {
  it("reads German Excel exports with semicolons, quotes and a byte order mark", () => {
    const rows = parseCsv('﻿Name;E-Mail;Notiz\r\n"Müller; Anna";anna@x.de;"sagt ""hallo"""\r\n\r\nTom;tom@y.de;\n');
    expect(rows).toEqual([["Name", "E-Mail", "Notiz"], ["Müller; Anna", "anna@x.de", 'sagt "hallo"'], ["Tom", "tom@y.de", ""]]);
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("maps columns by their names in German, Russian and English, each field once", () => {
    expect(guessMapping(["Firma", "Ansprechpartner", "E-Mail", "Betrag", "Status", "Notizen", "Fax"]))
      .toEqual(["company", "name", "email", "value", "status", "message", null]);
    expect(guessMapping(["Имя", "Почта", "Компания", "Сумма", "Дата"])).toEqual(["name", "email", "company", "value", "date"]);
    expect(guessMapping(["Email", "Email 2"])).toEqual(["email", null]);
  });
  it("reads dates day first and rejects impossible ones", () => {
    expect((parseDate("01.03.2026") as Date).getMonth()).toBe(2);
    expect((parseDate("2026-03-01") as Date).getDate()).toBe(1);
    expect(parseDate("31.02.2026")).toBe("invalid");
    expect(parseDate("")).toBeNull();
  });
  it("checks each row, recognises labels and marks duplicates", () => {
    const mapping = guessMapping(["Name", "E-Mail", "Produkt", "Wert", "Status", "Datum"]);
    const rows = buildRows([
      ["Anna", "Anna@X.de", "Website", "1.500", "Gewonnen", "01.03.2026"],
      ["", "kunde@firma.de", "чатбот", "", "", ""],
      ["Bob", "bob@", "", "abc", "", "01.01.2030"],
      ["Anna again", "anna@x.de", "", "", "", ""],
      ["Old", "old@crm.de", "", "", "", ""],
    ], mapping, new Set(["old@crm.de"]), NOW);
    expect(rows[0]).toMatchObject({ line: 2, email: "anna@x.de", product: "website", value_eur: 1500, status: "won", problems: [], duplicate: null });
    expect(rows[1]).toMatchObject({ name: "kunde", status: "new", language: "de", problems: [] });
    expect(rows[2]!.problems).toEqual(["badEmail", "badValue", "futureDate"]);
    expect(rows[3]!.duplicate).toBe("repeat");
    expect(rows[4]!.duplicate).toBe("exists");
    expect(rowsToImport(rows, false).map((r) => r.line)).toEqual([2, 3]);
    expect(rowsToImport(rows, true).map((r) => r.line)).toEqual([2, 3, 5, 6]);
  });
});

describe("roles", () => {
  it("owners may do everything, admins all but roles, members only the daily work", () => {
    expect(PERMISSIONS.every((p) => can("owner", p))).toBe(true);
    expect(PERMISSIONS.filter((p) => !can("admin", p))).toEqual(["changeRoles"]);
    expect(PERMISSIONS.filter((p) => can("member", p))).toEqual(["viewLeads", "workPipeline", "logActivity", "manageTasks"]);
  });
});
