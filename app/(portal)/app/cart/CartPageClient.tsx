"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Tag, Trash2, CheckCircle2 } from "lucide-react";
import { useCustomerUI } from "@/src/modules/customer-ui/context/CustomerUIContext";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";
import { DSButton, DSQuantityStepper } from "@/src/design-system";
import { formatINR, Paise } from "@/src/shared/types/money";

export default function CartPageClient() {
  const {
    cart,
    updateCartQuantity,
    clearCart,
    subtotalPaise,
    deliveryFeePaise,
    discountPaise,
    totalPaise,
  } = useCustomerUI();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const apply = () => {
    setMessage(
      code.trim()
        ? "Promo validation applied at checkout. No active promo code discount."
        : "Enter a promo code to validate."
    );
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5 text-ink font-sans">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink shadow-xs hover:bg-surface-band transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            Customer App
          </p>
          <h1 className="mt-1 text-lg font-bold font-display">Shopping Cart</h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          disabled={cart.length === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-muted hover:text-[#C62828] hover:bg-[#C62828]/10 shadow-xs transition-colors disabled:opacity-30 cursor-pointer"
          aria-label="Clear cart"
        >
          <Trash2 size={17} />
        </button>
      </header>

      {cart.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-dashed border-border bg-surface-raised p-10 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-band text-ink-muted">
            <ShoppingBag size={24} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink font-display">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ink-muted">
            Add milk, drinking water cans, or daily meals from the live marketplace to review them here.
          </p>
          <Link
            href={CUSTOMER_ROUTES.home}
            className="mt-5 inline-flex h-10 items-center rounded-full bg-action px-5 text-xs font-bold text-white shadow-xs hover:bg-action-hover transition-all"
          >
            Explore marketplace
          </Link>
        </section>
      ) : (
        <div className="mt-6 space-y-4">
          <section className="space-y-2.5">
            {cart.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface-raised p-3.5 shadow-card"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-band border border-border">
                  <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/app/product/${item.product.id}`}
                    className="block truncate text-xs font-bold text-ink hover:text-action transition-colors font-display"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-0.5 truncate text-[10px] text-ink-muted">
                    {item.product.vendorName}
                  </p>
                  <p className="mt-1 text-xs font-extrabold text-ink">
                    {formatINR(Number(item.totalPricePaise) as Paise)}
                  </p>
                </div>
                <DSQuantityStepper
                  value={item.quantity}
                  onChange={(quantity) => updateCartQuantity(item.id, quantity)}
                  min={0}
                  size="sm"
                  variant="coral-pill"
                />
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-band p-1.5 pl-3">
              <Tag size={15} className="text-coral shrink-0" />
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Promo code (e.g. RUXS30)"
                className="min-w-0 flex-1 bg-transparent text-xs uppercase text-ink placeholder:text-ink-subtle outline-none font-mono font-bold"
                aria-label="Promo code"
              />
              <button
                type="button"
                onClick={apply}
                className="rounded-full bg-action px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-action-hover transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
            {message && <p className="mt-2 text-[11px] text-ink-muted px-2 font-medium">{message}</p>}

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span>
                <span className="font-bold text-ink">{formatINR(subtotalPaise as Paise)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span>Society Delivery</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[#2E7D32] font-bold bg-[#E8F5E9] px-1.5 py-0.5 rounded-full border border-[#2E7D32]/20">
                    <CheckCircle2 size={10} />
                    Pre-cleared
                  </span>
                </span>
                <span className="font-bold text-ink">
                  {deliveryFeePaise === 0
                    ? "Free · Pre-cleared Pass"
                    : formatINR(deliveryFeePaise as Paise)}
                </span>
              </div>
              {discountPaise > 0 && (
                <div className="flex justify-between text-[#2E7D32] font-semibold">
                  <span>Discount</span>
                  <span className="font-bold">-{formatINR(discountPaise as Paise)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-sm">
                <span className="font-bold text-ink font-display">Estimated total</span>
                <span className="font-extrabold text-action text-base">{formatINR(totalPaise as Paise)}</span>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-ink-muted">
              Orders are reconciled to your digital Khata ledger with zero morning follow-up.
            </p>

            <DSButton
              variant="primary"
              fullWidth
              size="lg"
              className="mt-5 font-bold"
              onClick={() => window.location.assign(CUSTOMER_ROUTES.home)}
            >
              Continue browsing · {formatINR(totalPaise as Paise)}
            </DSButton>
          </section>
        </div>
      )}
    </main>
  );
}
