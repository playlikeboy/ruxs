"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setProductAvailability } from "@/features/products/actions";

export function AvailabilitySwitch({ slug, id, isAvailable }: { slug: string; id: string; isAvailable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={isAvailable}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            const res = await setProductAvailability({ slug, id, isAvailable: next });
            if (!res.ok) toast.error(res.error ?? "Could not update");
            else {
              toast.success(next ? "Back in stock" : "Marked sold out");
              router.refresh();
            }
          });
        }}
      />
      <span className="relative h-5 w-9 rounded-full bg-line transition peer-checked:bg-good after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" aria-hidden="true" />
      {isAvailable ? "In stock" : "Sold out"}
    </label>
  );
}
