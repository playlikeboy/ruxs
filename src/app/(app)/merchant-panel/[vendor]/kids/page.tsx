import type { Metadata } from "next";
import { KidsWorkspace } from "@/features/kids/components/kids-workspace";
import { KidsClassList } from "@/features/kids/components/kids-listings";
import { loadKidsWorkspace } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "Classes · Merchant Panel" };

export default async function KidsClassesPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const w = await loadKidsWorkspace(slug);
  return (
    <KidsWorkspace slug={slug} active="classes" counts={w.counts} pendingReview={w.pendingReview}>
      <KidsClassList slug={slug} services={w.services} />
    </KidsWorkspace>
  );
}
