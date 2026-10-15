"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { formatINR } from "@/core/money";
import { WEEKDAYS } from "@/config/service-kinds";
import { subscribe } from "@/features/consumer/actions";

const DAY_LABEL: Record<string, string> = { mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "S" };

export function SubscribeForm({
  productId,
  pricePaise,
  depositPaise,
  assetName,
  minStart,
  hasAddress,
}: {
  productId: string;
  pricePaise: number;
  depositPaise: number;
  assetName: string | null;
  minStart: string;
  hasAddress: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri", "sat"]);
  const [startsOn, setStartsOn] = useState(minStart);
  const [pending, startTransition] = useTransition();

  const weekly = pricePaise * qty * days.length;
  const presets: { label: string; days: string[] }[] = [
    { label: "Every day", days: [...WEEKDAYS] },
    { label: "Mon–Sat", days: ["mon", "tue", "wed", "thu", "fri", "sat"] },
    { label: "Weekdays", days: ["mon", "tue", "wed", "thu", "fri"] },
  ];

  function toggle(day: string) {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : WEEKDAYS.filter((w) => d.includes(w) || w === day)));
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-[15px] font-semibold text-ink">How many each day?</h2>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-ink disabled:opacity-40" disabled={qty <= 1}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-2xl font-semibold tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-ink disabled:opacity-40" disabled={qty >= 10}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Which days?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => setDays(p.days)} className={"h-9 rounded-full border px-3.5 text-[13px] font-medium " + (p.days.join() === days.join() ? "border-ink bg-ink text-white" : "border-black/10 text-neutral-600")}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              aria-pressed={days.includes(d)}
              aria-label={d}
              className={"aspect-square rounded-full text-sm font-semibold transition " + (days.includes(d) ? "bg-accent text-white" : "bg-neutral-100 text-neutral-500")}
            >
              {DAY_LABEL[d]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="block">
          <span className="text-[15px] font-semibold text-ink">Start from</span>
          <input type="date" min={minStart} value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[15px] text-ink" />
        </label>
      </section>

      <section className="rounded-2xl bg-neutral-50 p-4 text-sm">
        <div className="flex justify-between text-neutral-600"><span>{formatINR(pricePaise)} × {qty} × {days.length} days</span><span className="font-semibold text-ink tabular-nums">{formatINR(weekly)}/week</span></div>
        {depositPaise > 0 && assetName && (
          <div className="mt-2 flex justify-between text-neutral-600"><span>Refundable {assetName} deposit (one time)</span><span className="tabular-nums">{formatINR(depositPaise * qty)}</span></div>
        )}
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          No upfront payment. You&apos;re billed monthly for what&apos;s delivered. Skip any day from the Plans tab before the cutoff.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md border-t border-black/5 bg-white px-4 py-3">
        <button
          type="button"
          disabled={pending || days.length === 0}
          onClick={() => {
            if (!hasAddress) {
              router.push(`/app/account?next=${encodeURIComponent(window.location.pathname)}`);
              return;
            }
            startTransition(async () => {
              const res = await subscribe({ productId, qty, days, startsOn });
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.success("Your plan is set");
              router.push("/app/plans");
            });
          }}
          className="h-14 w-full rounded-2xl bg-accent text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(189,75,42,0.3)] transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Starting…" : hasAddress ? "Start subscription" : "Add address to subscribe"}
        </button>
      </div>
    </div>
  );
}
