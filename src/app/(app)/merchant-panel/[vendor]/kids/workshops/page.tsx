import type { Metadata } from "next";
import { KidsWorkspace } from "@/features/kids/components/kids-workspace";
import { KidsWorkshopList } from "@/features/kids/components/kids-listings";
import { loadKidsWorkspace } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "Workshops · Merchant Panel" };

export default async function KidsWorkshopsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const w = await loadKidsWorkspace(slug);
  return (
    <KidsWorkspace slug={slug} active="workshops" counts={w.counts} pendingReview={w.pendingReview}>
      <KidsWorkshopList slug={slug} workshops={w.workshops} />
    </KidsWorkspace>
  );
}
