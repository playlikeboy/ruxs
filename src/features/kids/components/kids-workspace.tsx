import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented";
import { buttonClass } from "@/components/ui/button";

export type KidsSection = "classes" | "workshops" | "children";

/** Header, section switch and the one primary action for every /kids page. */
export function KidsWorkspace({
  slug,
  active,
  counts,
  pendingReview,
  children,
}: {
  slug: string;
  active: KidsSection;
  counts: Record<KidsSection, number>;
  pendingReview: boolean;
  children: React.ReactNode;
}) {
  const base = `/merchant-panel/${slug}/kids`;
  const action =
    active === "classes" ? { href: `${base}/classes/new`, label: "New class" } : active === "workshops" ? { href: `${base}/workshops/new`, label: "New workshop" } : null;
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <PageHeader
        title="Classes & workshops"
        description="What parents can book from you."
        action={
          action ? (
            <Link href={action.href} className={buttonClass("primary", "md")}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {action.label}
            </Link>
          ) : undefined
        }
      />
      {pendingReview && (
        <p role="status" className="rounded-[12px] bg-butter px-4 py-3 text-sm text-warn">
          RUXs is reviewing your profile. Parents see your listings once the safety review passes.
        </p>
      )}
      <SegmentedLinks
        className="max-w-md"
        active={active}
        items={[
          { key: "classes", label: `Classes (${counts.classes})`, href: base },
          { key: "workshops", label: `Workshops (${counts.workshops})`, href: `${base}/workshops` },
          { key: "children", label: `Children (${counts.children})`, href: `${base}/children` },
        ]}
      />
      {children}
    </div>
  );
}
