"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CreditCard, MapPin, Minus, Plus, RefreshCw, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import { placeStoreOrder, quoteMyStoreBag, startStoreOrderPayment } from "@/features/store/actions";
import type { StoreBagQuote, StoreBagQuoteLine, StorePaymentMode } from "@/features/store/types";
import { kidsCard, kidsPrimaryButton, kidsSecondaryButton } from "@/features/kids/components/kids-ui";
import { bagActions, useStoreBag, useStoreBagReady } from "./bag-store";
import { StoreProductImage } from "./store-product-card";
import { useStoreRazorpay } from "./use-store-razorpay";

const PANEL = `${kidsCard} p-4`;

const ISSUE_TEXT: Record<NonNullable<StoreBagQuoteLine["issue"]>, string> = {
  unavailable: "No longer sold. Not included in this order.",
  out_of_stock: "Out of stock. Not included in this order.",
  qty_reduced: "Fewer left than you asked for. Quantity lowered.",
};

type QuoteState = { status: "loading" } | { status: "ready"; quote: StoreBagQuote; sig: string } | { status: "error"; error: string };

/**
 * The RUXs Store bag and checkout. Lines come from browser storage; every
 * price, stock cap, delivery check and payment option comes from the server
 * quote (quoteMyStoreBag), which re-runs whenever the bag changes.
 */
export function BagCheckout({
  profile,
  onlineEnabled,
}: {
  /** Saved household profile (getMyProfile); null when no address is saved yet. */
  profile: { name: string; phone: string; address: string } | null;
  /** Razorpay keys are configured on the server. */
  onlineEnabled: boolean;
}) {
  const router = useRouter();
  const bag = useStoreBag();
  const ready = useStoreBagReady();
  const { pay, busy: paying } = useStoreRazorpay();
  const [quoteState, setQuoteState] = useState<QuoteState>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<StorePaymentMode | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const keyRef = useRef<{ sig: string; key: string } | null>(null);

  const items = useMemo(() => (bag?.items ?? []).map((i) => ({ productId: i.productId, qty: i.qty })), [bag]);
  const sig = useMemo(() => items.map((i) => `${i.productId}:${i.qty}`).join(","), [items]);

  // Re-price on the server whenever the bag changes (debounced for quick +/− taps).
  useEffect(() => {
    if (!ready || items.length === 0) return;
    let live = true;
    const t = setTimeout(async () => {
      setQuoteState((s) => (s.status === "ready" ? s : { status: "loading" }));
      try {
        const res = await quoteMyStoreBag({ items });
        if (!live) return;
        if (!res.ok) {
          setQuoteState({ status: "error", error: res.error });
          return;
        }
        setQuoteState({ status: "ready", quote: res.quote, sig });
        bagActions.sync(res.quote.removedProductIds, res.quote.lines);
      } catch {
        if (live) setQuoteState({ status: "error", error: "Could not check prices. Check your connection and try again." });
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // `sig` captures the item list; `retry` re-runs after an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig, retry]);

  if (!ready) {
    return (
      <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading your bag">
        <div className="h-40 animate-pulse rounded-[20px] bg-kids-ink/[0.06] motion-reduce:animate-none" />
        <div className="h-24 animate-pulse rounded-[20px] bg-kids-ink/[0.06] motion-reduce:animate-none" />
      </div>
    );
  }

  if (!bag) {
    return (
      <div className={`${kidsCard} flex flex-col items-center px-6 py-10 text-center`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kids-peach/60">
          <ShoppingBag className="h-7 w-7 text-kids-ink" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-kids text-xl font-semibold">Your bag is empty</h2>
        <p className="mt-1 max-w-xs text-sm text-kids-ink/65">Add kits, puzzles and art supplies from the RUXs Store, then check out here.</p>
        <Link href="/app/kids/shop" className={`${kidsPrimaryButton} mt-5`}>
          Browse the store
        </Link>
      </div>
    );
  }

  const quote = quoteState.status === "ready" ? quoteState.quote : null;
  const lineById = new Map((quote?.lines ?? []).map((l) => [l.productId, l]));
  const modes = (quote?.paymentModes ?? []).filter((m) => m !== "online" || onlineEnabled);
  const selected: StorePaymentMode | null = mode && modes.includes(mode) ? mode : (modes[0] ?? null);
  const delivery = quote?.delivery ?? null;
  const blockers = quote?.blockers ?? [];
  // The delivery panel already shows the out-of-area message; list the rest here.
  const otherBlockers = blockers.filter((b) => b !== delivery?.message);
  const buyable = (quote?.lines ?? []).filter((l) => l.qty > 0);
  // Never place an order from a quote for an older version of the bag.
  const fresh = quoteState.status === "ready" && quoteState.sig === sig;
  const canPlace = fresh && !!quote && blockers.length === 0 && buyable.length > 0 && !!selected && !!profile;

  function submit() {
    if (!quote || !selected) return;
    const orderItems = buyable.map((l) => ({ productId: l.productId, qty: l.qty }));
    const orderSig = `${orderItems.map((i) => `${i.productId}:${i.qty}`).join(",")}|${selected}`;
    // Same bag and mode = same key, so a double tap or retry never makes two orders.
    if (!keyRef.current || keyRef.current.sig !== orderSig) keyRef.current = { sig: orderSig, key: crypto.randomUUID() };
    const clientKey = keyRef.current.key;

    startTransition(async () => {
      const res = await placeStoreOrder({ clientKey, items: orderItems, paymentMode: selected, notes: notes.trim() || undefined });
      if (!res.ok) {
        toast.error(res.error);
        setRetry((n) => n + 1);
        return;
      }
      bagActions.clear();
      keyRef.current = null;
      const orderUrl = `/app/kids/shop/orders/${res.orderId}`;
      if (!res.needsPayment) {
        toast.success(`Order ${res.orderNumber} placed`);
        router.push(orderUrl);
        return;
      }
      const start = await startStoreOrderPayment({ orderId: res.orderId });
      if (start.ok) {
        const outcome = await pay(start.checkout);
        if (outcome.status === "paid") toast.success(`Paid. Order ${res.orderNumber} placed`);
        else if (outcome.status === "failed") toast.error(outcome.error);
        else toast("Payment not finished. Pay from the order page to keep your items.");
      } else {
        toast.error(start.error);
      }
      router.push(orderUrl);
    });
  }

  const busy = pending || paying;

  return (
    <div className="space-y-4 pb-36">
      <section className={PANEL} aria-labelledby="bag-items">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="bag-items" className="font-kids text-lg font-semibold">
            In your bag
          </h2>
          {(quoteState.status === "loading" || (quoteState.status === "ready" && !fresh)) && (
            <span className="text-xs text-kids-ink/60" role="status">
              Checking prices…
            </span>
          )}
        </div>
        {quote?.changed && (
          <p className="mt-2 flex items-start gap-2 rounded-[12px] bg-kids-sunny/40 px-3 py-2 text-sm text-kids-ink" role="status">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            Your bag was updated to match current prices and stock.
          </p>
        )}
        <ul className="mt-2 divide-y divide-kids-ink/10">
          {bag.items.map((item) => {
            const line = lineById.get(item.productId);
            const excluded = !!line && line.qty === 0;
            const price = line?.unitPricePaise ?? item.unitPricePaise;
            const max = line?.stock.maxQty ?? item.maxQty;
            return (
              <li key={item.productId} className="flex gap-3 py-3">
                <Link href={`/app/kids/shop/p/${item.slug}`} className="shrink-0 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink">
                  <StoreProductImage src={item.image} alt="" className={cn("h-16 w-16 rounded-[12px]", excluded && "opacity-50")} />
                  <span className="sr-only">{item.name}</span>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className={cn("line-clamp-2 text-sm font-semibold leading-snug", excluded && "text-kids-ink/55")}>{item.name}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-kids-ink/65">{formatINR(price)} each</p>
                  {line?.issue && (
                    <p className={cn("mt-1 text-xs font-medium", excluded ? "text-bad" : "text-warn")}>{ISSUE_TEXT[line.issue]}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {excluded ? (
                      <button
                        type="button"
                        onClick={() => bagActions.remove(item.productId)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-bad hover:bg-bad/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                      </button>
                    ) : (
                      <div className="flex h-10 items-center rounded-full border border-kids-ink/20">
                        <button
                          type="button"
                          aria-label={item.qty === 1 ? `Remove ${item.name}` : `Remove one ${item.name}`}
                          onClick={() => bagActions.setQty(item.productId, item.qty - 1)}
                          className="flex h-full w-10 items-center justify-center rounded-full hover:bg-kids-ink/5 focus-visible:outline-2 focus-visible:outline-kids-ink"
                        >
                          {item.qty === 1 ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Add one ${item.name}`}
                          disabled={item.qty >= max}
                          onClick={() => bagActions.setQty(item.productId, item.qty + 1)}
                          className="flex h-full w-10 items-center justify-center rounded-full hover:bg-kids-ink/5 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-kids-ink"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className={cn("shrink-0 text-sm font-bold tabular-nums", excluded && "text-kids-ink/40 line-through")}>
                  {formatINR(price * item.qty)}
                </p>
              </li>
            );
          })}
        </ul>
        <label className="mt-2 block">
          <span className="text-sm font-semibold">Note for delivery (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Gate number, best time to call…"
            className="mt-1 h-12 w-full rounded-[12px] border border-kids-ink/15 bg-white px-3.5 text-base text-kids-ink placeholder:text-kids-ink/50 focus:outline-none focus-visible:border-kids-ink focus-visible:ring-2 focus-visible:ring-kids-ink/20"
          />
        </label>
      </section>

      <section className={PANEL} aria-labelledby="bag-delivery">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-kids-ink/60" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="bag-delivery" className="font-semibold">
                {profile ? `Deliver to ${profile.name}` : "Delivery address"}
              </h2>
              <p className="mt-0.5 text-sm text-kids-ink/70">{profile?.address ?? "No address saved yet"}</p>
              {profile?.phone && <p className="text-sm tabular-nums text-kids-ink/70">{profile.phone}</p>}
            </div>
          </div>
          <Link
            href="/app/account?next=/app/kids/shop/bag"
            className="inline-flex min-h-10 shrink-0 items-center rounded-full px-2 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            {profile ? "Change" : "Add"}
          </Link>
        </div>
        {delivery && !delivery.serviceable && delivery.message && (
          <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-kids-peach/50 px-3 py-2 text-sm font-medium text-kids-ink" role="status">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
            <span>
              {delivery.message}
              {delivery.hasProfile && quote?.settings.serviceability === "geofence" && (
                <span className="block font-normal text-kids-ink/70">This address is outside our delivery area, so we cannot take this order yet.</span>
              )}
            </span>
          </p>
        )}
        {quote && quote.settings.dispatchDays > 0 && (delivery?.serviceable ?? false) && (
          <p className="mt-3 text-sm text-kids-ink/70">
            Packed and sent within {quote.settings.dispatchDays} {quote.settings.dispatchDays === 1 ? "day" : "days"} of your order.
          </p>
        )}
      </section>

      <section className={PANEL} aria-labelledby="bag-payment">
        <h2 id="bag-payment" className="font-semibold">
          Payment
        </h2>
        {quote && modes.length === 0 ? (
          <p className="mt-2 text-sm text-kids-ink/70">No payment option is available for this order right now.</p>
        ) : (
          <div className="mt-3 space-y-2" role="radiogroup" aria-labelledby="bag-payment">
            {(quote ? modes : (["online", "cod"] as StorePaymentMode[])).map((m) => {
              const Icon = m === "online" ? CreditCard : Wallet;
              const checked = selected === m;
              return (
                <label
                  key={m}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kids-ink",
                    checked ? "border-kids-ink bg-kids-cream" : "border-kids-ink/15 hover:border-kids-ink/35",
                    !quote && "pointer-events-none opacity-60"
                  )}
                >
                  <input type="radio" name="store-payment" className="sr-only" checked={checked} disabled={!quote} onChange={() => setMode(m)} />
                  <Icon className="h-5 w-5 text-kids-ink/60" aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m === "online" ? "Pay online" : "Pay on delivery"}</span>
                    <span className="block text-xs text-kids-ink/65">
                      {m === "online" ? "UPI, cards, netbanking · secured by Razorpay" : "Cash or UPI when the order arrives"}
                    </span>
                  </span>
                  <span className={cn("h-5 w-5 rounded-full border-2", checked ? "border-[6px] border-kids-ink" : "border-kids-ink/30")} aria-hidden="true" />
                </label>
              );
            })}
          </div>
        )}
        {quote && quote.settings.codEnabled && !quote.paymentModes.includes("cod") && quote.settings.codMaxPaise != null && (
          <p className="mt-2 text-xs text-kids-ink/65">Pay on delivery is available for orders up to {formatINR(quote.settings.codMaxPaise)}.</p>
        )}
      </section>

      <section className={PANEL} aria-labelledby="bag-bill">
        <h2 id="bag-bill" className="font-semibold">
          Bill details
        </h2>
        {quoteState.status === "error" ? (
          <div className="mt-3 space-y-3" role="alert">
            <p className="text-sm text-bad">{quoteState.error}</p>
            <button type="button" onClick={() => setRetry((n) => n + 1)} className={kidsSecondaryButton}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </div>
        ) : !quote ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            <div className="h-4 w-full animate-pulse rounded bg-kids-ink/[0.06] motion-reduce:animate-none" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-kids-ink/[0.06] motion-reduce:animate-none" />
          </div>
        ) : (
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-kids-ink/70">Items ({quote.itemCount})</dt>
              <dd className="tabular-nums">{formatINR(quote.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-kids-ink/70">Delivery</dt>
              <dd className="tabular-nums">{quote.deliveryFeePaise === 0 ? "Free" : formatINR(quote.deliveryFeePaise)}</dd>
            </div>
            {quote.freeDeliveryGapPaise != null && quote.freeDeliveryGapPaise > 0 && (
              <p className="text-xs text-kids-ink/65">Add {formatINR(quote.freeDeliveryGapPaise)} more for free delivery.</p>
            )}
            <div className="flex justify-between gap-3 border-t border-kids-ink/10 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(quote.totalPaise)}</dd>
            </div>
            <p className="text-xs text-kids-ink/60">Prices include GST.</p>
          </dl>
        )}
        {otherBlockers.length > 0 && (
          <ul className="mt-3 space-y-1" role="status">
            {otherBlockers.map((b) => (
              <li key={b} className="flex items-start gap-2 rounded-[12px] bg-kids-peach/50 px-3 py-2 text-sm font-medium">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md border-t border-kids-ink/10 bg-kids-cream px-4 py-3">
        {profile ? (
          <button
            type="button"
            disabled={!canPlace || busy}
            aria-busy={busy}
            onClick={submit}
            className="flex min-h-14 w-full items-center justify-between rounded-full bg-kids-ink px-6 text-white shadow-xs transition hover:bg-kids-ink/90 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
          >
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold tabular-nums">{quote ? formatINR(quote.totalPaise) : "…"}</span>
              <span className="block text-xs opacity-80">Total</span>
            </span>
            <span className="text-[15px] font-bold">
              {busy ? "Placing order…" : selected === "online" ? "Pay and place order" : "Place order"}
            </span>
          </button>
        ) : (
          <Link
            href="/app/account?next=/app/kids/shop/bag"
            className="flex min-h-14 w-full items-center justify-center rounded-full bg-kids-ink text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
          >
            Add delivery address to continue
          </Link>
        )}
      </div>
    </div>
  );
}
