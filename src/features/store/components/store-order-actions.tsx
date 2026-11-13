"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CreditCard, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelMyStoreOrder, requestStoreReturn, startStoreOrderPayment } from "@/features/store/actions";
import { kidsPrimaryButton, kidsSecondaryButton } from "@/features/kids/components/kids-ui";
import { useStoreRazorpay } from "./use-store-razorpay";

/** Opens Razorpay again for an unpaid online order that is still on hold. */
export function PayStoreOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { pay, busy } = useStoreRazorpay();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={busy || pending}
      aria-busy={busy || pending}
      onClick={() =>
        startTransition(async () => {
          const start = await startStoreOrderPayment({ orderId });
          if (!start.ok) {
            toast.error(start.error);
            return;
          }
          const outcome = await pay(start.checkout);
          if (outcome.status === "paid") toast.success("Paid. Your order is placed.");
          else if (outcome.status === "failed") toast.error(outcome.error);
          else toast("Payment not finished. You can try again before the hold ends.");
          router.refresh();
        })
      }
      className={`${kidsPrimaryButton} w-full disabled:opacity-60`}
    >
      <CreditCard className="h-4 w-4" aria-hidden="true" />
      {busy || pending ? "Opening payment…" : "Pay now"}
    </button>
  );
}

/** Cancel with a confirm sheet. Only rendered while the order can still be cancelled. */
export function CancelStoreOrderButton({ orderId, paid }: { orderId: string; paid: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const keepRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  function cancel() {
    startTransition(async () => {
      const res = await cancelMyStoreOrder({ orderId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      toast.success("Order cancelled");
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${kidsSecondaryButton} w-full text-bad hover:border-bad/40`}>
        <XCircle className="h-4 w-4" aria-hidden="true" /> Cancel order
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-kids-ink/40"
            onClick={(e) => {
              if (e.target === e.currentTarget && !pending) setOpen(false);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              aria-describedby={`${id}-text`}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-kids-ink"
            >
              <h2 id={`${id}-title`} className="font-kids text-xl font-semibold">
                Cancel this order?
              </h2>
              <p id={`${id}-text`} className="mt-1.5 text-sm text-kids-ink/70">
                {paid
                  ? "The items go back on the shelf and your payment is marked for refund."
                  : "The items go back on the shelf. You can order again any time."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button ref={keepRef} type="button" onClick={() => setOpen(false)} disabled={pending} className={kidsSecondaryButton}>
                  Keep order
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={pending}
                  aria-busy={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-bad px-5 text-sm font-bold text-white transition hover:bg-bad/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad"
                >
                  {pending ? "Cancelling…" : "Cancel order"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** "Request a return": opens a short reason form in place. Only rendered inside the return window. */
export function RequestReturnForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    if (text.length < 5) {
      setError("Tell us what went wrong, in a few words");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await requestStoreReturn({ orderId, reason: text });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        toast.success("Return requested");
        setOpen(false);
        router.refresh();
      } catch {
        setError("Could not send your request. Check your connection and try again.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${kidsSecondaryButton} w-full`}>
        <Undo2 className="h-4 w-4" aria-hidden="true" /> Request a return
      </button>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`${id}-reason`} className="text-sm font-semibold">
        Why are you returning this order?
      </label>
      <textarea
        id={`${id}-reason`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={3}
        required
        autoFocus
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        placeholder="Damaged, wrong item, parts missing…"
        className="mt-1 w-full rounded-[12px] border border-kids-ink/20 bg-white px-3.5 py-2.5 text-base leading-relaxed text-kids-ink placeholder:text-kids-ink/55 focus:outline-none focus-visible:border-kids-ink focus-visible:ring-2 focus-visible:ring-kids-ink/20"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-bad">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1 text-xs text-kids-ink/70">
          The return covers the whole order. RUXs reviews it and replies here.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className={`${kidsSecondaryButton} flex-1`}>
          Not now
        </button>
        <button type="submit" disabled={pending} aria-busy={pending} className={`${kidsPrimaryButton} flex-1 disabled:opacity-60`}>
          {pending ? "Sending…" : "Send request"}
        </button>
      </div>
    </form>
  );
}
