import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/card";
import { KidsWorkshopForm } from "@/features/kids/components/kids-workshop-form";
import { loadKidsWorkspace, newWorkshopValues } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "New workshop · Merchant Panel" };

export default async function NewKidsWorkshopPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const w = await loadKidsWorkspace(slug);
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <Link href={`/merchant-panel/${slug}/kids/workshops`} className="text-sm font-semibold text-muted hover:text-ink">← Workshops</Link>
      <PageHeader title="New workshop" description="A camp on fixed dates with limited seats." />
      <KidsWorkshopForm slug={slug} categories={w.categories} initial={newWorkshopValues(w.defaultCategoryId)} />
    </div>
  );
}
