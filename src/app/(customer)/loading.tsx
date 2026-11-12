export default function CustomerLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6" role="status" aria-live="polite">
      <span className="sr-only">Loading your schedule…</span>
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <div className="h-36 rounded-card border border-line bg-surface" />
        <div className="h-12 rounded-control border border-line bg-surface" />
        <div className="space-y-2">
          <div className="h-5 w-36 rounded-control bg-line/60" />
          <div className="h-4 w-56 rounded-control bg-line/40" />
        </div>
        <div className="h-24 rounded-card border border-line bg-surface" />
        <div className="h-24 rounded-card border border-line bg-surface" />
      </div>
    </div>
  );
}
