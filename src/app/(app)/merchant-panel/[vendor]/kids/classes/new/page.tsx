import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/card";
import { KidsClassForm } from "@/features/kids/components/kids-class-form";
import { loadKidsWorkspace, newClassValues } from "@/features/kids/workspace-page";

export const metadata: Metadata = { title: "New class · Merchant Panel" };

export default async function NewKidsClassPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const w = await loadKidsWorkspace(slug);
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <Link href={`/merchant-panel/${slug}/kids`} className="text-sm font-semibold text-muted hover:text-ink">← Classes</Link>
      <PageHeader title="New class" description="A session parents book for one child at a time." />
      <KidsClassForm slug={slug} categories={w.categories} initial={newClassValues(w.defaultCategoryId)} />
    </div>
  );
}
