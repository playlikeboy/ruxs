"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { adjustStock } from "../actions";

/** Restock (+) or correct (±) a product's stock, with a reason that lands in the stock log. */
export function StockAdjuster({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<"restock" | "adjust">("restock");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const n = Math.trunc(Number(qty));
  const delta = Number.isFinite(n) && n > 0 ? (direction === "add" ? n : -n) : 0;
  const after = Math.max(0, stock + delta);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (delta === 0) return setError("Enter how many units to add or remove");
    start(async () => {
      const res = await adjustStock({ productId, delta, reason, note: note || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Stock is now ${res.stock}`);
      setQty("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div role="radiogroup" aria-label="Add or remove" className="grid grid-cols-2 gap-2">
        {(["add", "remove"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            role="radio"
            aria-checked={direction === dir}
            onClick={() => {
              setDirection(dir);
              setReason(dir === "add" ? "restock" : "adjust");
            }}
            className={
              "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
              (direction === dir ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/30")
            }
          >
            {dir === "add" ? <Plus className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
            {dir === "add" ? "Add" : "Remove"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Units" htmlFor="sa-qty">
          <Input id="sa-qty" inputMode="numeric" type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} className="tabular-nums" />
        </Field>
        <Field label="Reason" htmlFor="sa-reason">
          <Select id="sa-reason" value={reason} onChange={(e) => setReason(e.target.value as "restock" | "adjust")}>
            <option value="restock">Restock</option>
            <option value="adjust">Correction</option>
          </Select>
        </Field>
      </div>
      <Field label="Note" htmlFor="sa-note" hint="Optional, e.g. supplier invoice or damaged units.">
        <Input id="sa-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <p className="text-sm text-muted" aria-live="polite">
        Stock <span className="font-semibold tabular-nums text-ink">{stock}</span> → <span className="font-semibold tabular-nums text-ink">{after}</span>
      </p>
      {error && (
        <p role="alert" className="rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending || delta === 0} aria-busy={pending} className={buttonClass("dark", "md", "w-full")}>
        {pending ? "Updating…" : "Update stock"}
      </button>
    </form>
  );
}
