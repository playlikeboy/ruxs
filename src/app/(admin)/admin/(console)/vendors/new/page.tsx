import { redirect } from "next/navigation";
import { NewVendorScreen } from "@/features/admin/components/new-vendor-screen";
import { getOnboardCategories } from "@/features/admin/queries";
import { getApplication } from "@/features/applications/queries";

export const metadata = { title: "New vendor" };

export default async function NewVendorPage({ searchParams }: { searchParams: Promise<{ application?: string }> }) {
  const { application: applicationId } = await searchParams;
  const app = applicationId && /^[0-9a-f-]{36}$/.test(applicationId) ? await getApplication(applicationId) : null;
  const categories = await getOnboardCategories();
  // An application already says what the business is: go straight to that type's form.
  if (app && categories.some((c) => c.id === app.categoryId)) redirect(`/admin/vendors/new/${app.categoryId}?application=${app.id}`);
  return <NewVendorScreen categories={categories} app={app} />;
}
