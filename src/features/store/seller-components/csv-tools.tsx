"use client";

import { useId, useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { bulkUpdateStoreStock, exportStoreOrdersCsv, exportStoreProductsCsv, importStoreProducts } from "../admin-actions";
import type { AdminStoreOrderFilter, StoreBulkStockResult, StoreCsvExport, StoreImportResult, StoreImportRowError } from "../types";
import { DialogButtons, ErrorNote } from "./seller-ui";
import { useStoreAction } from "./use-store-action";

const MAX_FILE_BYTES = 1_000_000;

function download(file: StoreCsvExport) {
  // The BOM makes Excel read the file as UTF-8, so ₹ and Indian names stay intact.
  const url = URL.createObjectURL(new Blob(["﻿", file.csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const rowsText = (n: number) => `${n} ${n === 1 ? "row" : "rows"}`;

/** Every non-archived product as a CSV in the import's own columns. */
export function ExportProductsButton() {
  const { pending, run } = useStoreAction();
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        run(() => exportStoreProductsCsv(), {
          toastError: true,
          refresh: false,
          success: (r) => `Downloaded ${rowsText(r.export.rowCount)}`,
          onOk: (r) => download(r.export),
        })
      }
      className={buttonClass("secondary", "sm")}
    >
      <Download className="h-4 w-4" aria-hidden="true" /> {pending ? "Preparing…" : "Export CSV"}
    </button>
  );
}

/** Orders as CSV: the current filter, optionally narrowed to a date range (India time). */
export function ExportOrdersButton({ status, statusLabel }: { status: AdminStoreOrderFilter; statusLabel: string }) {
  const { pending, error, setError, run } = useStoreAction();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const close = () => {
    if (pending) return;
    setOpen(false);
    setError(null);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to && from > to) return setError("The start date is after the end date");
    run(() => exportStoreOrdersCsv({ status, from: from || undefined, to: to || undefined }), {
      refresh: false,
      success: (r) => `Downloaded ${rowsText(r.export.rowCount)}`,
      onOk: (r) => {
        download(r.export);
        setOpen(false);
      },
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "sm")}>
        <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
      </button>
      <AdminDialog
        open={open}
        onClose={close}
        busy={pending}
        tone="accent"
        icon={<Download className="h-5 w-5" />}
        title="Export orders"
        description={`Filter: ${statusLabel}. The file holds names, phones and addresses, so keep it inside the team.`}
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From" htmlFor="ex-from" hint="Optional.">
              <Input id="ex-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" htmlFor="ex-to" hint="Optional.">
              <Input id="ex-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <ErrorNote>{error}</ErrorNote>
          <DialogButtons pending={pending} onCancel={close} confirm="Download" busyText="Preparing…" />
        </form>
      </AdminDialog>
    </>
  );
}

/** Picks a .csv file and hands its text to the caller. */
function CsvFilePicker({ onText, disabled }: { onText: (text: string, name: string) => void; disabled: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <>
      <input
        ref={ref}
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > MAX_FILE_BYTES) return void toast.error("That file is over 1 MB. Split it into smaller files.");
          onText(await file.text(), file.name);
        }}
      />
      <button type="button" disabled={disabled} onClick={() => ref.current?.click()} className={buttonClass("secondary", "md")}>
        <FileUp className="h-4 w-4" aria-hidden="true" /> Choose a CSV file
      </button>
    </>
  );
}

function RowErrors({ errors }: { errors: StoreImportRowError[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-control border border-line">
      <table className="w-full min-w-[26rem] text-left text-sm">
        <caption className="border-b border-line bg-bg px-3 py-2 text-left text-xs font-semibold text-bad">
          {rowsText(errors.length)} skipped. Fix them in the file and import again.
        </caption>
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="px-3 py-2 font-semibold">Line</th>
            <th scope="col" className="px-3 py-2 font-semibold">SKU</th>
            <th scope="col" className="px-3 py-2 font-semibold">Problem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {errors.map((e, i) => (
            <tr key={`${e.line}-${i}`}>
              <td className="px-3 py-2 tabular-nums text-muted">{e.line}</td>
              <td className="px-3 py-2 font-medium text-ink">{e.sku ?? "—"}</td>
              <td className="px-3 py-2 text-ink">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Add or update products from a spreadsheet. Check first, then import; bad rows are reported and skipped. */
export function ProductImportTool() {
  const { pending, error, run } = useStoreAction();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<StoreImportResult | null>(null);

  function go(dryRun: boolean) {
    run(() => importStoreProducts({ csv, dryRun }), {
      refresh: !dryRun,
      success: (r) =>
        dryRun
          ? null
          : r.result.dryRun
            ? null
            : `${r.result.created} added, ${r.result.updated} updated${r.result.errors.length ? `, ${r.result.errors.length} skipped` : ""}`,
      onOk: (r) => setResult(r.result),
    });
  }

  const valid = result ? result.created + result.updated : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CsvFilePicker
          disabled={pending}
          onText={(text, name) => {
            setCsv(text);
            setFileName(name);
            setResult(null);
          }}
        />
        {fileName && <span className="break-all text-sm text-muted">{fileName}</span>}
      </div>
      <Field label="Or paste the CSV here" htmlFor="imp-csv" hint="First line is the header. Only the sku column is required. Up to 500 rows.">
        <Textarea
          id="imp-csv"
          rows={6}
          spellCheck={false}
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setFileName(null);
            setResult(null);
          }}
          placeholder={"sku,name,category,price,stock\nRS-ROBO-001,Line-follower robot kit,robotics,1499,20"}
          className="font-mono text-base"
        />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending || !csv.trim()} onClick={() => go(true)} className={buttonClass("secondary", "md")}>
          {pending ? "Working…" : "Check the file"}
        </button>
        <button type="button" disabled={pending || !csv.trim()} aria-busy={pending} onClick={() => go(false)} className={buttonClass("primary", "md")}>
          Import products
        </button>
      </div>
      {result && (
        <div className="space-y-3" role="status">
          <p className="text-sm text-ink">
            <span className="font-semibold">{result.dryRun ? "Nothing was saved." : "Imported."}</span>{" "}
            <span className="tabular-nums">
              {rowsText(result.totalRows)} read: {result.created} {result.dryRun ? "to add" : "added"}, {result.updated} {result.dryRun ? "to update" : "updated"},{" "}
              {result.errors.length} with problems.
            </span>
            {result.dryRun && valid > 0 ? " Press Import products to save the good rows." : ""}
          </p>
          <RowErrors errors={result.errors} />
        </div>
      )}
    </div>
  );
}

/** Set or add stock for many SKUs at once from a two-column CSV. */
export function BulkStockTool() {
  const { pending, error, run } = useStoreAction();
  const [csv, setCsv] = useState("");
  const [mode, setMode] = useState<"set" | "add">("set");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<StoreBulkStockResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(() => bulkUpdateStoreStock({ mode, csv, note: note || undefined }), {
      success: (r) => `${r.result.updated} updated, ${r.result.unchanged} unchanged${r.result.errors.length ? `, ${r.result.errors.length} skipped` : ""}`,
      onOk: (r) => setResult(r.result),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What the numbers mean" htmlFor="bs-mode">
          <Select id="bs-mode" value={mode} onChange={(e) => setMode(e.target.value as "set" | "add")}>
            <option value="set">Counted stock: set it to this number</option>
            <option value="add">Delivery: add this many (minus removes)</option>
          </Select>
        </Field>
        <Field label="Note" htmlFor="bs-note" hint="Optional. Saved on every stock change.">
          <Input id="bs-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="November stock count" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CsvFilePicker
          disabled={pending}
          onText={(text) => {
            setCsv(text);
            setResult(null);
          }}
        />
      </div>
      <Field label="Or paste sku,stock lines" htmlFor="bs-csv" hint="First line is the header: sku,stock. Up to 500 rows.">
        <Textarea
          id="bs-csv"
          required
          rows={6}
          spellCheck={false}
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setResult(null);
          }}
          placeholder={"sku,stock\nRS-ROBO-001,25\nRS-ART-014,0"}
          className="font-mono text-base"
        />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <button type="submit" disabled={pending || !csv.trim()} aria-busy={pending} className={buttonClass("dark", "md")}>
        {pending ? "Updating…" : "Update stock"}
      </button>
      {result && (
        <div className="space-y-3" role="status">
          <p className="text-sm tabular-nums text-ink">
            {result.updated} updated, {result.unchanged} already correct, {result.errors.length} with problems.
          </p>
          <RowErrors errors={result.errors} />
        </div>
      )}
    </form>
  );
}
