"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Tag, Trash2 } from "lucide-react";
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
        ? "Promo validation is handled at checkout. No active promo code is available."
        : "Enter a promo code to validate it."
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer app</p>
          <h1 className="mt-1 text-xl font-bold">Cart</h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          disabled={cart.length === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm disabled:opacity-30"
          aria-label="Clear cart"
        >
          <Trash2 size={17} />
        </button>
      </header>

      {cart.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <ShoppingBag size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold">Your cart is empty.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Add an item from the live RUXS marketplace to review it here.
          </p>
          <Link
            href={CUSTOMER_ROUTES.search}
            className="mt-5 inline-flex h-10 items-center rounded-full bg-red-500 px-5 text-xs font-semibold text-white"
          >
            Browse marketplace
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-5">
          <section className="space-y-3">
            {cart.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
                  <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/app/product/${item.product.id}`}
                    className="block truncate text-sm font-bold text-gray-950 hover:text-red-500"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-1 truncate text-[11px] text-gray-500">{item.product.vendorName}</p>
                  <p className="mt-1 text-xs font-extrabold text-gray-950">
                    {formatINR(Number(item.totalPricePaise) as Paise)}
                  </p>
                </div>
                <DSQuantityStepper
                  value={item.quantity}
                  onChange={(quantity) => updateCartQuantity(item.id, quantity)}
                  min={0}
                  size="sm"
                  variant="pill"
                />
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              <Tag size={15} className="ml-1 shrink-0 text-gray-400" />
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Promo code"
                className="min-w-0 flex-1 bg-transparent px-1 text-xs uppercase outline-none"
                aria-label="Promo code"
              />
              <button
                type="button"
                onClick={apply}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white"
              >
                Apply
              </button>
            </div>
            {message && <p className="mt-2 text-[11px] text-gray-500">{message}</p>}

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">{formatINR(subtotalPaise as Paise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="font-semibold">
                  {deliveryFeePaise === 0 ? "Calculated at checkout" : formatINR(deliveryFeePaise as Paise)}
                </span>
              </div>
              {discountPaise > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatINR(discountPaise as Paise)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                <span className="font-bold">Estimated total</span>
                <span className="font-extrabold">{formatINR(totalPaise as Paise)}</span>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-4 text-gray-400">
              Final delivery charges and payment state are resolved by the checkout workflow once it is connected.
            </p>

            <DSButton
              variant="primary"
              fullWidth
              size="lg"
              className="mt-5"
              onClick={() => window.location.assign(CUSTOMER_ROUTES.services)}
            >
              Continue browsing
            </DSButton>
          </section>
        </div>
      )}
    </main>
  );
}
