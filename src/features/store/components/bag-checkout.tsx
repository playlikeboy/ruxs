"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Check, CreditCard, MapPin, Minus, Plus, RefreshCw, ShoppingBag, Tag, Trash2, Truck, Wallet, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { formatINR } from "@/core/money";
import { INDIAN_STATES, normalizeCouponCode } from "@/core/store";
import { placeStoreOrder, quoteMyStoreBag, startStoreOrderPayment } from "@/features/store/actions";
import type { StoreBagQuote, StoreBagQuoteLine, StoreCheckoutPrefill, StorePaymentMode } from "@/features/store/types";
import { kidsCard, kidsPrimaryButton, kidsSecondaryButton } from "@/features/kids/components/kids-ui";
import { ADDRESS_FIELDS, addressErrors, displayPhone, loadSavedAddress, saveAddress, type AddressField, type CheckoutAddress } from "./address-store";
import { bagActions, useStoreBag, useStoreBagReady, type Bag } from "./bag-store";
import { StoreProductImage } from "./store-product-card";
import { useStoreRazorpay } from "./use-store-razorpay";

const PANEL = `${kidsCard} p-4`;

const ISSUE_TEXT: Record<NonNullable<StoreBagQuoteLine["issue"]>, string> = {
  unavailable: "No longer sold. Not included in this order.",
  out_of_stock: "Out of stock. Not included in this order.",
  qty_reduced: "Fewer left than you asked for. Quantity lowered.",
};

type QuoteState = { status: "loading" } | { status: "ready"; quote: StoreBagQuote; sig: string } | { status: "error"; error: string };

const INPUT =
  "mt-1 h-12 w-full rounded-[12px] border bg-white px-3.5 text-base text-kids-ink placeholder:text-kids-ink/55 focus:outline-none focus-visible:ring-2";
const INPUT_OK = "border-kids-ink/20 focus-visible:border-kids-ink focus-visible:ring-kids-ink/20";
const INPUT_BAD = "border-bad focus-visible:border-bad focus-visible:ring-bad/20";

interface CheckoutProps {
  /** Starting address: my last store order, else my RUXs profile (getMyStoreCheckoutPrefill). */
  prefill: StoreCheckoutPrefill;
  /** Razorpay keys are configured on the server. */
  onlineEnabled: boolean;
}

/**
 * The RUXs Store bag and checkout. Lines come from browser storage; every
 * price, stock cap, delivery charge, estimate, coupon and payment option comes
 * from the server quote (quoteMyStoreBag), which re-runs whenever the bag, the
 * PIN code, the state or the coupon changes.
 */
export function BagCheckout(props: CheckoutProps) {
  const bag = useStoreBag();
  const ready = useStoreBagReady();

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

  // Mounted only in the browser, so the address can start from this device's saved copy.
  return <Checkout bag={bag} {...props} />;
}

function startingAddress(prefill: StoreCheckoutPrefill): CheckoutAddress {
  const saved = loadSavedAddress();
  if (saved) return saved;
  return {
    name: prefill.name,
    phone: displayPhone(prefill.phone),
    line1: prefill.line1,
    line2: prefill.line2,
    landmark: prefill.landmark,
    city: prefill.city,
    state: prefill.state,
    pincode: prefill.pincode,
  };
}

function Checkout({ bag, prefill, onlineEnabled }: CheckoutProps & { bag: Bag }) {
  const router = useRouter();
  const { pay, busy: paying } = useStoreRazorpay();
  const [quoteState, setQuoteState] = useState<QuoteState>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<StorePaymentMode | null>(null);
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState<CheckoutAddress>(() => startingAddress(prefill));
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [pending, startTransition] = useTransition();
  const keyRef = useRef<{ sig: string; key: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => bag.items.map((i) => ({ productId: i.productId, qty: i.qty })), [bag]);
  // A half-typed PIN is not sent: delivery is priced once all six digits are in.
  const pin = address.pincode.length === 6 ? address.pincode : "";
  const sig = useMemo(
    () => [items.map((i) => `${i.productId}:${i.qty}`).join(","), pin, address.state, couponCode].join("|"),
    [items, pin, address.state, couponCode]
  );

  // Re-price on the server whenever the bag, destination or coupon changes (debounced for quick taps).
  useEffect(() => {
    if (items.length === 0) return;
    let live = true;
    const t = setTimeout(async () => {
      setQuoteState((s) => (s.status === "ready" ? s : { status: "loading" }));
      try {
        const res = await quoteMyStoreBag({ items, pincode: pin || undefined, state: address.state || undefined, couponCode: couponCode || undefined });
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
    // `sig` captures the items, destination and coupon; `retry` re-runs after an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, retry]);

  const quote = quoteState.status === "ready" ? quoteState.quote : null;
  const lineById = new Map((quote?.lines ?? []).map((l) => [l.productId, l]));
  const modes = (quote?.paymentModes ?? []).filter((m) => m !== "online" || onlineEnabled);
  const selected: StorePaymentMode | null = mode && modes.includes(mode) ? mode : (modes[0] ?? null);
  const delivery = quote?.delivery ?? null;
  const shipping = quote?.shipping ?? null;
  const coupon = quote?.coupon ?? null;
  const geofence = quote?.settings.serviceability === "geofence";
  // One-city mode only: the saved RUXs location decides whether we can deliver.
  const hasProfile = delivery?.hasProfile ?? false;
  const errors = addressErrors(address);
  const blockers = quote?.blockers ?? [];
  // The address form shows the PIN problem and the delivery panel the out-of-area message; list the rest by the bill.
  const otherBlockers = blockers.filter((b) => b !== delivery?.message && !(errors.pincode && /PIN code/i.test(b)));
  const buyable = (quote?.lines ?? []).filter((l) => l.qty > 0);
  // Never place an order from a quote for an older bag, destination or coupon.
  const fresh = quoteState.status === "ready" && quoteState.sig === sig;
  const checking = quoteState.status === "loading" || (quoteState.status === "ready" && !fresh);
  const blocked = blockers.some((b) => !(errors.pincode && /PIN code/i.test(b)));
  const canPlace = fresh && !!quote && !blocked && buyable.length > 0 && !!selected;

  function setField(field: AddressField, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  function fieldError(field: AddressField): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  function applyCoupon() {
    const code = normalizeCouponCode(couponInput);
    if (!code) return;
    setCouponCode(code);
    // Same code again (after a bag change, say): ask the server once more.
    if (code === couponCode) setRetry((n) => n + 1);
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponInput("");
  }

  function submit() {
    if (!quote || !selected) return;
    const firstBad = ADDRESS_FIELDS.find((f) => errors[f]);
    if (firstBad) {
      setTouched(Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, true])));
      toast.error("Check your delivery address");
      formRef.current?.querySelector<HTMLElement>(`[name="ship-${firstBad}"]`)?.focus();
      return;
    }
    const shipTo: CheckoutAddress = {
      name: address.name.trim(),
      phone: address.phone.trim(),
      line1: address.line1.trim(),
      line2: address.line2.trim(),
      landmark: address.landmark.trim(),
      city: address.city.trim(),
      state: address.state,
      pincode: address.pincode,
    };
    const appliedCode = coupon?.applied ? coupon.code : undefined;
    const orderItems = buyable.map((l) => ({ productId: l.productId, qty: l.qty }));
    const orderSig = [orderItems.map((i) => `${i.productId}:${i.qty}`).join(","), selected, appliedCode ?? "", JSON.stringify(shipTo)].join("|");
    // Same bag, address, coupon and mode = same key, so a double tap or retry never makes two orders.
    if (!keyRef.current || keyRef.current.sig !== orderSig) keyRef.current = { sig: orderSig, key: crypto.randomUUID() };
    const clientKey = keyRef.current.key;
    saveAddress(shipTo);

    startTransition(async () => {
      const res = await placeStoreOrder({
        clientKey,
        items: orderItems,
        paymentMode: selected,
        shipping: shipTo,
        couponCode: appliedCode,
        expectedTotalPaise: quote.totalPaise,
        notes: notes.trim() || undefined,
      });
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

  const textField = (
    field: Exclude<AddressField, "state">,
    label: string,
    opts: { autoComplete: string; optional?: boolean; placeholder?: string; inputMode?: "numeric" | "tel"; maxLength: number; hint?: string }
  ) => {
    const error = fieldError(field);
    const id = `ship-${field}`;
    return (
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {opts.optional && <span className="font-normal text-kids-ink/65"> (optional)</span>}
        </label>
        <input
          id={id}
          name={id}
          type={field === "phone" ? "tel" : "text"}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          maxLength={opts.maxLength}
          placeholder={opts.placeholder}
          value={address[field]}
          required={!opts.optional}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : opts.hint ? `${id}-hint` : undefined}
          onChange={(e) => setField(field, field === "pincode" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
          className={cn(INPUT, error ? INPUT_BAD : INPUT_OK, (field === "pincode" || field === "phone") && "tabular-nums")}
        />
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-bad">
            {error}
          </p>
        ) : (
          opts.hint && (
            <p id={`${id}-hint`} className="mt-1 text-xs text-kids-ink/65">
              {opts.hint}
            </p>
          )
        )}
      </div>
    );
  };
  const stateError = fieldError("state");

  return (
    <div className="space-y-4 pb-36">
      <section className={PANEL} aria-labelledby="bag-items">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="bag-items" className="font-kids text-lg font-semibold">
            In your bag
          </h2>
          {checking && (
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
        <h2 id="bag-delivery" className="flex items-center gap-2 font-semibold">
          <MapPin className="h-5 w-5 text-kids-ink/60" aria-hidden="true" /> Delivery address
        </h2>
        <div ref={formRef} className="mt-3 space-y-3">
          {textField("name", "Receiver's name", { autoComplete: "name", maxLength: 80 })}
          {textField("phone", "Mobile number", { autoComplete: "tel-national", inputMode: "tel", maxLength: 16, hint: "10 digits. We call only about this delivery." })}
          {textField("line1", "House or flat, street", { autoComplete: "address-line1", maxLength: 120 })}
          {textField("line2", "Area or locality", { autoComplete: "address-line2", maxLength: 120, optional: true })}
          {textField("landmark", "Landmark", { autoComplete: "off", maxLength: 80, optional: true, placeholder: "Near…" })}
          <div className="grid grid-cols-2 gap-3">
            {textField("pincode", "PIN code", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
            {textField("city", "City", { autoComplete: "address-level2", maxLength: 60 })}
          </div>
          <div>
            <label htmlFor="ship-state" className="text-sm font-semibold">
              State or union territory
            </label>
            <select
              id="ship-state"
              name="ship-state"
              autoComplete="address-level1"
              required
              value={address.state}
              aria-invalid={stateError ? true : undefined}
              aria-describedby={stateError ? "ship-state-error" : undefined}
              onChange={(e) => {
                setField("state", e.target.value);
                setTouched((t) => ({ ...t, state: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, state: true }))}
              className={cn(INPUT, "pr-8", stateError ? INPUT_BAD : INPUT_OK, !address.state && "text-kids-ink/65")}
            >
              <option value="">Choose a state</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {stateError && (
              <p id="ship-state-error" role="alert" className="mt-1 text-sm font-medium text-bad">
                {stateError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-kids-ink/10 pt-3" role="status">
          {geofence && delivery && !delivery.serviceable && delivery.message ? (
            <p className="flex items-start gap-2 rounded-[12px] bg-kids-peach/50 px-3 py-2 text-sm font-medium text-kids-ink">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
              <span>
                {delivery.message}
                <span className="block font-normal text-kids-ink/75">
                  {hasProfile ? "Your saved RUXs location is outside our delivery area, so we cannot take this order yet. " : ""}
                  <Link href="/app/account?next=/app/kids/shop/bag" className="font-semibold text-accent underline underline-offset-2">
                    {hasProfile ? "Change saved location" : "Add your location"}
                  </Link>
                </span>
              </span>
            </p>
          ) : shipping?.resolved && fresh ? (
            <div className="flex items-start gap-2 text-sm">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">
                  {shipping.etaMaxDays <= 0 ? "Arrives the day it is sent" : `Arrives in ${shipping.etaLabel}`}
                  <span className="font-normal text-kids-ink/70"> to {shipping.pincode}</span>
                </p>
                <p className="text-kids-ink/70">
                  {quote && quote.deliveryFeePaise === 0 ? "Free delivery" : `Delivery ${formatINR(quote?.deliveryFeePaise ?? shipping.feePaise)}`}
                  {" · "}
                  {quote?.paymentModes.includes("cod") ? "Pay on delivery available" : "Online payment only"}
                </p>
                {quote && quote.settings.dispatchDays > 0 && (
                  <p className="text-kids-ink/70">
                    Shipped by RUXs within {quote.settings.dispatchDays} {quote.settings.dispatchDays === 1 ? "day" : "days"} of your order.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-kids-ink/70">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {pin && checking ? "Checking delivery to your PIN code…" : "Enter your PIN code to see the delivery time and charge."}
            </p>
          )}
        </div>
      </section>

      <section className={PANEL} aria-labelledby="bag-coupon">
        <h2 id="bag-coupon" className="flex items-center gap-2 font-semibold">
          <Tag className="h-4 w-4 text-kids-ink/60" aria-hidden="true" /> Coupon
        </h2>
        {couponCode && coupon?.applied && coupon.code === couponCode ? (
          <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-kids-mint/50 px-3 py-2.5" role="status">
            <Check className="h-4 w-4 shrink-0 text-good" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                <span className="tabular-nums">{coupon.code}</span> applied. You save {formatINR(coupon.discountPaise)}.
              </p>
              {coupon.description && <p className="text-xs text-kids-ink/75">{coupon.description}</p>}
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-semibold text-kids-ink hover:bg-kids-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Remove
            </button>
          </div>
        ) : (
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyCoupon();
            }}
          >
            <label htmlFor="bag-coupon-code" className="sr-only">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="bag-coupon-code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                maxLength={24}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Enter code"
                aria-describedby={couponCode ? "bag-coupon-note" : undefined}
                aria-invalid={couponCode && coupon && !coupon.applied ? true : undefined}
                className={cn(INPUT, "mt-0 min-w-0 flex-1 tabular-nums", couponCode && coupon && !coupon.applied ? INPUT_BAD : INPUT_OK)}
              />
              <button type="submit" disabled={!couponInput.trim() || (!!couponCode && checking)} className={`${kidsSecondaryButton} min-h-12 shrink-0 disabled:opacity-50`}>
                Apply
              </button>
            </div>
            {couponCode && (
              <div id="bag-coupon-note" className="mt-2 flex items-start justify-between gap-3 text-sm">
                {!coupon || coupon.code !== couponCode || checking ? (
                  <p className="text-kids-ink/70" role="status">
                    Checking {couponCode}…
                  </p>
                ) : (
                  <p className="font-medium text-bad" role="alert">
                    {coupon.message ?? "That code cannot be used on this order"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="shrink-0 rounded font-semibold text-kids-ink/75 underline underline-offset-2 hover:text-kids-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kids-ink"
                >
                  Clear
                </button>
              </div>
            )}
          </form>
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
        {quote && quote.settings.codEnabled && !quote.paymentModes.includes("cod") && (
          <p className="mt-2 text-xs text-kids-ink/65">
            {shipping?.resolved && !shipping.codAllowed
              ? "Pay on delivery is not available for this PIN code."
              : quote.settings.codMaxPaise != null
                ? `Pay on delivery is available for orders up to ${formatINR(quote.settings.codMaxPaise)}.`
                : "Pay on delivery is not available for this order."}
          </p>
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
          <dl className={cn("mt-3 space-y-1.5 text-sm transition-opacity", checking && "opacity-60")}>
            <div className="flex justify-between gap-3">
              <dt className="text-kids-ink/70">Items ({quote.itemCount})</dt>
              <dd className="tabular-nums">{formatINR(quote.subtotalPaise)}</dd>
            </div>
            {quote.discountPaise > 0 && (
              <div className="flex justify-between gap-3 font-medium text-good">
                <dt>Coupon{quote.coupon?.applied ? ` ${quote.coupon.code}` : ""}</dt>
                <dd className="tabular-nums">−{formatINR(quote.discountPaise)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-kids-ink/70">Delivery{shipping?.resolved ? "" : " (before PIN code)"}</dt>
              <dd className="tabular-nums">{quote.deliveryFeePaise === 0 ? "Free" : formatINR(quote.deliveryFeePaise)}</dd>
            </div>
            {quote.freeDeliveryGapPaise != null && quote.freeDeliveryGapPaise > 0 && (
              <p className="text-xs text-kids-ink/65">Add {formatINR(quote.freeDeliveryGapPaise)} more for free delivery.</p>
            )}
            <div className="flex justify-between gap-3 border-t border-kids-ink/10 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(quote.totalPaise)}</dd>
            </div>
            <p className="text-xs text-kids-ink/65">Prices include GST.</p>
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
            {busy ? "Placing order…" : checking ? "Checking…" : selected === "online" && quote && quote.totalPaise > 0 ? "Pay and place order" : "Place order"}
          </span>
        </button>
      </div>
    </div>
  );
}
