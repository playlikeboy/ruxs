export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4 p-4 motion-safe:animate-pulse sm:p-6">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 rounded-control bg-line/60" aria-hidden="true" />
      <div className="h-4 w-64 rounded-control bg-line/40" aria-hidden="true" />

      <div className="space-y-3 pt-2" aria-hidden="true">
        <div className="h-40 rounded-card border border-line bg-surface" />
        <div className="h-28 rounded-card border border-line bg-surface" />
        <div className="h-28 rounded-card border border-line bg-surface" />
      </div>
    </div>
  );
}
