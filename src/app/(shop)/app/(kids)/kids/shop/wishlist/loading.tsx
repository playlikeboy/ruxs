/** Wishlist skeleton: heading and a two-column product grid. */
export default function StoreWishlistLoading() {
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading your wishlist">
      <div className="h-8 w-1/2 rounded-full bg-kids-ink/[0.06]" />
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
