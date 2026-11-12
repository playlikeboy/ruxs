"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { recordAssetMovement } from "@/features/assets/actions";

interface WaterCanHubProps {
  slug: string;
  customers: { id: string; name: string; flat: string; society: string }[];
  outstandingCans: number;
  householdsCount: number;
}

const MOVES = [
  { delta: -1, label: "Empty can returned", hint: "−1 with the household" },
  { delta: 1, label: "Extra can issued", hint: "+1 with the household" },
] as const;

/** Water stores: how many returnable cans are out, and a quick way to log a return or an extra can. */
export function WaterCanHub({ slug, customers, outstandingCans, householdsCount }: WaterCanHubProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <section aria-labelledby="water-can-title" className="space-y-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-water text-ink">
            <Droplet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="water-can-title" className="text-base font-semibold text-ink">Returnable cans</h2>
            <p className="text-xs text-muted">Cans out with households and empty returns</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "sm")}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Log can return
        </button>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
        <div>
          <dt className="text-xs font-medium text-muted">Cans with customers</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">{outstandingCans}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Households holding cans</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">{householdsCount}</dd>
        </div>
      </dl>

      {open && <CanMovementDialog slug={slug} customers={customers} onClose={close} />}
    </section>
  );
}

function CanMovementDialog({
  slug,
  customers,
  onClose,
}: {
  slug: string;
  customers: WaterCanHubProps["customers"];
  onClose: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const firstField = useRef<HTMLSelectElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id ?? "");
  const [delta, setDelta] = useState<-1 | 1>(-1);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Pick a household first");
      return;
    }
    startTransition(async () => {
      const res = await recordAssetMovement({ slug, customerId: selectedCustomer, asset: "can", delta });
      if (!res.ok) {
        toast.error(res.error || "Could not save. Please try again.");
        return;
      }
      toast.success(delta < 0 ? "Empty can return recorded" : "Extra can recorded");
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-card">
        <div className="flex items-center justify-between gap-3">
          <h3 id={`${id}-title`} className="text-lg font-semibold text-ink">Log a can movement</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {customers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No households yet. Cans can be logged once you have customers.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor={`${id}-customer`} className="mb-1 block text-sm font-medium text-ink">Household</label>
              <select
                ref={firstField}
                id={`${id}-customer`}
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface px-3 text-ink"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.flat}, {c.society}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-ink">What happened</legend>
              <div className="grid grid-cols-2 gap-2">
                {MOVES.map((m) => (
                  <button
                    key={m.delta}
                    type="button"
                    onClick={() => setDelta(m.delta)}
                    aria-pressed={delta === m.delta}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center rounded-control border px-2 py-2 text-sm font-semibold transition-colors",
                      delta === m.delta ? "border-accent bg-brand-peach text-ink" : "border-line bg-surface text-muted hover:bg-bg"
                    )}
                  >
                    {m.label}
                    <span className="text-xs font-normal tabular-nums text-muted">{m.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={onClose} className={buttonClass("ghost", "md")}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
