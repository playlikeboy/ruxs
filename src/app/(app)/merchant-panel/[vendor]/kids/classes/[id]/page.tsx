import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { paiseToRupees } from "@/core/money";
import { KidsClassForm, type KidsClassValues } from "@/features/kids/components/kids-class-form";
import { loadKidsWorkspace } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "Edit class · Merchant Panel" };

export default async function EditKidsClassPage({ params }: { params: Promise<{ vendor: string; id: string }> }) {
  const { vendor: slug, id } = await params;
  const w = await loadKidsWorkspace(slug);
  const found = w.services.find((s) => s.service.id === id);
  if (!found) notFound();
  const s = found.service;
  const initial: KidsClassValues = {
    id: s.id,
    title: s.title,
    categoryId: s.categoryId,
    description: s.description ?? "",
    minAge: s.minAge,
    maxAge: s.maxAge,
    durationMinutes: s.durationMinutes,
    priceRupees: paiseToRupees(s.pricePaise),
    deliveryModes: s.deliveryModes,
    materialFeePolicy: (["included", "extra", "required"] as const).find((p) => p === s.materialFeePolicy) ?? "included",
    materialFeeRupees: paiseToRupees(s.materialFeePaise),
    suitableClasses: s.suitableClasses,
  };
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <Link href={`/merchant-panel/${slug}/kids`} className="text-sm font-semibold text-muted hover:text-ink">← Classes</Link>
      <PageHeader title={s.title} description="Changes show to parents straight away." />
      <KidsClassForm slug={slug} categories={w.categories} initial={initial} />
    </div>
  );
}
