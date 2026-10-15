import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { formatINR } from "@/core/money";
import { isLate } from "@/core/cutoff";
import { addDaysIST, istDateTime, weekdayIST } from "@/core/time";
import { getMyPlans } from "@/features/consumer/queries";
import { getCategoryMap } from "@/features/platform/queries";
import { PayDuesButton } from "@/features/payments/components/pay-buttons";
import { PageHeader } from "@/features/consumer/components/page-header";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { EndPlanButton, PlanDays, type PlanDay } from "@/features/consumer/components/plan-days";

export const metadata = { title: "Plans" };

const dayNumFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });

export default async function PlansPage() {
  const [{ today, plans }, category] = await Promise.all([getMyPlans(), getCategoryMap()]);
  const now = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => addDaysIST(today, i));

  // One "pay balance" button per store, not per plan.
  const balances = new Map<string, { vendorId: string; name: string; balancePaise: number }>();
  for (const p of plans) balances.set(p.vendorId, { vendorId: p.vendorId, name: p.vendorName, balancePaise: p.balancePaise });

  return (
    <div className="min-h-dvh bg-neutral-50">
      <PageHeader title="Your plans" subtitle="Tap a day to skip it or bring it back" />
      {plans.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mint">
            <CalendarCheck className="h-9 w-9 text-good" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">No plans yet</h2>
          <p className="mt-1.5 max-w-xs text-sm text-neutral-500">Subscribe to a daily tiffin or water can and manage every delivery from here.</p>
          <Link href="/app" className="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-white">Find a plan</Link>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {plans.map((p) => {
            const days: PlanDay[] = dates.map((date) => {
              const weekday = weekdayIST(date);
              const scheduled =
                p.sub.days.includes(weekday) && date >= p.sub.startsOn && (!p.sub.endsOn || date <= p.sub.endsOn);
              const change = p.changes.find((c) => c.serviceDate === date);
              return {
                date,
                weekday: weekday.slice(0, 3),
                dayNum: dayNumFmt.format(istDateTime(date, "12:00")),
                scheduled,
                skipped: change?.kind === "skip",
                locked: isLate(now, date, p.product.cutoffAt) && (p.product.lateRule === "locked" || change?.kind === "skip"),
              };
            });
            return (
              <section key={p.sub.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <StoreCover cover={category(p.product.kind)} imageUrl={p.product.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl" emojiClass="text-3xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-ink">{p.product.name}</h2>
                    <p className="truncate text-sm text-neutral-500">
                      <Link href={`/app/store/${p.vendorSlug}`} className="hover:underline">{p.vendorName}</Link> · {p.sub.qty} × {formatINR(p.product.pricePaise)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <PlanDays subscriptionId={p.sub.id} days={days} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {p.sub.startsOn > today ? `Starts ${p.sub.startsOn}` : "Active"}
                    {p.sub.endsOn ? ` · ends ${p.sub.endsOn}` : ""} · change by {p.product.cutoffAt}
                  </span>
                  {!p.sub.endsOn && <EndPlanButton subscriptionId={p.sub.id} />}
                </div>
              </section>
            );
          })}

          {Array.from(balances.values())
            .filter((b) => b.balancePaise > 0)
            .map((b) => (
              <section key={b.name} className="flex items-center justify-between rounded-2xl bg-ink p-4 text-white">
                <div>
                  <p className="text-xs opacity-80">Due to {b.name}</p>
                  <p className="text-xl font-bold tabular-nums">{formatINR(b.balancePaise)}</p>
                </div>
                <PayDuesButton vendorId={b.vendorId} label="Pay online" />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
