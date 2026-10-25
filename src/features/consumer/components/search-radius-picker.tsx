"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Radar } from "lucide-react";
import { searchRadiusOptions } from "@/core/geo";
import { saveSearchRadius } from "@/features/consumer/actions";

/** Lets a household widen or narrow how far the app looks for stores and classes. */
export function SearchRadiusPicker({ km, className = "" }: { km: number; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: number) {
    startTransition(async () => {
      const res = await saveSearchRadius({ km: next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <label
      className={
        "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-8 text-[13px] font-semibold text-ink transition-colors hover:border-ink/25 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 " +
        (pending ? "opacity-60 " : "") +
        className
      }
    >
      <Radar className={"h-4 w-4 text-brand-coral " + (pending ? "animate-pulse" : "")} aria-hidden="true" />
      <span className="sr-only">Search radius</span>
      <select
        value={km}
        disabled={pending}
        onChange={(e) => change(Number(e.target.value))}
        className="appearance-none bg-transparent tabular-nums outline-none"
      >
        {searchRadiusOptions(km).map((option) => (
          <option key={option} value={option}>
            Within {option} km
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted" aria-hidden="true" />
    </label>
  );
}
