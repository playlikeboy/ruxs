import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import { getVendorSubscriptions } from "@/features/subscriptions/queries";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  // Booking providers have sessions, not deliveries.
  await requireVendorModule(slug, "subscriptions");
  const rows = await getVendorSubscriptions(slug);
  const today = todayIST();
  const active = rows.filter((r) => !r.subscription.endsOn || r.subscription.endsOn >= today);
  const ended = rows.filter((r) => r.subscription.endsOn && r.subscription.endsOn < today);
  const monthlyValue = active.reduce(
    (sum, r) => sum + Math.round((r.product.pricePaise * r.subscription.qty * r.subscription.days.length * 30) / 7),
    0
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Subscriptions</h1>
        <p className="mt-0.5 text-sm text-muted">Every household plan, from the app and from your imports.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[12px] border border-line bg-surface p-3">
          <p className="text-[11px] text-muted">Active</p>
          <p className="font-mono text-xl font-bold tabular-nums text-ink">{active.length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-3">
          <p className="text-[11px] text-muted">From app</p>
          <p className="font-mono text-xl font-bold tabular-nums text-accent">{active.filter((r) => r.fromApp).length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-3">
          <p className="text-[11px] text-muted">≈ / month</p>
          <p className="font-mono text-base font-bold tabular-nums text-good">{formatINR(monthlyValue)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No subscriptions yet" description="Households subscribe from your RUXs store page, or add them under Customers." />
      ) : (
        [
          { title: "Active", list: active },
          { title: "Ended", list: ended },
        ]
          .filter((g) => g.list.length > 0)
          .map((g) => (
            <section key={g.title} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{g.title} ({g.list.length})</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
                {g.list.map((r) => (
                  <li key={r.subscription.id}>
                    <Link href={`/merchant-panel/${slug}/customers/${r.customerId}`} className="flex items-center justify-between gap-3 p-4 hover:bg-bg">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-ink">
                          <span className="truncate">{r.customerName}</span>
                          {r.fromApp && <span className="rounded-full bg-peach px-2 py-0.5 text-[10px] font-semibold text-accent">App</span>}
                        </p>
                        <p className="truncate text-xs text-muted">{r.flat}, {r.tower !== "-" ? r.tower + ", " : ""}{r.society}</p>
                        <p className="mt-1 text-xs text-ink">
                          {r.subscription.qty} × {r.product.name} · <span className="uppercase text-muted">{r.subscription.days.length === 7 ? "daily" : r.subscription.days.join(" ")}</span>
                        </p>
                        <p className="text-[11px] text-muted">
                          from {r.subscription.startsOn}{r.subscription.endsOn ? ` to ${r.subscription.endsOn}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-ink">{formatINR(r.product.pricePaise * r.subscription.qty)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
