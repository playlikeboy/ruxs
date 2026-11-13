/** Product page skeleton: photo, title, price and details. */
export default function StoreProductLoading() {
  return (
    <div className="animate-pulse space-y-5 motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading product">
      <div className="h-6 w-32 rounded-full bg-kids-ink/[0.06]" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="aspect-square rounded-[20px] bg-kids-ink/[0.06]" />
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-kids-ink/[0.06]" />
          <div className="h-8 w-4/5 rounded bg-kids-ink/[0.06]" />
          <div className="h-4 w-full rounded bg-kids-ink/[0.06]" />
          <div className="h-7 w-32 rounded bg-kids-ink/[0.06]" />
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-kids-ink/[0.06]" />
            <div className="h-6 w-20 rounded-full bg-kids-ink/[0.06]" />
          </div>
        </div>
      </div>
      <div className="h-32 rounded-[20px] bg-kids-ink/[0.06]" />
    </div>
  );
}
