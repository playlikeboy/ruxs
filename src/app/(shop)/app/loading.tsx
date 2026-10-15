export default function ConsumerLoading() {
  return (
    <div className="animate-pulse space-y-6 px-4 pt-6" aria-busy="true" aria-label="Loading">
      <div className="h-12 rounded-full bg-neutral-100" />
      <div className="flex gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-14 rounded-2xl bg-neutral-100" />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[16/10] rounded-2xl bg-neutral-100" />
          <div className="h-4 w-2/3 rounded bg-neutral-100" />
          <div className="h-3 w-1/3 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
