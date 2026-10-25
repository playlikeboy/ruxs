import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { paiseToRupees } from "@/core/money";
import { KidsWorkshopForm, type KidsWorkshopValues } from "@/features/kids/components/kids-workshop-form";
import { istLocalInput, loadKidsWorkspace } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "Edit workshop · Merchant Panel" };

export default async function EditKidsWorkshopPage({ params }: { params: Promise<{ vendor: string; id: string }> }) {
  const { vendor: slug, id } = await params;
  const w = await loadKidsWorkspace(slug);
  const found = w.workshops.find((x) => x.workshop.id === id);
  if (!found) notFound();
  const ws = found.workshop;
  const initial: KidsWorkshopValues = {
    id: ws.id,
    title: ws.title,
    categoryId: ws.categoryId,
    description: ws.description ?? "",
    minAge: ws.minAge,
    maxAge: ws.maxAge,
    startDate: ws.startDate,
    endDate: ws.endDate,
    enrollmentDeadline: istLocalInput(new Date(ws.enrollmentDeadline)),
    venueOrMode: ws.venueOrMode,
    address: ws.address ?? "",
    capacity: ws.capacity,
    priceRupees: paiseToRupees(ws.pricePaise),
    eligibleClasses: ws.eligibleClasses,
  };
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <Link href={`/merchant-panel/${slug}/kids/workshops`} className="text-sm font-semibold text-muted hover:text-ink">← Workshops</Link>
      <PageHeader title={ws.title} description="Changes show to parents straight away." />
      <KidsWorkshopForm slug={slug} categories={w.categories} initial={initial} />
    </div>
  );
}
