// Data export for a company (DSGVO Art. 20): CSV for spreadsheets and one JSON file with everything.
// Row level security limits every query to the company the signed-in person belongs to.
import { supabase } from "@/lib/supabase";

/** A cell a spreadsheet would run as a formula (=, +, -, @, tab, return) gets a leading apostrophe. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = Array.isArray(value) ? value.join(" | ") : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";,\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with the header taken from the given columns, so empty exports still have a header row. */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  return [columns.join(","), ...rows.map((row) => columns.map((c) => cell(row[c])).join(","))].join("\r\n") + "\r\n";
}

export const LEAD_EXPORT_COLUMNS = ["id", "created_at", "updated_at", "name", "email", "company", "message", "source", "status", "product", "value_eur", "language", "page_path", "referrer_host", "utm_source", "utm_medium", "utm_campaign", "chat_topic", "consent_at", "assigned_to"];
export const TICKET_EXPORT_COLUMNS = ["id", "number", "created_at", "updated_at", "subject", "customer_name", "customer_email", "channel", "status", "priority", "assigned_to", "lead_id"];

const TABLES = ["leads", "lead_events", "tasks", "tickets", "ticket_messages", "web_forms", "bots"] as const;

/** Every row of the company's tables, read page by page so large companies are complete. */
export async function readCompany(workspaceId: string): Promise<Record<(typeof TABLES)[number], Record<string, unknown>[]>> {
  const out = {} as Record<(typeof TABLES)[number], Record<string, unknown>[]>;
  for (const table of TABLES) {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase().from(table).select("*").eq("workspace_id", workspaceId).order("created_at").range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...((data ?? []) as Record<string, unknown>[]));
      if (!data || data.length < 1000) break;
    }
    out[table] = rows;
  }
  return out;
}

/** Hands a file to the browser's download, without a server round trip. */
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
