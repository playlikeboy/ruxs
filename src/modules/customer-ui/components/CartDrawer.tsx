"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Tag, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import {
  DSBottomSheet,
  DSButton,
  DSQuantityStepper,
} from "@/src/design-system";

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    clearCart,
    subtotalPaise,
    deliveryFeePaise,
    discountPaise,
    totalPaise,
    promoCode,
    applyPromoCode,
    currentGeofence,
  } = useCustomerUI();

  const [inputCode, setInputCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleApplyCode = () => {
    if (!inputCode) return;
    const res = applyPromoCode(inputCode);
    setPromoMessage({
      text: res.message,
      isError: !res.success,
    });
    if (res.success) setInputCode("");
  };

  const handleCheckout = () => {
    setIsCheckingOut(false);
  };

  return (
    <DSBottomSheet
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      showCloseButton={false}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[85vh] text-ink font-sans">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-raised">
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-band text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <h2 className="text-base font-bold text-ink tracking-tight font-display">Your Routine Cart</h2>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:text-[#C62828] hover:bg-[#C62828]/10 transition-colors disabled:opacity-30 cursor-pointer"
            aria-label="Clear Cart"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-surface">
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-band text-ink-muted">
                <ShoppingBag size={24} />
              </div>
              <p className="mt-3 text-sm font-bold text-ink font-display">Your cart is empty</p>
              <p className="mt-1 text-xs text-ink-muted max-w-xs mx-auto">
                Add fresh milk, 20L water cans, or homestyle meals to start your routine.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-card"
              >
                {/* Item Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-border bg-surface-band">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/app/product/${item.product.id}`}
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs font-bold text-ink truncate block hover:text-action transition-colors font-display"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] text-ink-muted truncate">
                    {item.selectedSize?.name || item.product.vendorName}
                  </p>
                  <p className="mt-1 text-xs font-extrabold text-ink">
                    {formatINR(item.totalPricePaise as Paise)}
                  </p>
                </div>

                {/* Stepper Pill */}
                <DSQuantityStepper
                  value={item.quantity}
                  onChange={(newQty) => updateCartQuantity(item.id, newQty)}
                  min={0}
                  size="sm"
                  variant="coral-pill"
                />
              </div>
            ))
          )}

          {/* Promo Code Input */}
          {cart.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-raised p-1.5 pl-3">
                <Tag size={15} className="text-coral shrink-0" />
                <input
                  type="text"
                  placeholder="Promo code (e.g. RUXS30)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-transparent text-xs text-ink placeholder:text-ink-subtle outline-none uppercase font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="rounded-full bg-action px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-action-hover transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {promoMessage && (
                <p
                  className={`mt-1.5 text-[11px] font-semibold px-2 ${
                    promoMessage.isError ? "text-[#C62828]" : "text-[#2E7D32]"
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>
          )}

          {/* Price Breakdown Card */}
          {cart.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-4 space-y-2.5 text-xs shadow-card">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Subtotal</span>
                <span className="font-bold text-ink">
                  {formatINR(subtotalPaise as Paise)}
                </span>
              </div>

              <div className="flex items-center justify-between text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span>Society Gate Delivery</span>
                  {currentGeofence.isInside && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-[#2E7D32] font-bold bg-[#E8F5E9] px-1.5 py-0.5 rounded-full border border-[#2E7D32]/20">
                      <CheckCircle2 size={10} />
                      Pre-cleared
                    </span>
                  )}
                </span>
                <span className="font-bold text-ink">
                  {deliveryFeePaise === 0
                    ? "Free · Society Pass"
                    : formatINR(deliveryFeePaise as Paise)}
                </span>
              </div>

              {discountPaise > 0 && (
                <div className="flex items-center justify-between text-[#2E7D32] font-semibold">
                  <span>Discount ({promoCode})</span>
                  <span className="font-bold">-{formatINR(discountPaise as Paise)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                <span className="font-bold text-ink font-display">Total</span>
                <span className="font-extrabold text-action text-base">
                  {formatINR(totalPaise as Paise)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Checkout Button */}
        {cart.length > 0 && (
          <div className="border-t border-border bg-surface-raised p-4 shadow-soft">
            <DSButton
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isCheckingOut}
              onClick={handleCheckout}
              className="font-bold text-base"
            >
              Checkout · {formatINR(totalPaise as Paise)}
            </DSButton>
          </div>
        )}
      </div>
    </DSBottomSheet>
  );
}
