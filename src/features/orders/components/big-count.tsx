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

export function BigCount({
  product,
  confirmedQty,
  deliveredCount = 0,
  skippedCount = 0,
}: BigCountProps) {
  return (
    <div className="bg-surface border border-line rounded-[12px] p-5 space-y-3 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink leading-tight">
            {product.name}
          </h2>
          <span className="text-xs text-muted capitalize">
            {product.shift} shift
          </span>
        </div>
        <CutoffTimer cutoffAt={product.cutoffAt} shift={product.shift} />
      </div>

      <div className="pt-2 pb-1">
        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-0.5">
          Kitchen Count
        </div>
        <div className="text-5xl font-bold font-mono tracking-tight text-ink tabular-nums">
          {confirmedQty}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line text-xs">
        <div className="flex items-center justify-between p-2 bg-[#FAFAF7] rounded-[8px]">
          <span className="text-muted">Delivered</span>
          <span className="font-semibold text-good tabular-nums">
            {deliveredCount}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-[#FAFAF7] rounded-[8px]">
          <span className="text-muted">Skipped</span>
          <span className="font-semibold text-muted tabular-nums">
            {skippedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
