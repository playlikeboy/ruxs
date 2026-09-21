"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Tag, ShieldCheck, Check, Sparkles } from "lucide-react";
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
    removeFromCart,
    clearCart,
    subtotalPaise,
    deliveryFeePaise,
    discountPaise,
    totalPaise,
    promoCode,
    applyPromoCode,
    currentGeofence,
    setActiveTab,
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
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsCartOpen(false);
      // Switch directly to live delivery tracking screen (Screen 4)!
      setActiveTab("tracking");
    }, 900);
  };

  return (
    <DSBottomSheet
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      showCloseButton={false}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Cart Header (Screen 2: Back, "Cart", Trash) */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-foreground hover:bg-white/[0.1] transition active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <h2 className="text-base font-bold text-foreground tracking-tight">Cart</h2>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
            aria-label="Clear Cart"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-2xl">
                🛒
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add fresh meals, water cans, or daily groceries to start your routine.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-white/[0.12]"
              >
                {/* Item Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-white/[0.08]">
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
                    className="text-xs font-bold text-foreground truncate block hover:text-emerald-400 transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.selectedSize?.name || item.product.vendorName}
                  </p>
                  <p className="mt-1 text-xs font-extrabold text-foreground">
                    {formatINR(item.totalPricePaise as Paise)}
                  </p>
                </div>

                {/* Tactile Green Stepper Pill */}
                <DSQuantityStepper
                  value={item.quantity}
                  onChange={(newQty) => updateCartQuantity(item.id, newQty)}
                  min={0}
                  size="sm"
                  variant="green-pill"
                />
              </div>
            ))
          )}

          {/* Promo Code Input (Screen 2) */}
          {cart.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 pl-3">
                <Tag size={15} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Promo code (e.g. RUXS30)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400 active:scale-95 shadow"
                >
                  Apply
                </button>
              </div>

              {promoMessage && (
                <p
                  className={`mt-1.5 text-[11px] font-medium px-2 ${
                    promoMessage.isError ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>
          )}

          {/* Price Breakdown Card (Screen 2) */}
          {cart.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatINR(subtotalPaise as Paise)}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>Delivery</span>
                  {currentGeofence.isInside && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      Geofence Free
                    </span>
                  )}
                </span>
                <span className="font-semibold text-foreground">
                  {deliveryFeePaise === 0 ? "Free" : `${formatINR(deliveryFeePaise as Paise)}`}
                </span>
              </div>

              {discountPaise > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Discount ({promoCode})</span>
                  <span className="font-bold">-{formatINR(discountPaise as Paise)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-emerald-400 text-base">
                  {formatINR(totalPaise as Paise)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Checkout Button (Screen 2: Checkout) */}
        {cart.length > 0 && (
          <div className="border-t border-white/[0.08] bg-[#0d120f] p-4">
            <DSButton
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isCheckingOut}
              onClick={handleCheckout}
              className="font-bold text-base shadow-[0_8px_24px_rgba(16,185,129,0.3)]"
            >
              Checkout · {formatINR(totalPaise as Paise)}
            </DSButton>
          </div>
        )}
      </div>
    </DSBottomSheet>
  );
}
