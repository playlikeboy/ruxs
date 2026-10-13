export default function CustomerLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-line/60 rounded-[8px] w-36" />
      <div className="h-4 bg-line/40 rounded-[6px] w-48" />

      <div className="space-y-3 pt-2">
        <div className="h-36 bg-surface border border-line rounded-[12px]" />
        <div className="h-12 bg-surface border border-line rounded-[10px]" />
        <div className="h-24 bg-surface border border-line rounded-[12px]" />
        <div className="h-24 bg-surface border border-line rounded-[12px]" />
      </div>
    </div>
  );
}
