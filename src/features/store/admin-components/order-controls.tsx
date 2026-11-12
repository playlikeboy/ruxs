"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, IndianRupee, PackageCheck, Printer, Truck, Undo2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatINR } from "@/core/money";
import { AdminDialog } from "@/features/admin/components/admin-dialog";
import { refundStoreOrder, updateStoreOrderDetails, updateStoreOrderStatus } from "../actions";
import type { StoreOrderStatus, StorePaymentMode, StorePaymentStatus } from "../types";

type Dialog = "out_for_delivery" | "delivered" | "cancelled" | "returned" | "refund";

const errorBox = "rounded-[10px] bg-blush px-3 py-2 text-sm font-medium text-bad";

/** Next-step buttons for a store order, with confirm dialogs for dispatch, delivery, cancel, return and refund. */
export function StoreOrderActions({
  orderId,
  orderNumber,
  nextStatuses,
  paymentMode,
  paymentStatus,
  totalPaise,
  canRefund,
  courier: initialCourier,
  trackingNumber: initialTracking,
}: {
  orderId: string;
  orderNumber: string;
  nextStatuses: StoreOrderStatus[];
  paymentMode: StorePaymentMode;
  paymentStatus: StorePaymentStatus;
  totalPaise: number;
  canRefund: boolean;
  courier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [courier, setCourier] = useState(initialCourier ?? "");
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    if (pending) return;
    setDialog(null);
    setError(null);
  };

  function move(to: "packed" | "out_for_delivery" | "delivered" | "cancelled" | "returned") {
    setError(null);
    start(async () => {
      const res = await updateStoreOrderStatus({
        orderId,
        to,
        courier: to === "out_for_delivery" ? courier : undefined,
        trackingNumber: to === "out_for_delivery" ? tracking : undefined,
        cancelReason: to === "cancelled" ? reason : undefined,
      });
      if (!res.ok) {
        if (dialog) setError(res.error);
        else toast.error(res.error);
        return;
      }
      toast.success(
        to === "packed" ? "Marked packed" : to === "out_for_delivery" ? "Out for delivery. Household emailed." : to === "delivered" ? "Marked delivered" : to === "cancelled" ? "Order cancelled. Stock put back." : "Marked returned"
      );
      setDialog(null);
      setReason("");
      router.refresh();
    });
  }

  function refund() {
    setError(null);
    start(async () => {
      const res = await refundStoreOrder({ orderId, note: note || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(res.refundId ? `Refund sent (${res.refundId})` : "Refund recorded");
      setDialog(null);
      setNote("");
      router.refresh();
    });
  }

  const forward = nextStatuses.filter((s) => s === "packed" || s === "out_for_delivery" || s === "delivered");
  const canCancel = nextStatuses.includes("cancelled");
  const canReturn = nextStatuses.includes("returned");
  const total = formatINR(totalPaise);

  if (forward.length === 0 && !canCancel && !canReturn && !canRefund) {
    return <p className="text-sm text-muted">No further steps for this order.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {forward.includes("packed") && (
        <button type="button" disabled={pending} aria-busy={pending} onClick={() => move("packed")} className={buttonClass("primary", "md")}>
          <PackageCheck className="h-4 w-4" aria-hidden="true" /> {pending && !dialog ? "Saving…" : "Mark packed"}
        </button>
      )}
      {forward.includes("out_for_delivery") && (
        <button type="button" disabled={pending} onClick={() => setDialog("out_for_delivery")} className={buttonClass("primary", "md")}>
          <Truck className="h-4 w-4" aria-hidden="true" /> Send out for delivery
        </button>
      )}
      {forward.includes("delivered") && (
        <button type="button" disabled={pending} onClick={() => setDialog("delivered")} className={buttonClass("primary", "md")}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Mark delivered
        </button>
      )}
      {canRefund && (
        <button type="button" disabled={pending} onClick={() => setDialog("refund")} className={buttonClass("dark", "md")}>
          <IndianRupee className="h-4 w-4" aria-hidden="true" /> Refund {total}
        </button>
      )}
      {canReturn && (
        <button type="button" disabled={pending} onClick={() => setDialog("returned")} className={buttonClass("secondary", "md")}>
          <Undo2 className="h-4 w-4" aria-hidden="true" /> Mark returned
        </button>
      )}
      {canCancel && (
        <button type="button" disabled={pending} onClick={() => setDialog("cancelled")} className={buttonClass("danger", "md")}>
          <Ban className="h-4 w-4" aria-hidden="true" /> Cancel order
        </button>
      )}

      <AdminDialog
        open={dialog === "out_for_delivery"}
        onClose={close}
        busy={pending}
        tone="accent"
        icon={<Truck className="h-5 w-5" />}
        title="Send out for delivery"
        description="The household gets an email with these details."
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            move("out_for_delivery");
          }}
        >
          <Field label="Courier or rider" htmlFor="od-courier" hint="Optional.">
            <Input id="od-courier" maxLength={60} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="RUXs rider" />
          </Field>
          <Field label="Tracking number" htmlFor="od-track" hint="Optional.">
            <Input id="od-track" maxLength={80} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </Field>
          {error && <p role="alert" className={errorBox}>{error}</p>}
          <DialogButtons pending={pending} onCancel={close} confirm="Send out" busyText="Sending…" />
        </form>
      </AdminDialog>

      <AdminDialog
        open={dialog === "delivered"}
        onClose={close}
        busy={pending}
        tone="accent"
        icon={<CheckCircle2 className="h-5 w-5" />}
        title={`Mark ${orderNumber} delivered?`}
        description={paymentMode === "cod" ? `Confirm the rider collected ${total} in cash. The order becomes paid.` : "The household gets a delivery email."}
      >
        {error && <p role="alert" className={errorBox}>{error}</p>}
        <DialogButtons pending={pending} onCancel={close} onConfirm={() => move("delivered")} confirm={paymentMode === "cod" ? "Delivered, cash collected" : "Mark delivered"} busyText="Saving…" />
      </AdminDialog>

      <AdminDialog
        open={dialog === "cancelled"}
        onClose={close}
        busy={pending}
        icon={<Ban className="h-5 w-5" />}
        title={`Cancel ${orderNumber}?`}
        description={
          paymentStatus === "paid"
            ? "Stock goes back on the shelf and the order is marked Refund due. Refund it afterwards."
            : "Stock goes back on the shelf and the household gets an email."
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            move("cancelled");
          }}
        >
          <Field label="Reason" htmlFor="oc-reason" hint="The household sees this.">
            <Textarea id="oc-reason" required maxLength={200} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Item damaged in our store" />
          </Field>
          {error && <p role="alert" className={errorBox}>{error}</p>}
          <DialogButtons pending={pending} onCancel={close} confirm="Cancel order" busyText="Cancelling…" danger dismiss="Keep order" />
        </form>
      </AdminDialog>

      <AdminDialog
        open={dialog === "returned"}
        onClose={close}
        busy={pending}
        icon={<Undo2 className="h-5 w-5" />}
        title={`Mark ${orderNumber} returned?`}
        description={
          paymentStatus === "paid"
            ? "The order is marked Refund due. Returned stock is not added back automatically: use Adjust stock on the product if it can be resold."
            : "Returned stock is not added back automatically: use Adjust stock on the product if it can be resold."
        }
      >
        {error && <p role="alert" className={errorBox}>{error}</p>}
        <DialogButtons pending={pending} onCancel={close} onConfirm={() => move("returned")} confirm="Mark returned" busyText="Saving…" danger />
      </AdminDialog>

      <AdminDialog
        open={dialog === "refund"}
        onClose={close}
        busy={pending}
        icon={<IndianRupee className="h-5 w-5" />}
        title={`Refund ${total}?`}
        description={
          paymentMode === "online"
            ? "A full refund goes back to the household's original payment method through Razorpay. This can't be undone."
            : "Records that the cash was returned by hand. No money moves through Razorpay."
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            refund();
          }}
        >
          <Field label="Note" htmlFor="or-note" hint="Optional. Saved on the order.">
            <Input id="or-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {error && <p role="alert" className={errorBox}>{error}</p>}
          <DialogButtons pending={pending} onCancel={close} confirm={paymentMode === "online" ? `Refund ${total}` : "Record refund"} busyText="Refunding…" danger />
        </form>
      </AdminDialog>
    </div>
  );
}

function DialogButtons({
  pending,
  onCancel,
  onConfirm,
  confirm,
  busyText,
  danger = false,
  dismiss = "Back",
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
  confirm: string;
  busyText: string;
  danger?: boolean;
  dismiss?: string;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" disabled={pending} onClick={onCancel} className={buttonClass("secondary", "md")}>
        {dismiss}
      </button>
      <button
        type={onConfirm ? "button" : "submit"}
        onClick={onConfirm}
        disabled={pending}
        aria-busy={pending}
        className={buttonClass(danger ? "danger" : "primary", "md")}
      >
        {pending ? busyText : confirm}
      </button>
    </div>
  );
}

/** Courier, tracking and the internal note, without changing status. */
export function StoreOrderDetailsForm({
  orderId,
  courier,
  trackingNumber,
  adminNote,
}: {
  orderId: string;
  courier: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [c, setC] = useState(courier ?? "");
  const [t, setT] = useState(trackingNumber ?? "");
  const [n, setN] = useState(adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await updateStoreOrderDetails({ orderId, courier: c, trackingNumber: t, adminNote: n });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast.success("Order details saved");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courier or rider" htmlFor="sd-courier">
          <Input id="sd-courier" maxLength={60} value={c} onChange={(e) => setC(e.target.value)} />
        </Field>
        <Field label="Tracking number" htmlFor="sd-track">
          <Input id="sd-track" maxLength={80} value={t} onChange={(e) => setT(e.target.value)} />
        </Field>
      </div>
      <Field label="Internal note" htmlFor="sd-note" hint="Only admins see this.">
        <Textarea id="sd-note" maxLength={1000} rows={3} value={n} onChange={(e) => setN(e.target.value)} />
      </Field>
      {error && <p role="alert" className={errorBox}>{error}</p>}
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("secondary", "md")}>
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function PrintSlipButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "sm")}>
      <Printer className="h-4 w-4" aria-hidden="true" /> Print packing slip
    </button>
  );
}
