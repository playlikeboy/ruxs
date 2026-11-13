"use client";

import { useState, useTransition } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { setStoreStockAlert } from "@/features/store/actions";

/** "Notify me" for a sold-out product: one email when it is back in stock. */
export function StockAlertButton({
  productId,
  name,
  subscribed,
  size = "lg",
}: {
  productId: string;
  name: string;
  subscribed: boolean;
  size?: "sm" | "lg";
}) {
  const [on, setOn] = useState(subscribed);
  const [pending, startTransition] = useTransition();
  const Icon = on ? BellRing : Bell;

  function toggle() {
    const next = !on;
    startTransition(async () => {
      try {
        const res = await setStoreStockAlert({ productId, on: next });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setOn(res.subscribed);
        toast.success(res.subscribed ? "We will email you when it is back in stock" : "Alert turned off");
      } catch {
        toast.error("Could not save the alert. Check your connection and try again.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-busy={pending}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink",
        on ? "border border-kids-ink/20 bg-white text-kids-ink hover:border-kids-ink/40" : "bg-kids-ink text-white shadow-xs hover:bg-kids-ink/90",
        size === "lg" ? "min-h-12 w-full px-5 text-[15px]" : "min-h-10 px-4 text-sm"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {on ? "Alert on" : "Notify me"}
      <span className="sr-only">{on ? `. Turn off the back-in-stock email for ${name}` : ` when ${name} is back in stock`}</span>
    </button>
  );
}
