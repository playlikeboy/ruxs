import { getAdminSettings } from "@/features/admin/queries";
import { AdminsEditor, CategoriesEditor, LocalitiesEditor } from "@/features/admin/components/settings-editors";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { categories, localities, admins } = await getAdminSettings();
  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform settings</h1>
        <p className="mt-1 text-sm text-muted">Everything here lives in Postgres. Changes show in the app right away.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Categories</h2>
        <p className="text-sm text-muted">The service types on the household home screen and in the merchant menu form. Turn one off to hide it.</p>
        <CategoriesEditor rows={categories} />
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Localities ({localities.length})</h2>
        <p className="text-sm text-muted">Neighbourhood centres used to label a household&apos;s location and to place stores without a map pin.</p>
        <LocalitiesEditor rows={localities} />
      </section>
      <section className="max-w-xl space-y-3">
        <h2 className="text-base font-semibold">Admins</h2>
        <AdminsEditor rows={admins} />
      </section>
    </div>
  );
}
