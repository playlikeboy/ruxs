import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewVendorScreen } from "@/features/admin/components/new-vendor-screen";
import { getOnboardCategories } from "@/features/admin/queries";
import { getApplication } from "@/features/applications/queries";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const chosen = (await getOnboardCategories()).find((c) => c.id === type);
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
  if (!categories.some((c) => c.id === type)) notFound();
  const app = applicationId && /^[0-9a-f-]{36}$/.test(applicationId) ? await getApplication(applicationId) : null;
  return <NewVendorScreen categories={categories} categoryId={type} app={app} />;
}
