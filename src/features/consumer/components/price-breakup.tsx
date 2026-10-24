import { formatINR } from "@/core/money";
import { percentLabel, type PriceBreakup } from "@/core/pricing";

/**
 * The bill, line by line: listed price, store discount, GST (added or included),
 * delivery and the total. The RUXs fee row is information only: the store pays it.
 */
export function PriceBreakupList({
  breakup,
  gstBps,
  gstIncluded,
  discountBps,
  showFee = false,
  totalLabel = "To pay",
}: {
  breakup: PriceBreakup;
  gstBps: number;
  gstIncluded: boolean;
  discountBps?: number;
  showFee?: boolean;
  totalLabel?: string;
}) {
  const row = "flex justify-between gap-4 text-neutral-600";
  return (
    <dl className="space-y-2 text-sm">
      <div className={row}>
        <dt>Item total</dt>
        <dd className="tabular-nums">{formatINR(breakup.itemsPaise)}</dd>
      </div>
      {breakup.discountPaise > 0 && (
        <div className={row}>
          <dt>Store discount{discountBps ? ` (${percentLabel(discountBps)})` : ""}</dt>
          <dd className="tabular-nums text-good">−{formatINR(breakup.discountPaise)}</dd>
        </div>
      )}
      {breakup.gstPaise > 0 && (
        <div className={row}>
          <dt>
            GST {gstBps ? percentLabel(gstBps) : ""}
            {gstIncluded && <span className="text-neutral-500"> (included in prices)</span>}
          </dt>
          <dd className="tabular-nums">{gstIncluded ? formatINR(breakup.gstPaise) : `+${formatINR(breakup.gstPaise)}`}</dd>
        </div>
      )}
      <div className={row}>
        <dt>Delivery fee</dt>
        <dd className="tabular-nums">{breakup.deliveryFeePaise === 0 ? "Free" : formatINR(breakup.deliveryFeePaise)}</dd>
      </div>
      <div className="flex justify-between border-t border-dashed border-black/10 pt-2 text-[15px] font-semibold text-ink">
        <dt>{totalLabel}</dt>
        <dd className="tabular-nums">{formatINR(breakup.totalPaise)}</dd>
      </div>
      {showFee && breakup.commissionPaise > 0 && (
        <p className="pt-1 text-xs text-neutral-500">
          Includes a RUXs fee of {formatINR(breakup.commissionPaise)}, paid by the store. You don&apos;t pay extra.
        </p>
      )}
    </dl>
  );
}
