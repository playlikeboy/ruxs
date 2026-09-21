import { RuxsPageLoading } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white/40">
      <RuxsPageLoading
        badge="RUXS"
        title="Loading workspace…"
        description="Preparing your daily routines and live society ledger."
        fullPage={true}
      />
    </div>
  );
}
