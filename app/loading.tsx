import { RuxsPageLoading } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <RuxsPageLoading
      badge="RUXS • Operating Layer"
      title="Handling recurring life, quietly"
      description="Coordinating households, local kitchens, and daily doorstep delivery runs…"
      fullPage={true}
    />
  );
}
