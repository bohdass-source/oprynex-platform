// Contact import: read a CSV export, map its columns to lead fields, check every row and mark duplicates.
// Pure functions, so the wizard and the tests share one set of rules.
import { STATUSES, type Status } from "@/lib/crm";
import { productLabel, statusLabel } from "@/lib/i18n";
import { PRODUCTS, parseValue, type Product } from "@/lib/products";

export const IMPORT_FIELDS = ["name", "email", "company", "message", "product", "value", "status", "date", "language"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
/** Column index → field; a column mapped to nothing is ignored. */
export type Mapping = (ImportField | null)[];

export const MAX_IMPORT_ROWS = 2000;
// The site's visitor languages (leads_language_check); anything else becomes German, the site default.
const LANGUAGES = ["de", "en", "fr", "es", "it", "nl", "pl", "pt", "ro", "cs", "hu", "bg", "el", "sv", "da", "fi", "tr", "ru", "uk", "kk"];

/** Splits CSV text into rows of cells. Detects comma, semicolon (German Excel) or tab, and honours quotes. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].map((d) => ({ d, n: firstLine.split(d).length })).sort((a, b) => b.n - a.n)[0]!.d;
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

const HEADER_WORDS: Record<ImportField, RegExp> = {
  email: /e-?mail|почт|адрес эл/i,
  name: /^(name|vor.*name|nach.*name|full ?name|kontakt|contact|имя|фио|клиент|ansprechpartner)/i,
  company: /firma|company|unternehmen|organi|компан|организ/i,
  message: /nachricht|message|notiz|note|comment|kommentar|beschreibung|сообщ|коммент|заметк|описан/i,
  product: /produkt|product|leistung|service|продукт|услуг/i,
  value: /wert|value|betrag|amount|umsatz|budget|preis|price|сумм|бюджет|цена/i,
  status: /status|stage|phase|stufe|этап|статус/i,
  date: /datum|date|created|erstellt|eingang|дата|созда/i,
  language: /sprache|language|lang|язык/i,
};

/** Guesses the field of each column from its header; each field is used once, the first matching column wins. */
export function guessMapping(headers: string[]): Mapping {
  const used = new Set<ImportField>();
  return headers.map((header) => {
    const field = IMPORT_FIELDS.find((f) => !used.has(f) && HEADER_WORDS[f].test(header.trim()));
    if (field) used.add(field);
    return field ?? null;
  });
}

const fold = (s: string) => s.trim().toLowerCase();
function matchLabel<T extends string>(input: string, codes: readonly T[], labels: Record<string, Record<string, string>>): T | null {
  const value = fold(input);
  if (!value) return null;
  return codes.find((code) => code === value || Object.values(labels[code] ?? {}).some((label) => fold(label) === value || fold(label).includes(value) && value.length >= 3)) ?? null;
}

/** Reads 2026-03-01, 01.03.2026 or 1/3/2026 (day first); null for an empty or unreadable cell. */
export function parseDate(input: string): Date | null | "invalid" {
  const s = input.trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  const parts = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : (m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(s)) ? [Number(m[3]), Number(m[2]), Number(m[1])] : null;
  if (!parts) return "invalid";
  const [y, mo, d] = parts as [number, number, number];
  const date = new Date(y, mo - 1, d, 12);
  return date.getMonth() === mo - 1 && date.getDate() === d ? date : "invalid";
}

export type ImportProblem = "noEmail" | "badEmail" | "badValue" | "badDate" | "futureDate" | "tooLong";
export type ImportRow = {
  line: number;
  name: string; email: string; company: string | null; message: string;
  product: Product | null; value_eur: number | null; status: Status; created_at: string | null; language: string;
  problems: ImportProblem[];
  /** exists: the workspace already has this address; repeat: an earlier row of the file has it. */
  duplicate: "exists" | "repeat" | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turns mapped records into checked rows. existingEmails are the workspace's addresses, lower-cased. */
export function buildRows(records: string[][], mapping: Mapping, existingEmails: Set<string>, now = new Date()): ImportRow[] {
  const seen = new Set<string>();
  return records.slice(0, MAX_IMPORT_ROWS).map((record, index) => {
    const cell = (field: ImportField) => { const i = mapping.indexOf(field); return i < 0 ? "" : (record[i] ?? "").trim(); };
    const problems: ImportProblem[] = [];
    const email = cell("email").toLowerCase();
    if (!email) problems.push("noEmail"); else if (!EMAIL.test(email) || email.length > 255) problems.push("badEmail");
    const name = (cell("name") || email.split("@")[0] || "").slice(0, 100);
    const company = cell("company");
    const message = cell("message");
    if (company.length > 150 || message.length > 2000) problems.push("tooLong");
    const parsedValue = parseValue(cell("value"));
    if (!parsedValue.ok) problems.push("badValue");
    const date = parseDate(cell("date"));
    if (date === "invalid") problems.push("badDate"); else if (date && date > now) problems.push("futureDate");
    const language = fold(cell("language")).slice(0, 2);
    const duplicate = !email ? null : existingEmails.has(email) ? "exists" : seen.has(email) ? "repeat" : null;
    if (email) seen.add(email);
    return {
      line: index + 2, name, email, company: company || null, message,
      product: matchLabel(cell("product"), PRODUCTS, productLabel),
      value_eur: parsedValue.ok ? parsedValue.value : null,
      status: matchLabel(cell("status"), STATUSES, statusLabel) ?? "new",
      created_at: date instanceof Date ? date.toISOString() : null,
      language: LANGUAGES.includes(language) ? language : "de",
      problems, duplicate,
    };
  });
}

/** The rows that will be saved: no problems, and duplicates only when the member chose to keep them. */
export function rowsToImport(rows: ImportRow[], keepDuplicates: boolean): ImportRow[] {
  return rows.filter((row) => row.problems.length === 0 && (keepDuplicates || !row.duplicate));
}
