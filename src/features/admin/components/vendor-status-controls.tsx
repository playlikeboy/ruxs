"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { adminSetVendorStatus } from "@/features/admin/actions";

const NEXT: Record<string, { to: "active" | "suspended"; label: string; done: string; tone: string }[]> = {
  pending: [{ to: "active", label: "Approve", done: "Vendor approved", tone: "inline-flex min-h-10 select-none items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-good hover:bg-good/90" }],
  active: [{ to: "suspended", label: "Suspend", done: "Vendor suspended", tone: buttonClass("danger", "sm") }],
  suspended: [{ to: "active", label: "Reactivate", done: "Vendor reactivated", tone: "inline-flex min-h-10 select-none items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-good hover:bg-good/90" }],
};

export function VendorStatusControls({ vendorId, status }: { vendorId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      {(NEXT[status] ?? []).map((n) => (
        <button
          key={n.to}
          type="button"
          disabled={pending}
          onClick={() => {
            if (n.to === "suspended" && !window.confirm("Suspend this vendor? Their store disappears from the app and their panel locks.")) return;
            startTransition(async () => {
              const res = await adminSetVendorStatus({ vendorId, status: n.to });
              if (!res.ok) toast.error(res.error);
              else {
                toast.success(n.done);
                router.refresh();
              }
            });
          }}
          className={n.tone}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
