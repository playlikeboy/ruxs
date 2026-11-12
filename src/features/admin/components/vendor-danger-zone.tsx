"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { adminDeleteVendor } from "@/features/admin/actions";
import { AdminDialog } from "./admin-dialog";

interface VendorDangerZoneProps {
  vendorId: string;
  vendorName: string;
  status: string;
}

export function VendorDangerZone({ vendorId, vendorName }: VendorDangerZoneProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setConfirmText("");
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await adminDeleteVendor({ vendorId });
      if (!res.ok) {
        if ("protectedByLedger" in res && res.protectedByLedger) {
          toast.warning("Store suspended instead", {
            description: res.error,
            duration: 8000,
          });
          close();
          router.refresh();
        } else {
          toast.error(res.error || "Failed to delete store");
        }
      } else {
        toast.success(res.message || "Store deleted permanently");
        close();
        router.push("/admin/vendors");
      }
    });
  };

  const confirmed = confirmText.trim().toLowerCase() === vendorName.trim().toLowerCase();

  return (
    <section aria-labelledby="danger-zone-title" className="rounded-[16px] border border-bad/20 bg-bad/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 id="danger-zone-title" className="flex items-center gap-1.5 text-sm font-semibold text-bad">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Delete store
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Deleting removes this store&apos;s menu, delivery settings and staff access for good. A store with money history in the ledger is suspended and paused instead, so its records stay intact.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("danger", "sm")}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete store
        </button>
      </div>

      <AdminDialog
        open={open}
        onClose={close}
        busy={pending}
        icon={<Trash2 className="h-5 w-5" />}
        title={`Delete ${vendorName}?`}
        description="This can't be undone."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmed) handleDelete();
          }}
        >
          <ul className="list-disc space-y-1.5 rounded-[12px] bg-bg py-3 pl-8 pr-3.5 text-sm text-muted">
            <li>A store with no ledger history is deleted permanently.</li>
            <li>A store with ledger history is suspended and paused instead.</li>
          </ul>
          <div className="space-y-1.5">
            <label htmlFor="confirm-vendor-name" className="block text-sm font-medium text-ink">
              Type <span className="select-all font-mono font-semibold text-bad">{vendorName}</span> to confirm
            </label>
            <Input
              id="confirm-vendor-name"
              autoComplete="off"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={vendorName}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button type="button" disabled={pending} onClick={close} className={buttonClass("secondary", "sm")}>
              Cancel
            </button>
            <button type="submit" disabled={pending || !confirmed} className={"inline-flex min-h-10 select-none items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-bad hover:bg-bad/90"}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
              {pending ? "Deleting…" : "Delete store"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </section>
  );
}
