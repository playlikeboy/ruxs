"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UiIcon } from "@/components/ui/app-icon";
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
    // Commas or tabs inside a field would shift the columns on the server.
    const clean = (v: string) => v.replace(/[,\t]/g, " ").trim();
    const line = `${clean(name)}, ${clean(phone)}, ${clean(society)}, ${clean(tower) || "Main"}, ${clean(floor) || "0"}, ${clean(flat)}`;

    startTransition(async () => {
      const res = await importCustomers({ slug, rawText: line });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to add household");
      } else if (res.results) {
        setImportedRows(res.results);
        toast.success("Household added");
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
        toast.success(`Imported ${successes} ${successes === 1 ? "household" : "households"}`);
      }
    });
  };

  if (importedRows) {
    const successes = importedRows.filter((r) => !r.error);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-mint border border-good/20 rounded-2xl space-y-1">
          <h2 className="text-sm font-semibold text-good">
            Import complete: {successes.length} added
          </h2>
          <p className="text-xs text-ink/80">
            Share each household&apos;s private link. They can tap Deliver, Skip, or Extra every morning without downloading any app.
          </p>
        </div>

        <div className="space-y-2">
          {importedRows.map((row, idx) => (
            <div
              key={idx}
              className={`p-3.5 bg-surface border rounded-2xl flex items-center justify-between text-xs ${
                row.error ? "border-bad/30 bg-bad/5" : "border-line"
              }`}
            >
              <div>
                <div className="font-semibold text-ink">
                  {row.name} <span className="tabular-nums text-muted">Flat {row.flat}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {row.society} {row.tower ? `(${row.tower})` : ""} • {row.phone}
                </div>
                {row.error && (
                  <div role="alert" className="mt-1 text-xs font-medium text-bad">
                    <UiIcon name="warning" /> {row.error}
                  </div>
                )}
              </div>

              {row.rawLink && (
                <div className="flex items-center gap-2">
                  <CopyShareButton url={row.rawLink} title={`RUXs link for ${row.name}`} />
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
            className="min-h-11 flex-1 rounded-control border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink hover:bg-app-canvas"
          >
            Add more households
          </button>
          <Link
            href={`/merchant-panel/${slug}/customers`}
            className="flex min-h-11 flex-1 items-center justify-center rounded-control bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent/90"
          >
            Go to customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode switcher tabs */}
      <div className="grid grid-cols-2 rounded-control border border-line bg-app-canvas p-1" role="group" aria-label="How to add">
        <button
          type="button"
          onClick={() => setMode("single")}
          aria-pressed={mode === "single"}
          className={`min-h-10 rounded-lg py-2 text-xs font-semibold transition-colors ${
            mode === "single" ? "bg-surface text-ink shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          One household
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          aria-pressed={mode === "batch"}
          className={`min-h-10 rounded-lg py-2 text-xs font-semibold transition-colors ${
            mode === "batch" ? "bg-surface text-ink shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          Paste lines / CSV
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSingleSubmit} className="space-y-3.5 bg-surface border border-line rounded-2xl p-4">
          <div>
            <label htmlFor="cname" className="block text-xs font-medium text-ink mb-1">
              Household name
            </label>
            <input
              id="cname"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="cphone" className="block text-xs font-medium text-ink mb-1">
              Phone number
            </label>
            <input
              id="cphone"
              type="tel"
              required
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent font-mono"
            />
          </div>

          <div>
            <label htmlFor="csociety" className="block text-xs font-medium text-ink mb-1">
              Apartment or society
            </label>
            <input
              id="csociety"
              type="text"
              required
              placeholder="e.g. Green Glen Layout"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
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
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
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
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent font-mono"
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
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 bg-accent text-white font-semibold text-sm rounded-control hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save and create link"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} className="space-y-3.5 bg-surface border border-line rounded-2xl p-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="raw" className="block text-xs font-medium text-ink">
                Paste CSV, comma or tab separated lines
              </label>
              <button
                type="button"
                onClick={() => setRawText(sampleCsv)}
                className="min-h-10 text-xs font-semibold text-accent hover:underline"
              >
                Insert sample
              </button>
            </div>
            <p className="mb-2 text-xs text-muted">
              Format: <span className="font-mono">Name, Phone, Society, Tower, Floor, Flat</span>
            </p>
            <textarea
              id="raw"
              rows={8}
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={sampleCsv}
              className="w-full px-3 py-2 text-xs font-mono bg-surface border border-line rounded-control text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-accent text-white font-semibold text-sm rounded-control hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isPending ? "Importing…" : "Import households"}
          </button>
        </form>
      )}
    </div>
  );
}
