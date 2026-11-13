"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { archiveStoreProduct, restoreStoreProduct } from "../actions";

/** Archive hides a product everywhere (never deletes: orders reference it). Restore brings it back hidden. */
export function ProductArchiveButton({ productId, name, archived }: { productId: string; name: string; archived: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const res = archived ? await restoreStoreProduct({ productId }) : await archiveStoreProduct({ productId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(archived ? "Restored. It stays hidden until you turn it live." : "Product archived");
      setOpen(false);
      router.refresh();
    });
  }

  if (archived) {
    return (
      <button type="button" disabled={pending} onClick={run} className={buttonClass("secondary", "sm")}>
        <ArchiveRestore className="h-4 w-4" aria-hidden="true" /> {pending ? "Restoring…" : "Restore"}
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("danger", "sm")}>
        <Archive className="h-4 w-4" aria-hidden="true" /> Archive
      </button>
      <AdminDialog
        open={open}
        onClose={() => setOpen(false)}
        busy={pending}
        icon={<Archive className="h-5 w-5" />}
        title={`Archive ${name}?`}
        description="Households stop seeing it right away. Past orders keep their copy, and you can restore it later."
      >
        <div className="flex justify-end gap-2">
          <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonClass("secondary", "md")}>
            Keep it
          </button>
          <button type="button" disabled={pending} aria-busy={pending} onClick={run} className={buttonClass("danger", "md")}>
            {pending ? "Archiving…" : "Archive product"}
          </button>
        </div>
      </AdminDialog>
    </>
  );
}
