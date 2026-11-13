import { formatINR } from "@/core/money";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "Asia/Kolkata" };
/** "2026-11-13" is an IST calendar day; noon IST keeps it on that day in any formatter. */
const dayLabel = (date: string) => new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", DAY);

/** A round number at or above the largest bar, so the scale label reads cleanly (₹2,000, not ₹1,873). */
function niceCeil(paise: number): number {
  if (paise <= 0) return 0;
  const rupees = paise / 100;
  const pow = 10 ** Math.floor(Math.log10(rupees));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= rupees) ?? 10;
  return Math.round(step * pow * 100);
}

/**
 * Booked sales per day as plain CSS bars. The bars are decoration for sighted
 * users; the same numbers sit in a table for screen readers and for anyone who
 * opens "Show the numbers".
 */
export function RevenueChart({ days }: { days: { date: string; orders: number; revenuePaise: number }[] }) {
  const max = niceCeil(Math.max(0, ...days.map((d) => d.revenuePaise)));
  const best = days.reduce<(typeof days)[number] | null>((b, d) => (d.revenuePaise > (b?.revenuePaise ?? 0) ? d : b), null);
  const first = days[0];
  const last = days.at(-1);
  const mid = days[Math.floor(days.length / 2)];

  if (!first || !last || max === 0) {
    return <p className="px-4 py-8 text-sm text-muted">No sales in the last 30 days. Bars appear here once the first order is placed.</p>;
  }

  return (
    <figure className="px-4 pb-4 pt-3">
      <figcaption className="text-sm text-muted">
        {best ? (
          <>
            Best day: <span className="font-semibold text-ink">{dayLabel(best.date)}</span>,{" "}
            <span className="font-semibold tabular-nums text-ink">{formatINR(best.revenuePaise)}</span> from{" "}
            <span className="tabular-nums">{best.orders}</span> {best.orders === 1 ? "order" : "orders"}.
          </>
        ) : null}
      </figcaption>

      <div className="mt-4" aria-hidden="true">
        <div className="relative h-40 border-b border-line">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <span className="absolute -top-2 left-0 bg-surface pr-1.5 text-xs tabular-nums text-muted">{formatINR(max)}</span>
          <div className="absolute inset-0 flex items-end gap-px sm:gap-1">
            {days.map((d) => (
              <div key={d.date} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${dayLabel(d.date)}: ${formatINR(d.revenuePaise)}, ${d.orders} ${d.orders === 1 ? "order" : "orders"}`}>
                <div
                  className={"w-full rounded-t-[3px] transition-colors " + (d.revenuePaise > 0 ? "bg-brand-deep group-hover:bg-accent" : "bg-line")}
                  style={{ height: d.revenuePaise > 0 ? `${Math.max(2, (d.revenuePaise / max) * 100)}%` : "2px" }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted">
          <span>{dayLabel(first.date)}</span>
          {mid && <span>{dayLabel(mid.date)}</span>}
          <span>{dayLabel(last.date)}</span>
        </div>
      </div>

      <details className="mt-3">
        <summary className="inline-flex min-h-9 cursor-pointer items-center rounded-control text-xs font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Show the numbers
        </summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-control border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Booked sales per day, last 30 days, India time</caption>
            <thead className="sticky top-0 bg-bg text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Orders</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <th scope="row" className="px-3 py-1.5 font-normal text-ink">{dayLabel(d.date)}</th>
                  <td className="px-3 py-1.5 text-right tabular-nums text-ink">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-ink">{formatINR(d.revenuePaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** One horizontal bar with its label and value, for short ranked lists (status counts, payment split). */
export function ShareBar({ label, value, share, tone = "deep" }: { label: React.ReactNode; value: React.ReactNode; share: number; tone?: "deep" | "accent" | "muted" }) {
  const fill = tone === "accent" ? "bg-accent" : tone === "muted" ? "bg-muted/50" : "bg-brand-deep";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-ink">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.min(100, Math.max(0, share * 100))}%` }} />
      </div>
    </div>
  );
}
