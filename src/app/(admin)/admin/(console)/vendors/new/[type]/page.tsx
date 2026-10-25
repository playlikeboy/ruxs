import type { Metadata } from "next";
import { NewVendorScreen } from "@/features/admin/components/new-vendor-screen";
import { getOnboardCategories, type OnboardCategoryRow } from "@/features/admin/queries";
import { getApplication } from "@/features/applications/queries";

/** Accepts a category id (/new/kids_stem, /new/other) or a vendor type (/new/store opens its first category). */
function resolve(categories: OnboardCategoryRow[], type: string) {
  return categories.find((c) => c.id === type) ?? categories.find((c) => c.vendorType === type);
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const chosen = resolve(await getOnboardCategories(), type);
  return { title: chosen ? `New vendor · ${chosen.label}` : "New vendor" };
}

export default async function NewVendorOfTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ application?: string }>;
}) {
  const [{ type }, { application: applicationId }] = await Promise.all([params, searchParams]);
  const categories = await getOnboardCategories();
  const chosen = resolve(categories, type);
  const app = applicationId && /^[0-9a-f-]{36}$/.test(applicationId) ? await getApplication(applicationId) : null;
  // Unknown type: show the picker with a note rather than a dead end.
  return <NewVendorScreen categories={categories} categoryId={chosen?.id} unknownType={chosen ? undefined : type} app={app} />;
}
