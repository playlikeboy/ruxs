export default function AdminStoreLoading() {
  return (
    <div className="space-y-4 p-4 sm:p-6" role="status" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-control bg-line motion-reduce:animate-none" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-control bg-line/70 motion-reduce:animate-none" />
      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-[10px] bg-line/70 motion-reduce:animate-none" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
