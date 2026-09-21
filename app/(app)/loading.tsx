import { RuxsPageLoading } from "@/components/ui/LoadingState";

export default function AppLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <RuxsPageLoading
        badge="RUXS"
        title="Loading…"
        fullPage={false}
      />
    </div>
  );
}

