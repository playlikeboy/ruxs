"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteVendor } from "@/features/admin/actions";

interface VendorDangerZoneProps {
  vendorId: string;
  vendorName: string;
  status: string;
}

export function VendorDangerZone({ vendorId, vendorName, status }: VendorDangerZoneProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await adminDeleteVendor({ vendorId });
      if (!res.ok) {
        if ("protectedByLedger" in res && res.protectedByLedger) {
          toast.warning("Store suspended instead", {
            description: res.error,
            duration: 8000,
          });
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to delete store");
        }
      } else {
        toast.success(res.message || "Store deleted permanently");
        setOpen(false);
        router.push("/admin/vendors");
      }
    });
  };

  return (
    <div className="rounded-[16px] border border-bad/30 bg-bad/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-bad flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Danger Zone
          </h3>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Deleting this store will permanently remove its menu items, delivery settings, and staff access.
            If this store has financial ledger history, database rules will automatically suspend and deactivate it instead to preserve audit records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-[10px] border border-bad/40 bg-white px-3.5 py-2 text-xs font-bold text-bad shadow-2xs hover:bg-bad hover:text-white transition"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete store
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-[18px] border border-line bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">Delete {vendorName}?</h4>
                <p className="text-xs text-muted">This action cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-[12px] bg-bg p-3.5 text-xs text-muted space-y-2">
              <p>
                • Uncommitted stores &amp; test data will be permanently wiped from the database.
              </p>
              <p>
                • Stores with active or historical financial transactions will be safely deactivated and suspended.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-vendor-name" className="text-xs font-medium text-ink">
                Type <span className="font-mono font-bold select-all text-bad">{vendorName}</span> to confirm:
              </label>
              <input
                id="confirm-vendor-name"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={vendorName}
                className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-xs placeholder:text-muted focus:border-bad focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                }}
                className="rounded-[10px] border border-line px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-bg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || confirmText.trim().toLowerCase() !== vendorName.trim().toLowerCase()}
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-[10px] bg-bad px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-bad/90 disabled:opacity-40 transition"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
