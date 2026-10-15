"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelMyOrder } from "@/features/consumer/actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Cancel this order?")) return;
        startTransition(async () => {
          const res = await cancelMyOrder({ orderId });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Order cancelled");
            router.refresh();
          }
        });
      }}
      className="h-12 w-full rounded-xl border border-bad/30 text-sm font-semibold text-bad disabled:opacity-60"
    >
      {pending ? "Cancelling…" : "Cancel order"}
    </button>
  );
}
