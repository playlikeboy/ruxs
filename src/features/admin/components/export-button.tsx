"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Check } from "lucide-react";
import { toast } from "sonner";

export interface ExportData {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function ExportButton({
  filename,
  title = "Export",
  getData,
  className = "",
}: {
  filename: string;
  title?: string;
  getData: () => ExportData;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatCSVCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    try {
      const data = getData();
      const csvLines = [
        data.headers.map(formatCSVCell).join(","),
        ...data.rows.map((row) => row.map(formatCSVCell).join(",")),
      ];
      const blob = new Blob([csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV export downloaded successfully!");
      setOpen(false);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleCopyForSheets = async () => {
    try {
      const data = getData();
      // TSV format allows 1-click paste into Google Sheets and Microsoft Excel
      const tsvLines = [
        data.headers.map((h) => String(h).replace(/\t|\r|\n/g, " ")).join("\t"),
        ...data.rows.map((row) =>
          row.map((c) => (c === null || c === undefined ? "" : String(c).replace(/\t|\r|\n/g, " "))).join("\t")
        ),
      ];
      await navigator.clipboard.writeText(tsvLines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Copied to clipboard in Google Sheets format! Paste with Ctrl+V.");
      setOpen(false);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handlePrint = () => {
    setOpen(false);
    window.print();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={
          "flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-bg " +
          className
        }
      >
        <Download className="h-4 w-4 text-muted" aria-hidden="true" />
        <span>{title}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-[12px] border border-line bg-surface p-1.5 shadow-lg animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-xs font-medium text-ink hover:bg-bg transition"
            >
              <FileSpreadsheet className="h-4 w-4 text-good" aria-hidden="true" />
              <span>Download CSV file</span>
            </button>

            <button
              type="button"
              onClick={handleCopyForSheets}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-xs font-medium text-ink hover:bg-bg transition"
            >
              {copied ? (
                <Check className="h-4 w-4 text-good" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
              )}
              <span>Copy for Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-xs font-medium text-ink hover:bg-bg transition"
            >
              <Printer className="h-4 w-4 text-muted" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
