"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { importCustomers, type ImportResultRow } from "@/features/customers/actions";
import { CopyShareButton } from "./copy-share-button";

export function ImportCustomerForm({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"batch" | "single">("single");

  // Single mode state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [society, setSociety] = useState("");
  const [tower, setTower] = useState("");
  const [floor, setFloor] = useState("");
  const [flat, setFlat] = useState("");

  // Batch mode state
  const [rawText, setRawText] = useState("");
  const [importedRows, setImportedRows] = useState<ImportResultRow[] | null>(null);

  const sampleCsv = `Name, Phone, Society, Tower, Floor, Flat
Sunita Nair, 9876543210, Green Glen Layout, Tower A, 3, 302
Vikram Patel, 9811122233, Mantri Espana, Wing 2, 8, 804`;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const line = `${name}, ${phone}, ${society}, ${tower || "Main"}, ${floor || "0"}, ${flat}`;

    startTransition(async () => {
      const res = await importCustomers({ slug, rawText: line });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to add household");
      } else if (res.results) {
        setImportedRows(res.results);
        toast.success("Household added successfully!");
      }
    });
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      toast.error("Please paste customer rows");
      return;
    }

    startTransition(async () => {
      const res = await importCustomers({ slug, rawText });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to import customers");
      } else if (res.results) {
        setImportedRows(res.results);
        const successes = res.results.filter((r) => !r.error).length;
        toast.success(`Imported ${successes} households!`);
      }
    });
  };

  if (importedRows) {
    const successes = importedRows.filter((r) => !r.error);
    const failures = importedRows.filter((r) => r.error);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#E1F3E7] border border-[#2F7D4F]/20 rounded-[12px] space-y-1">
          <h2 className="text-sm font-semibold text-good">
            Import Complete: {successes.length} Added
          </h2>
          <p className="text-xs text-ink/80">
            Share each household&apos;s private link. They can tap Deliver, Skip, or Extra every morning without downloading any app.
          </p>
        </div>

        <div className="space-y-2">
          {importedRows.map((row, idx) => (
            <div
              key={idx}
              className={`p-3.5 bg-surface border rounded-[12px] flex items-center justify-between text-xs ${
                row.error ? "border-[#B42318]/30 bg-[#FFF5F5]" : "border-line shadow-xs"
              }`}
            >
              <div>
                <div className="font-semibold text-ink">
                  {row.name} <span className="font-mono text-muted">Flat {row.flat}</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {row.society} {row.tower ? `(${row.tower})` : ""} • {row.phone}
                </div>
                {row.error && (
                  <div className="text-[11px] text-[#B42318] font-medium mt-1">
                    ⚠️ {row.error}
                  </div>
                )}
              </div>

              {row.rawLink && (
                <div className="flex items-center gap-2">
                  <CopyShareButton url={row.rawLink} title={`RUXS link for ${row.name}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setImportedRows(null);
              setRawText("");
            }}
            className="flex-1 py-2.5 px-3 bg-surface border border-line text-xs font-semibold text-ink rounded-[10px] hover:bg-[#FAFAF7]"
          >
            Add More Households
          </button>
          <Link
            href={`/merchant-panel/${slug}/customers`}
            className="flex-1 py-2.5 px-3 bg-accent text-white text-xs font-semibold rounded-[10px] text-center hover:opacity-90 shadow-xs"
          >
            Go to Customers List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode switcher tabs */}
      <div className="grid grid-cols-2 p-1 bg-[#FAFAF7] border border-line rounded-[10px]">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`py-2 text-xs font-semibold rounded-[8px] transition-colors ${
            mode === "single" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          Single Household
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`py-2 text-xs font-semibold rounded-[8px] transition-colors ${
            mode === "batch" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          Paste Lines / CSV
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSingleSubmit} className="space-y-3.5 bg-surface border border-line rounded-[12px] p-4 shadow-xs">
          <div>
            <label htmlFor="cname" className="block text-xs font-medium text-ink mb-1">
              Customer / Household Name
            </label>
            <input
              id="cname"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="cphone" className="block text-xs font-medium text-ink mb-1">
              Phone Number
            </label>
            <input
              id="cphone"
              type="tel"
              required
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
            />
          </div>

          <div>
            <label htmlFor="csociety" className="block text-xs font-medium text-ink mb-1">
              Apartment / Society Name
            </label>
            <input
              id="csociety"
              type="text"
              required
              placeholder="e.g. Green Glen Layout"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="ctower" className="block text-xs font-medium text-ink mb-1">
                Tower/Wing
              </label>
              <input
                id="ctower"
                type="text"
                placeholder="A"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="cfloor" className="block text-xs font-medium text-ink mb-1">
                Floor
              </label>
              <input
                id="cfloor"
                type="text"
                placeholder="3"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
              />
            </div>
            <div>
              <label htmlFor="cflat" className="block text-xs font-medium text-ink mb-1">
                Flat No.
              </label>
              <input
                id="cflat"
                type="text"
                required
                placeholder="302"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs"
          >
            {isPending ? "Creating..." : "Save Household & Generate Link"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} className="space-y-3.5 bg-surface border border-line rounded-[12px] p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="raw" className="block text-xs font-medium text-ink">
                Paste CSV or Comma/Tab-Delimited Lines
              </label>
              <button
                type="button"
                onClick={() => setRawText(sampleCsv)}
                className="text-[11px] text-accent hover:underline"
              >
                Insert Sample
              </button>
            </div>
            <p className="text-[11px] text-muted mb-2">
              Format: <span className="font-mono">Name, Phone, Society, Tower, Floor, Flat</span>
            </p>
            <textarea
              id="raw"
              rows={8}
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={sampleCsv}
              className="w-full px-3 py-2 text-xs font-mono bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs"
          >
            {isPending ? "Importing lines..." : "Import Households"}
          </button>
        </form>
      )}
    </div>
  );
}
