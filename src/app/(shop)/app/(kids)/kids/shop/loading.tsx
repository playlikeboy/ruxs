/** Shown while store pages load: chips, age filter and a two-column grid. */
export default function StoreLoading() {
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading the store">
      <div className="h-8 w-2/3 rounded-full bg-kids-ink/[0.06]" />
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 shrink-0 rounded-full bg-kids-ink/[0.06]" />
        ))}
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-16 rounded-full bg-kids-ink/[0.06]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-[16px] border border-kids-ink/10 bg-white">
            <div className="aspect-square bg-kids-ink/[0.06]" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-1/3 rounded bg-kids-ink/[0.06]" />
              <div className="h-4 w-4/5 rounded bg-kids-ink/[0.06]" />
              <div className="h-4 w-1/2 rounded bg-kids-ink/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
