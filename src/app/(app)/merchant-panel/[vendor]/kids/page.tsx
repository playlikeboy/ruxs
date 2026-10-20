import type { Metadata } from "next";
import { getProviderKidsWorkspace, getKidsCategories } from "@/features/kids/queries";
import { ProviderKidsManager } from "@/features/kids/components/provider-kids-manager";

export const metadata: Metadata = {
  title: "Kids Zone Workspace · Merchant Panel",
  description: "Manage kids classes, workshops, enrollments, and view child safety notes.",
};

export default async function ProviderKidsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const [workspace, categories] = await Promise.all([
    getProviderKidsWorkspace(slug),
    getKidsCategories(),
  ]);

  return (
    <div>
      <ProviderKidsManager
        slug={slug}
        profile={workspace.profile}
        services={workspace.services}
        workshops={workspace.workshops}
        bookings={workspace.bookings}
        enrollments={workspace.enrollments}
        categories={categories}
      />
    </div>
  );
}
