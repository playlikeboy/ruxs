"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Home, MapPin, Video, Wallet } from "lucide-react";
import { formatINR } from "@/core/money";
import { bookSession } from "@/features/bookings/actions";
import { startOrderPayment } from "@/features/payments/actions";
import { useRazorpay } from "@/features/payments/components/use-razorpay";

const MODE_META: Record<string, { label: string; Icon: typeof Home }> = {
  home: { label: "Home visit", Icon: Home },
  studio: { label: "At gym / clinic", Icon: MapPin },
  online: { label: "Online", Icon: Video },
};

const dayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });
const numFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });
const monFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

export function BookingPicker({
  productId,
  pricePaise,
  modes,
  calendar,
  hasProfile,
  onlineEnabled,
  studioAddress,
}: {
  productId: string;
  pricePaise: number;
  modes: string[];
  calendar: { date: string; slots: string[] }[];
  hasProfile: boolean;
  onlineEnabled: boolean;
  studioAddress: string;
}) {
  const router = useRouter();
  const firstOpen = calendar.find((d) => d.slots.length > 0)?.date ?? calendar[0]?.date ?? "";
  const [date, setDate] = useState(firstOpen);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState(modes[0] ?? "home");
  const [paymentMode, setPaymentMode] = useState<"online" | "cod">(onlineEnabled ? "online" : "cod");
  const [notes, setNotes] = useState("");
  const [clientKey] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();
  const { pay, busy } = useRazorpay();
  const day = useMemo(() => calendar.find((d) => d.date === date), [calendar, date]);

  const groups = useMemo(() => {
    const out: { label: string; slots: string[] }[] = [
      { label: "Morning", slots: [] },
      { label: "Afternoon", slots: [] },
      { label: "Evening", slots: [] },
    ];
    for (const s of day?.slots ?? []) {
      const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(s)));
      out[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(s);
    }
    return out.filter((g) => g.slots.length > 0);
  }, [day]);

  function submit() {
    if (!slot) return;
    if (!hasProfile) {
      router.push(`/app/account?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const res = await bookSession({ clientKey, productId, startsAt: slot, mode, paymentMode, notes: notes || undefined });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
        return;
      }
      if (paymentMode === "online") {
        const start = await startOrderPayment({ orderId: res.orderId });
        if (start.ok) {
          const outcome = await pay(start.checkout);
          if (outcome.status === "paid") toast.success("Session booked and paid");
          else if (outcome.status === "failed") toast.error(outcome.error);
          else toast("Slot held for 15 minutes. Pay from the order page to confirm.");
        } else toast.error(start.error);
      } else {
        toast.success("Session booked");
      }
      router.push(`/app/orders/${res.orderId}`);
    });
  }

  return (
    <div className="space-y-6 pb-40">
      <section>
        <h2 className="text-[15px] font-semibold text-ink">Pick a day</h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {calendar.map((d) => {
            const at = new Date(d.date + "T12:00:00+05:30");
            const active = d.date === date;
            const none = d.slots.length === 0;
            return (
              <button
                key={d.date}
                type="button"
                disabled={none}
                onClick={() => {
                  setDate(d.date);
                  setSlot(null);
                }}
                aria-pressed={active}
                className={
                  "flex w-[62px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition " +
                  (active ? "border-ink bg-ink text-white" : none ? "border-dashed border-black/10 text-neutral-300" : "border-black/10 text-ink")
                }
              >
                <span className="text-[11px] font-semibold uppercase">{dayFmt.format(at)}</span>
                <span className="text-lg font-bold tabular-nums">{numFmt.format(at)}</span>
                <span className="text-[10px]">{none ? "Full" : monFmt.format(at)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Pick a time</h2>
        {groups.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">No free times this day. Try another day.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{g.label}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {g.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    aria-pressed={slot === s}
                    className={"h-11 rounded-xl border text-sm font-semibold tabular-nums transition " + (slot === s ? "border-accent bg-peach text-accent" : "border-black/10 text-ink")}
                  >
                    {timeFmt.format(new Date(s)).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {modes.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Where</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {modes.map((m) => {
              const meta = MODE_META[m] ?? MODE_META.home!;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={"flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition " + (mode === m ? "border-ink" : "border-black/10")}
                >
                  <meta.Icon className="h-5 w-5 text-neutral-600" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-ink">{meta.label}</span>
                    <span className="block text-xs text-neutral-500">{m === "home" ? "They come to your address" : m === "studio" ? studioAddress : "Video call link from the provider"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Payment</h2>
        <div className="mt-3 space-y-2">
          {[
            ...(onlineEnabled ? [{ id: "online" as const, title: "Pay online now", text: "UPI, cards · secured by Razorpay", Icon: CreditCard }] : []),
            { id: "cod" as const, title: "Pay at the session", text: "Cash or UPI to the provider", Icon: Wallet },
          ].map(({ id, title, text, Icon }) => (
            <label key={id} className={"flex cursor-pointer items-center gap-3 rounded-xl border p-3 " + (paymentMode === id ? "border-ink" : "border-black/10")}>
              <input type="radio" name="pay" className="sr-only" checked={paymentMode === id} onChange={() => setPaymentMode(id)} />
              <Icon className="h-5 w-5 text-neutral-600" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-neutral-500">{text}</span>
              </span>
            </label>
          ))}
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={300}
          placeholder="Goals or health notes for the provider (optional)"
          className="mt-3 h-11 w-full rounded-xl bg-neutral-100 px-3.5 text-sm text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md border-t border-black/5 bg-white px-4 py-3">
        <button
          type="button"
          disabled={!slot || pending || busy}
          onClick={submit}
          className="flex h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 text-white shadow-[0_10px_30px_rgba(189,75,42,0.3)] transition active:scale-[0.98] disabled:opacity-50"
        >
          <span className="text-left leading-tight">
            <span className="block text-[15px] font-bold tabular-nums">{formatINR(pricePaise)}</span>
            <span className="block text-[11px] opacity-90">{slot ? timeFmt.format(new Date(slot)).toLowerCase() : "Pick a time"}</span>
          </span>
          <span className="text-[15px] font-bold">{pending || busy ? "Booking…" : hasProfile ? "Book session →" : "Add address to book"}</span>
        </button>
      </div>
    </div>
  );
}
