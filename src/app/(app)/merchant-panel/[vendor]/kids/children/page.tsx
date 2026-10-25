import type { Metadata } from "next";
import { KidsWorkspace } from "@/features/kids/components/kids-workspace";
import { KidsChildrenList } from "@/features/kids/components/kids-listings";
import { loadKidsWorkspace } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "Children · Merchant Panel" };

export default async function KidsChildrenPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const w = await loadKidsWorkspace(slug);
  return (
    <KidsWorkspace slug={slug} active="children" counts={w.counts} pendingReview={w.pendingReview}>
      <KidsChildrenList slug={slug} bookings={w.bookings} enrollments={w.enrollments} />
    </KidsWorkspace>
  );
}
