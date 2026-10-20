import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminKidsConsoleData } from "@/features/kids/queries";
import { AdminKidsConsoleManager } from "@/features/kids/components/admin-kids-console-manager";

export const metadata: Metadata = {
  title: "Kids Zone Safety Console · Admin",
  description: "Review and audit kids activity providers, safety reviews, passes and moderation.",
};

export default async function AdminKidsConsolePage() {
  await requireAdmin();
  const data = await getAdminKidsConsoleData();

  return (
    <div>
      <AdminKidsConsoleManager
        providers={data.providers}
        passes={data.passes}
        reviews={data.reviews}
      />
    </div>
  );
}
