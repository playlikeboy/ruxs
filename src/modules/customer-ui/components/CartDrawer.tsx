"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Tag, ShoppingBag } from "lucide-react";
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
      setActiveTab("tracking");
    }, 600);
  };

  return (
    <DSBottomSheet
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      showCloseButton={false}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[85vh] text-gray-900 font-sans">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <h2 className="text-base font-bold text-gray-950 tracking-tight">Cart</h2>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30"
            aria-label="Clear Cart"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ShoppingBag size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-gray-500">
                Add fresh meals, water cans, or daily groceries to start your routine.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xs"
              >
                {/* Item Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-gray-100">
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
                    className="text-xs font-bold text-gray-900 truncate block hover:text-red-500"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] text-gray-400 truncate">
                    {item.selectedSize?.name || item.product.vendorName}
                  </p>
                  <p className="mt-1 text-xs font-extrabold text-gray-950">
                    {formatINR(item.totalPricePaise as Paise)}
                  </p>
                </div>

                {/* Stepper Pill */}
                <DSQuantityStepper
                  value={item.quantity}
                  onChange={(newQty) => updateCartQuantity(item.id, newQty)}
                  min={0}
                  size="sm"
                  variant="pill"
                />
              </div>
            ))
          )}

          {/* Promo Code Input */}
          {cart.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 pl-3">
                <Tag size={15} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Promo code (e.g. RUXS30)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 outline-none uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-600"
                >
                  Apply
                </button>
              </div>

              {promoMessage && (
                <p
                  className={`mt-1.5 text-[11px] font-medium px-2 ${
                    promoMessage.isError ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>
          )}

          {/* Price Breakdown Card */}
          {cart.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(subtotalPaise as Paise)}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-500">
                <span className="flex items-center gap-1">
                  <span>Delivery</span>
                  {currentGeofence.isInside && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Geofence Free
                    </span>
                  )}
                </span>
                <span className="font-semibold text-gray-900">
                  {deliveryFeePaise === 0 ? "Free" : `${formatINR(deliveryFeePaise as Paise)}`}
                </span>
              </div>

              {discountPaise > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Discount ({promoCode})</span>
                  <span className="font-bold">-{formatINR(discountPaise as Paise)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="font-bold text-gray-950">Total</span>
                <span className="font-extrabold text-red-600 text-base">
                  {formatINR(totalPaise as Paise)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Checkout Button */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-4 shadow-sm">
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
