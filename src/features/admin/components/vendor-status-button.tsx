"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveVendor, suspendVendor } from "@/features/admin/actions";

export function VendorStatusButton({
  vendorId,
  currentStatus,
}: {
  vendorId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveVendor({ vendorId });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to approve vendor");
      } else {
        toast.success("Vendor activated");
      }
    });
  };

  const handleSuspend = () => {
    if (!confirm("Are you sure you want to suspend this vendor? Polls and operations will halt.")) {
      return;
    }

    startTransition(async () => {
      const res = await suspendVendor({ vendorId });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to suspend vendor");
      } else {
        toast.warning("Vendor suspended");
      }
    });
  };

  if (currentStatus === "pending") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleApprove}
        className="px-3 py-1.5 bg-good text-white text-xs font-semibold rounded-[8px] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending ? "Approving..." : "Approve"}
      </button>
    );
  }

  if (currentStatus === "active") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleSuspend}
        className="px-2.5 py-1 bg-surface border border-line text-[#B42318] text-xs font-semibold rounded-[8px] hover:bg-[#FFF5F5] active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending ? "Suspending..." : "Suspend"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleApprove}
      className="px-3 py-1 bg-[#FAFAF7] border border-line text-ink text-xs font-semibold rounded-[8px] hover:bg-white active:scale-95 transition-all disabled:opacity-50"
    >
      {isPending ? "Reactivating..." : "Reactivate"}
    </button>
  );
}
