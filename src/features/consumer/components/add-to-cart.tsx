"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import {
  cartActions,
  useCart,
  type CartItem,
  type StoreInfo,
} from "./cart-store";

export function AddToCart({
  store,
  item,
  disabled,
}: {
  store: StoreInfo;
  item: Omit<CartItem, "qty">;
  disabled?: boolean;
}) {
  const cart = useCart();
  const [askReplace, setAskReplace] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  // The replace-cart sheet takes focus and closes on Escape, like any dialog.
  useEffect(() => {
    if (!askReplace) return;
    const previous = document.activeElement as HTMLElement | null;
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAskReplace(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [askReplace]);
  const qty =
    cart?.vendorSlug === store.vendorSlug
      ? (cart.items.find((i) => i.productId === item.productId)?.qty ?? 0)
      : 0;

  if (disabled) {
    return (
      <span className="inline-flex h-9 w-24 items-center justify-center rounded-lg border border-line bg-app-canvas text-xs font-semibold text-muted">
        Unavailable
      </span>
    );
  }

  return (
    <>
      {qty === 0 ? (
        <button
          type="button"
          onClick={() => {
            if (!cartActions.add(store, item)) setAskReplace(true);
          }}
          aria-label={`Add ${item.name} to cart`}
          className="border-accent/30 text-accent hover:bg-brand-peach/40 h-9 w-24 rounded-lg border bg-white text-sm font-bold tracking-wide uppercase shadow-sm transition active:scale-95"
        >
          Add
        </button>
      ) : (
        <div className="bg-accent flex h-9 w-24 items-center justify-between rounded-lg text-white shadow-sm">
          <button
            type="button"
            aria-label={`Remove one ${item.name}`}
            onClick={() => cartActions.setQty(item.productId, qty - 1)}
            className="flex h-full w-8 items-center justify-center active:scale-90"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="text-sm font-bold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label={`Add one ${item.name}`}
            onClick={() => cartActions.setQty(item.productId, qty + 1)}
            disabled={qty >= 20}
            className="flex h-full w-8 items-center justify-center active:scale-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {askReplace &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAskReplace(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${dialogId}-title`}
              aria-describedby={`${dialogId}-text`}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <h2
                id={`${dialogId}-title`}
                className="text-ink text-lg font-semibold"
              >
                Start a new cart?
              </h2>
              <p id={`${dialogId}-text`} className="mt-1.5 text-sm text-muted">
                Your cart has items from {cart?.vendorName}. Adding this will
                clear them, since each order comes from one store.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  ref={keepRef}
                  type="button"
                  onClick={() => setAskReplace(false)}
                  className="text-ink hover:bg-app-canvas h-12 rounded-xl border border-line font-semibold"
                >
                  Keep cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cartActions.add(store, item, true);
                    setAskReplace(false);
                  }}
                  className="bg-accent hover:bg-accent/90 h-12 rounded-xl font-semibold text-white"
                >
                  Start new
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
