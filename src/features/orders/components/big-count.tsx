import { CutoffTimer } from "./cutoff-timer";

interface BigCountProps {
  product: {
    id: string;
    name: string;
    shift: string;
    cutoffAt: string;
    pricePaise: number;
  };
  confirmedQty: number;
  deliveredCount?: number;
  skippedCount?: number;
}

/** One kitchen count: how many to cook or load for a product today, with delivery progress. */
export function BigCount({ product, confirmedQty, deliveredCount = 0, skippedCount = 0 }: BigCountProps) {
  const pct = confirmedQty > 0 ? Math.min(100, Math.round((deliveredCount / confirmedQty) * 100)) : 0;
  return (
    <div className="flex flex-col rounded-[16px] border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-tight text-ink">{product.name}</h3>
          <p className="mt-0.5 text-xs capitalize text-muted">{product.shift}</p>
        </div>
        <CutoffTimer cutoffAt={product.cutoffAt} shift={product.shift} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">To prepare</p>
          <p className="font-mono text-5xl font-bold leading-none tracking-tight text-ink tabular-nums">{confirmedQty}</p>
        </div>
        <dl className="text-right text-xs">
          <div className="flex justify-end gap-2"><dt className="text-muted">Delivered</dt><dd className="w-6 font-semibold text-good tabular-nums">{deliveredCount}</dd></div>
          <div className="flex justify-end gap-2"><dt className="text-muted">Skipped</dt><dd className="w-6 font-semibold text-muted tabular-nums">{skippedCount}</dd></div>
        </dl>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Delivered">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
