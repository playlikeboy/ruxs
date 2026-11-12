import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { formatINR } from "@/core/money";
import { todayIST } from "@/core/time";
import { getVendorSubscriptions } from "@/features/subscriptions/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "subscriptions", ["owner", "staff"]);
  const rows = await getVendorSubscriptions(slug);
  const today = todayIST();
  const active = rows.filter((r) => !r.subscription.endsOn || r.subscription.endsOn >= today);
  const ended = rows.filter((r) => r.subscription.endsOn && r.subscription.endsOn < today);
  const monthlyValue = active.reduce(
    (sum, r) => sum + Math.round((r.product.pricePaise * r.subscription.qty * r.subscription.days.length * 30) / 7),
    0
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Subscriptions" description="Every household plan, from the app and from your imports." />
      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">Active</dt>
          <dd className="text-xl font-bold tabular-nums text-ink">{active.length}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">From app</dt>
          <dd className="text-xl font-bold tabular-nums text-ink">{active.filter((r) => r.fromApp).length}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">
            <span aria-hidden="true">≈ / month</span>
            <span className="sr-only">Estimated per month</span>
          </dt>
          <dd className="break-words text-base font-bold tabular-nums text-good">{formatINR(monthlyValue)}</dd>
        </div>
      </dl>

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
              <h2 className="text-sm font-semibold text-muted">{g.title} ({g.list.length})</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {g.list.map((r) => (
                  <li key={r.subscription.id}>
                    <Link href={`/merchant-panel/${slug}/customers/${r.customerId}`} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-bg focus-visible:bg-bg">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-ink">
                          <span className="truncate">{r.customerName}</span>
                          {r.fromApp && <Badge tone="accent" className="shrink-0">App</Badge>}
                        </p>
                        <p className="truncate text-xs text-muted">{r.flat}, {r.tower !== "-" ? r.tower + ", " : ""}{r.society}</p>
                        <p className="mt-1 text-xs text-ink">
                          {r.subscription.qty} × {r.product.name} · <span className="uppercase text-muted">{r.subscription.days.length === 7 ? "daily" : r.subscription.days.join(" ")}</span>
                        </p>
                        <p className="text-xs text-muted">
                          from {r.subscription.startsOn}{r.subscription.endsOn ? ` to ${r.subscription.endsOn}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{formatINR(r.product.pricePaise * r.subscription.qty)}</span>
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
