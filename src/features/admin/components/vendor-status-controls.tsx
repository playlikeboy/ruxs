"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminSetVendorStatus } from "@/features/admin/actions";

const NEXT: Record<string, { to: "active" | "suspended"; label: string; tone: string }[]> = {
  pending: [{ to: "active", label: "Approve", tone: "bg-good text-white" }],
  active: [{ to: "suspended", label: "Suspend", tone: "border border-bad/40 text-bad" }],
  suspended: [{ to: "active", label: "Reactivate", tone: "bg-good text-white" }],
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
                toast.success(n.label + "d");
                router.refresh();
              }
            });
          }}
          className={"h-10 rounded-[10px] px-4 text-sm font-semibold disabled:opacity-60 " + n.tone}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
