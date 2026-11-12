/** Store orders skeleton: list rows (also covers the order detail page). */
export default function StoreOrdersLoading() {
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading orders">
      <div className="h-8 w-1/2 rounded-full bg-kids-ink/[0.06]" />
      <div className="divide-y divide-kids-ink/10 overflow-hidden rounded-[20px] border border-kids-ink/10 bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3.5">
            <div className="h-14 w-14 shrink-0 rounded-[12px] bg-kids-ink/[0.06]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-full bg-kids-ink/[0.06]" />
              <div className="h-4 w-3/4 rounded bg-kids-ink/[0.06]" />
              <div className="h-3 w-1/2 rounded bg-kids-ink/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
