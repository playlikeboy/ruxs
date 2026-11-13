"use client";

import { useState } from "react";
import { Ban, Check, IndianRupee, PackageCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { formatINR } from "@/core/money";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { refundStoreReturn, updateStoreReturn } from "../admin-actions";
import type { AdminStoreReturn } from "../types";
import { DialogButtons, ErrorNote } from "./seller-ui";
import { useStoreAction } from "./use-store-action";

type Dialog = "rejected" | "received" | "refunded";

/** The next steps for one return request: approve, decline, receive the parcel, refund. */
export function ReturnActions({ ret }: { ret: AdminStoreReturn }) {
  const { pending, error, setError, run } = useStoreAction();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const total = formatINR(ret.totalPaise);
  const next = ret.nextStatuses;

  const close = () => {
    if (pending) return;
    setDialog(null);
    setError(null);
    setNote("");
  };
  const done = () => {
    setDialog(null);
    setNote("");
  };

  if (next.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {next.includes("approved") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateStoreReturn({ returnId: ret.id, to: "approved" }), { toastError: true, success: "Return approved. The household is told to send it back." })}
          className={buttonClass("primary", "sm")}
        >
          <Check className="h-4 w-4" aria-hidden="true" /> Approve
        </button>
      )}
      {next.includes("received") && (
        <button type="button" disabled={pending} onClick={() => setDialog("received")} className={buttonClass("primary", "sm")}>
          <PackageCheck className="h-4 w-4" aria-hidden="true" /> Mark received
        </button>
      )}
      {next.includes("refunded") && (
        <button type="button" disabled={pending} onClick={() => setDialog("refunded")} className={buttonClass("dark", "sm")}>
          <IndianRupee className="h-4 w-4" aria-hidden="true" /> Refund {total}
        </button>
      )}
      {next.includes("rejected") && (
        <button type="button" disabled={pending} onClick={() => setDialog("rejected")} className={buttonClass("danger", "sm")}>
          <Ban className="h-4 w-4" aria-hidden="true" /> Decline
        </button>
      )}

      <AdminDialog
        open={dialog === "rejected"}
        onClose={close}
        busy={pending}
        icon={<Ban className="h-5 w-5" />}
        title={`Decline the return for ${ret.orderNumber}?`}
        description="The household sees your reason and can ask again."
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateStoreReturn({ returnId: ret.id, to: "rejected", note }), { success: "Return declined", onOk: done });
          }}
        >
          <Field label="Reason" htmlFor={`rr-${ret.id}`} hint="Shown to the household.">
            <Textarea id={`rr-${ret.id}`} required minLength={3} maxLength={500} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The kit was opened and parts are missing." />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <DialogButtons pending={pending} onCancel={close} confirm="Decline return" busyText="Saving…" danger />
        </form>
      </AdminDialog>

      <AdminDialog
        open={dialog === "received"}
        onClose={close}
        busy={pending}
        tone="accent"
        icon={<PackageCheck className="h-5 w-5" />}
        title={`Parcel for ${ret.orderNumber} is back?`}
        description="The order becomes Returned and its payment becomes Refund due. Refund it as the next step."
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateStoreReturn({ returnId: ret.id, to: "received", restock, note: note || undefined }), {
              success: (r) => (r.restocked ? "Marked received. Stock put back." : "Marked received. Stock not changed."),
              onOk: done,
            });
          }}
        >
          <Toggle id={`rs-${ret.id}`} label="Put the items back in stock" checked={restock} onChange={setRestock} />
          <p className="text-xs text-muted">Switch this off for damaged or opened items that can&apos;t be sold again.</p>
          <Field label="Note" htmlFor={`rn-${ret.id}`} hint="Optional. Shown to the household.">
            <Input id={`rn-${ret.id}`} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <DialogButtons pending={pending} onCancel={close} confirm="Mark received" busyText="Saving…" />
        </form>
      </AdminDialog>

      <AdminDialog
        open={dialog === "refunded"}
        onClose={close}
        busy={pending}
        icon={<IndianRupee className="h-5 w-5" />}
        title={`Refund ${total}?`}
        description={
          ret.paymentMode === "online"
            ? "A full refund goes back to the household's original payment method through Razorpay. This can't be undone."
            : "This order was cash on delivery. Return the cash by hand first; this only records that you did."
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => refundStoreReturn({ returnId: ret.id, note: note || undefined }), {
              success: (r) => (r.refundId ? `Refund of ${formatINR(r.amountPaise)} sent` : `Refund of ${formatINR(r.amountPaise)} recorded`),
              onOk: done,
            });
          }}
        >
          <Field label="Note" htmlFor={`rf-${ret.id}`} hint="Optional. Saved on the order.">
            <Input id={`rf-${ret.id}`} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <DialogButtons pending={pending} onCancel={close} confirm={ret.paymentMode === "online" ? `Refund ${total}` : "Record refund"} busyText="Refunding…" danger />
        </form>
      </AdminDialog>
    </div>
  );
}
