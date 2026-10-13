"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { generateMonthlyBillsAction } from "@/features/billing/actions";

export function GenerateBillsButton({
  slug,
  defaultPeriod,
}: {
  slug: string;
  defaultPeriod: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    const period = window.prompt("Generate bills for period (YYYY-MM):", defaultPeriod);
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      if (period) toast.error("Format must be YYYY-MM");
      return;
    }

    startTransition(async () => {
      const res = await generateMonthlyBillsAction({ slug, period });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to generate bills");
      } else {
        toast.success(`Generated ${res.data?.created ?? 0} bills for ${period}`);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleGenerate}
      className="px-3 py-2 bg-surface border border-line text-xs font-semibold text-ink rounded-[10px] hover:border-accent active:scale-95 transition-all shadow-xs disabled:opacity-50"
    >
      {isPending ? "Generating..." : "⚡ Generate Bills"}
    </button>
  );
}
