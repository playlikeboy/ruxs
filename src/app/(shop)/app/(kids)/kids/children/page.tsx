import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { getMyChildren } from "@/features/kids/queries";
import { ChildrenManager } from "@/features/kids/components/children-manager";
import { KidsPageHeader } from "@/features/kids/components/kids-ui";

export const metadata: Metadata = {
  title: "My children · RUXs Kids",
  description: "Your children's profiles, used to book classes and workshops that fit their age.",
};

export default async function KidsChildrenPage() {
  const children = await getMyChildren();

  return (
    <div className="space-y-5">
      <KidsPageHeader title="My children" lead="Add each child once; booking then checks the age fits." />
      <p className="flex items-center gap-2 text-sm text-kids-ink/65">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Profiles are private. Teachers see only the child you book for.
      </p>
      <ChildrenManager initialChildren={children} />
    </div>
  );
}
