import type { Metadata } from "next";
import { KidsHeader } from "@/features/kids/components/kids-header";
import { KidsSubNav } from "@/features/kids/components/kids-sub-nav";

export const metadata: Metadata = {
  title: "Kids Activities, STEM & Learning Marketplace",
  description:
    "Discover robotics, chess, pottery art, karate, and DIY science kits for kids. Safe, small-batch classes by verified neighbourhood mentors.",
  openGraph: {
    title: "Kids Zone · RUXs",
    description: "Kids Activities, STEM Classes, Workshops & DIY Kits near you.",
  },
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-amber-50/40 pb-20">
      <KidsHeader />
      <KidsSubNav />
      <main className="px-4 py-3">{children}</main>
    </div>
  );
}
