import { RuxsPageLoading } from "@/components/ui/LoadingState";

export default function AdminLoading() {
  return (
    <RuxsPageLoading
      badge="Platform Admin Mission Control"
      title="Accessing RUXS Core Infrastructure"
      description="Connecting to Neon database, reconciling ledger transactions, and verifying tenant status…"
      fullPage={true}
    />
  );
}
