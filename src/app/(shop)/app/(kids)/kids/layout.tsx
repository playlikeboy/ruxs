import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { KidsHeader } from "@/features/kids/components/kids-header";
import { KidsSubNav } from "@/features/kids/components/kids-sub-nav";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Kids classes, workshops and learning kits",
  description: "Classes, weekend workshops and learning kits for children from providers near you, reviewed by RUXs.",
  openGraph: {
    title: "RUXs Kids",
    description: "Classes, workshops and learning kits for children near you.",
  },
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fredoka.variable} min-h-dvh bg-kids-cream pb-24 text-kids-ink`}>
      <KidsHeader />
      <KidsSubNav />
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
