import { RuxsDashboardSkeleton } from "@/components/ui/LoadingState";

export default function PortalLoading() {
  return (
    <div className="py-6">
      <RuxsDashboardSkeleton />
    </div>
  );
}
