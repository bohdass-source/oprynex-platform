import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, FileUp } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
import { useWorkspace } from "@/lib/auth";
import { can } from "@/lib/crm";
import { importFieldLabel, problemLabel, productLabel, statusLabel, useI18n, type DictKey } from "@/lib/i18n";
import { IMPORT_FIELDS, MAX_IMPORT_ROWS, buildRows, guessMapping, parseCsv, rowsToImport, type ImportField, type Mapping } from "@/lib/importer";
import { formatEur } from "@/lib/products";
import { useImportLeads, useLeads } from "@/lib/queries";

export const Route = createFileRoute("/import")({ component: ImportPage });

const STEPS = ["file", "map", "check", "done"] as const;
type Step = (typeof STEPS)[number];
const STEP_LABEL: Record<Step, DictKey> = { file: "stepFile", map: "stepMap", check: "stepCheck", done: "stepDone" };

/** Four steps: choose a file, map its columns, check the rows (errors and duplicates), import. */
function ImportPage() {
  const { workspace } = useWorkspace();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("file");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<DictKey | null>(null);
  const [imported, setImported] = useState(0);

  if (!can(workspace.role, "importData")) return <p className="text-sm text-muted">{t("noAccessText")}</p>;

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5_000_000) { setFileError("fileTooLarge"); return; }
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setFileError("emptyFile"); return; }
    setFileError(null);
    setFileName(file.name);
    setHeaders(rows[0]!);
    setRecords(rows.slice(1));
    setMapping(guessMapping(rows[0]!));
    setStep("map");
  }
  const restart = () => { setStep("file"); setHeaders([]); setRecords([]); setMapping([]); setFileName(""); };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("importTitle")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("importIntro")}</p>
      </div>
      <ol className="flex flex-wrap gap-2" aria-label={t("importTitle")}>
        {STEPS.map((s, i) => {
          const current = s === step, done = STEPS.indexOf(step) > i;
          return (
            <li key={s} aria-current={current ? "step" : undefined}
              className={`chip inline-flex items-center gap-1.5 ${current ? "border-gold bg-gold text-on-gold" : done ? "border-gold/60 text-gold" : "border-line text-muted"}`}>
              {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="tabular-nums">{i + 1}</span>}{t(STEP_LABEL[s])}
            </li>
          );
        })}
      </ol>

      {step === "file" && (
        <div className="card p-6">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center hover:border-gold focus-within:border-gold">
            <FileUp className="h-8 w-8 text-gold" aria-hidden="true" />
            <span className="font-semibold">{t("chooseFile")}</span>
            <span className="text-sm text-muted">{t("fileHint")}</span>
            <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => void readFile(e)} />
          </label>
          {fileError && <p className="mt-3 text-sm text-danger" role="alert">{t(fileError)}</p>}
        </div>
      )}

      {step === "map" && <MapStep headers={headers} records={records} mapping={mapping} setMapping={setMapping} fileName={fileName}
        onBack={restart} onNext={() => setStep("check")} />}

      {step === "check" && <CheckStep records={records} mapping={mapping} workspaceId={workspace.id}
        onBack={() => setStep("map")} onDone={(n) => { setImported(n); setStep("done"); }} />}

      {step === "done" && (
        <div className="card flex flex-col items-start gap-4 p-6">
          <p className="flex items-center gap-2 text-lg font-bold"><Check className="h-5 w-5 text-ok" aria-hidden="true" />{imported} {t("importDone")}</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/leads" search={{ status: "all", source: "import" }} className="btn-primary">{t("inbox")}</Link>
            <button type="button" className="btn-ghost" onClick={restart}>{t("importMore")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function MapStep({ headers, records, mapping, setMapping, fileName, onBack, onNext }: {
  headers: string[]; records: string[][]; mapping: Mapping; setMapping: (m: Mapping) => void; fileName: string; onBack: () => void; onNext: () => void;
}) {
  const { t, lang } = useI18n();
  const hasEmail = mapping.includes("email");
  // Each field belongs to one column: choosing it here frees it elsewhere.
  const choose = (index: number, field: ImportField | null) => setMapping(headers.map((_, i) => (i === index ? field : mapping[i] === field ? null : mapping[i] ?? null)));
  return (
    <div className="card p-5">
      <p className="text-sm"><b>{fileName}</b> · {Math.min(records.length, MAX_IMPORT_ROWS)} {t("rows")}</p>
      {records.length > MAX_IMPORT_ROWS && <p className="mt-1 text-sm text-gold">{t("tooManyRows")}</p>}
      <p className="mt-1 text-sm text-muted">{t("mapHint")}</p>
      <div className="mt-4 hidden grid-cols-[1fr_1fr_14rem] gap-3 border-b border-line pb-2 text-xs font-semibold text-muted sm:grid">
        <span>{t("column")}</span><span>{t("example")}</span><span>{t("field")}</span>
      </div>
      <ul className="divide-y divide-line">
        {headers.map((header, i) => (
          <li key={i} className="grid gap-x-3 gap-y-1.5 py-2.5 text-sm sm:grid-cols-[1fr_1fr_14rem] sm:items-center">
            <span className="font-semibold">{header || `#${i + 1}`}</span>
            <span className="truncate text-muted">{records.find((r) => r[i])?.[i] ?? "—"}</span>
            <select className="field h-9 py-1" aria-label={`${t("field")}: ${header || `#${i + 1}`}`} value={mapping[i] ?? ""}
              onChange={(e) => choose(i, (e.target.value || null) as ImportField | null)}>
              <option value="">{t("ignore")}</option>
              {IMPORT_FIELDS.map((f) => <option key={f} value={f}>{importFieldLabel[f][lang]}</option>)}
            </select>
          </li>
        ))}
      </ul>
      {!hasEmail && <p className="mt-3 text-sm text-danger" role="alert">{t("noEmailMapped")}</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" className="btn-ghost" onClick={onBack}>{t("previous")}</button>
        <button type="button" className="btn-primary" disabled={!hasEmail} onClick={onNext}>{t("next")}</button>
      </div>
    </div>
  );
}

function CheckStep({ records, mapping, workspaceId, onBack, onDone }: {
  records: string[][]; mapping: Mapping; workspaceId: string; onBack: () => void; onDone: (n: number) => void;
}) {
  const { t, lang } = useI18n();
  const leads = useLeads(workspaceId);
  const importer = useImportLeads(workspaceId);
  const [keepDuplicates, setKeepDuplicates] = useState(false);
  const [progress, setProgress] = useState(0);
  const existing = useMemo(() => new Set((leads.data ?? []).map((lead) => lead.email.trim().toLowerCase())), [leads.data]);
  const rows = useMemo(() => buildRows(records, mapping, existing), [records, mapping, existing]);
  const ready = rowsToImport(rows, keepDuplicates);
  const withProblems = rows.filter((r) => r.problems.length > 0).length;
  const duplicates = rows.filter((r) => r.problems.length === 0 && r.duplicate).length;

  function start() {
    setProgress(0);
    importer.mutate({
      rows: ready.map(({ name, email, company, message, product, value_eur, status, language, created_at }) => ({ name, email, company, message, product, value_eur, status, language, created_at })),
      onProgress: setProgress,
    }, { onSuccess: onDone });
  }

  if (leads.isPending) return <p className="text-sm text-muted" role="status">{t("loading")}</p>;
  return (
    <div className="card p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary value={ready.length} label={t("readyRows")} tone="text-ok" />
        <Summary value={withProblems} label={t("problemRows")} tone={withProblems ? "text-danger" : "text-muted"} />
        <Summary value={duplicates} label={t("duplicateRows")} tone={duplicates ? "text-gold" : "text-muted"} />
      </div>
      {duplicates > 0 && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keepDuplicates} onChange={(e) => setKeepDuplicates(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("keepDuplicates")}
        </label>
      )}
      <p className="mt-4 text-xs text-muted">{t("showingFirst")}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead><tr className="border-b border-line text-left text-xs text-muted">
            {(["line", "name", "email", "product", "value", "status"] as const).map((k) => <th key={k} className="py-2 pr-3 font-semibold">{t(k)}</th>)}
            <th className="py-2 font-semibold">{t("stepCheck")}</th>
          </tr></thead>
          <tbody>
            {rows.slice(0, 50).map((row) => (
              <tr key={row.line} className="border-b border-line">
                <td className="py-1.5 pr-3 tabular-nums text-muted">{row.line}</td>
                <td className="max-w-[10rem] truncate py-1.5 pr-3">{row.name || "—"}</td>
                <td className="max-w-[14rem] truncate py-1.5 pr-3 text-muted">{row.email || "—"}</td>
                <td className="py-1.5 pr-3">{row.product ? productLabel[row.product][lang] : "—"}</td>
                <td className="py-1.5 pr-3">{row.value_eur == null ? "—" : formatEur(row.value_eur, lang)}</td>
                <td className="py-1.5 pr-3">{statusLabel[row.status][lang]}</td>
                <td className="py-1.5 text-xs">
                  {row.problems.length > 0 ? <span className="inline-flex items-center gap-1 text-danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{row.problems.map((p) => problemLabel[p][lang]).join(", ")}</span>
                    : row.duplicate ? <span className="inline-flex items-center gap-1 text-gold"><Copy className="h-3.5 w-3.5" aria-hidden="true" />{t(row.duplicate === "exists" ? "dupExists" : "dupRepeat")}</span>
                    : <span className="inline-flex items-center gap-1 text-ok"><Check className="h-3.5 w-3.5" aria-hidden="true" />OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {importer.isPending && (
        <div className="mt-4" role="status">
          <p className="text-sm">{t("importing")} {progress} / {ready.length}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-gold transition-all" style={{ width: `${ready.length ? (progress / ready.length) * 100 : 0}%` }} /></div>
        </div>
      )}
      {importer.isError && <p className="mt-4 text-sm text-danger" role="alert">{t("importError")}</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" className="btn-ghost" onClick={onBack} disabled={importer.isPending}>{t("previous")}</button>
        <button type="button" className="btn-primary" onClick={start} disabled={importer.isPending || ready.length === 0}>{t("importButton")} ({ready.length})</button>
      </div>
    </div>
  );
}

function Summary({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
