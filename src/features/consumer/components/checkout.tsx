"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, MapPin, Minus, Plus, ShoppingBag, Wallet, ReceiptIndianRupee } from "lucide-react";
import { formatINR } from "@/core/money";
import { SLOT_LABEL } from "@/config/service-kinds";
import { placeOrder } from "@/features/consumer/actions";
import { startOrderPayment } from "@/features/payments/actions";
import { useRazorpay } from "@/features/payments/components/use-razorpay";
import { cartActions, cartSubtotal, useCart } from "./cart-store";
import { PriceBreakupList } from "./price-breakup";
import { priceBreakup, type PricingRules } from "@/core/pricing";

const NO_RULES: PricingRules = { gstBps: 0, pricesIncludeGst: true, discountBps: 0, commissionBps: 0 };
import { VegMark } from "./veg-mark";

const SLOTS = ["asap", "morning", "lunch", "evening", "dinner"] as const;

export function Checkout({ address, name, onlineEnabled }: { address: string | null; name: string | null; onlineEnabled: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const [clientKey] = useState(() => crypto.randomUUID());
  const [deliverOn, setDeliverOn] = useState<"today" | "tomorrow">("today");
  const [slot, setSlot] = useState<(typeof SLOTS)[number]>("asap");
  const [paymentMode, setPaymentMode] = useState<"online" | "cod" | "monthly_bill">(onlineEnabled ? "online" : "cod");
  const { pay, busy: paying } = useRazorpay();
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  if (!cart) {
    return (
      <div className="flex flex-col items-center px-6 pt-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-peach">
          <ShoppingBag className="h-9 w-9 text-accent" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">Your cart is empty</h2>
        <p className="mt-1.5 max-w-xs text-sm text-neutral-500">Browse tiffin kitchens and water suppliers near you, then add what you need.</p>
        <Link href="/app" className="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-white">
          Explore stores
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);
  const rules = cart.pricing ?? NO_RULES;
  const bill = priceBreakup(subtotal, cart.deliveryFeePaise, rules);
  const total = bill.totalPaise;
  const belowMin = subtotal < cart.minOrderPaise;

  function submit() {
    if (!cart) return;
    startTransition(async () => {
      const res = await placeOrder({
        clientKey,
        vendorSlug: cart.vendorSlug,
        items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        deliverOn,
        slot,
        paymentMode,
        notes: notes || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      cartActions.clear();
      if (paymentMode !== "online") {
        toast.success("Order placed");
        router.push(`/app/orders/${res.orderId}`);
        return;
      }
      const start = await startOrderPayment({ orderId: res.orderId });
      if (start.ok) {
        const outcome = await pay(start.checkout);
        if (outcome.status === "paid") toast.success("Paid · order placed");
        else if (outcome.status === "failed") toast.error(outcome.error);
        else toast("Payment not finished. You can pay from the order page.");
      } else {
        toast.error(start.error);
      }
      router.push(`/app/orders/${res.orderId}`);
    });
  }

  return (
    <div className="space-y-4 px-4 pb-44 pt-2">
      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Link href={`/app/store/${cart.vendorSlug}`} className="text-[15px] font-semibold text-ink">
          {cart.vendorName}
        </Link>
        <ul className="mt-3 divide-y divide-black/5">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <VegMark isVeg={item.isVeg} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-neutral-500 tabular-nums">{formatINR(item.unitPricePaise)}</p>
              </div>
              <div className="flex h-8 items-center rounded-lg border border-accent/30 text-accent">
                <button type="button" aria-label="Remove one" className="flex h-full w-8 items-center justify-center" onClick={() => cartActions.setQty(item.productId, item.qty - 1)}>
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span className="w-5 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                <button type="button" aria-label="Add one" className="flex h-full w-8 items-center justify-center disabled:opacity-40" disabled={item.qty >= 20} onClick={() => cartActions.setQty(item.productId, item.qty + 1)}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="w-16 text-right text-sm font-semibold text-ink tabular-nums">{formatINR(item.unitPricePaise * item.qty)}</p>
            </li>
          ))}
        </ul>
        <label className="mt-2 block">
          <span className="sr-only">Note for the store</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Add a note for the store (less spicy, ring bell…)"
            className="h-11 w-full rounded-xl bg-neutral-100 px-3.5 text-sm text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="text-[15px] font-semibold text-ink">When</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["today", "tomorrow"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeliverOn(d)}
              aria-pressed={deliverOn === d}
              className={"h-11 rounded-xl border text-sm font-semibold capitalize transition " + (deliverOn === d ? "border-ink bg-ink text-white" : "border-black/10 bg-white text-ink")}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              aria-pressed={slot === s}
              className={"h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition " + (slot === s ? "border-accent bg-peach text-accent" : "border-black/10 text-neutral-600")}
            >
              {SLOT_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Deliver to {name ?? ""}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{address ?? "No address saved yet"}</p>
            </div>
          </div>
          <Link href="/app/account?next=/app/cart" className="shrink-0 text-sm font-semibold text-accent">
            {address ? "Change" : "Add"}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="text-[15px] font-semibold text-ink">Payment</h2>
        <div className="mt-3 space-y-2">
          {[
            ...(onlineEnabled
              ? [{ id: "online" as const, title: "Pay online", text: "UPI, cards, netbanking · secured by Razorpay", Icon: CreditCard }]
              : []),
            { id: "cod" as const, title: "Pay on delivery", text: "Cash or UPI to the delivery person", Icon: Wallet },
            { id: "monthly_bill" as const, title: "Add to monthly bill", text: "Settle with your plan bill on the 1st", Icon: ReceiptIndianRupee },
          ].map(({ id, title, text, Icon }) => (
            <label key={id} className={"flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition " + (paymentMode === id ? "border-ink" : "border-black/10")}>
              <input type="radio" name="payment" className="sr-only" checked={paymentMode === id} onChange={() => setPaymentMode(id)} />
              <Icon className="h-5 w-5 text-neutral-600" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-neutral-500">{text}</span>
              </span>
              <span className={"h-5 w-5 rounded-full border-2 " + (paymentMode === id ? "border-[6px] border-ink" : "border-neutral-300")} aria-hidden="true" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="text-[15px] font-semibold text-ink">Bill details</h2>
        <div className="mt-3">
          <PriceBreakupList breakup={bill} gstBps={rules.gstBps} gstIncluded={rules.pricesIncludeGst} discountBps={rules.discountBps} showFee={paymentMode === "online"} />
        </div>
        {belowMin && (
          <p className="mt-3 rounded-lg bg-butter px-3 py-2 text-xs font-medium text-warn">
            Minimum order is {formatINR(cart.minOrderPaise)}. Add {formatINR(cart.minOrderPaise - subtotal)} more.
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md border-t border-black/5 bg-white px-4 py-3">
        {address ? (
          <button
            type="button"
            disabled={pending || paying || belowMin}
            onClick={submit}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 text-white shadow-[0_10px_30px_rgba(189,75,42,0.3)] transition active:scale-[0.98] disabled:opacity-60"
          >
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold tabular-nums">{formatINR(total)}</span>
              <span className="block text-[11px] opacity-90">TOTAL</span>
            </span>
            <span className="text-[15px] font-bold">{pending || paying ? "Working…" : paymentMode === "online" ? "Pay & place order →" : "Place order →"}</span>
          </button>
        ) : (
          <Link href="/app/account?next=/app/cart" className="flex h-14 w-full items-center justify-center rounded-2xl bg-ink text-[15px] font-bold text-white">
            Add delivery address to continue
          </Link>
        )}
      </div>
    </div>
  );
}
