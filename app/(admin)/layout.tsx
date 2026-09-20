import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Platform control · RUXS",
  description: "Internal RUXS platform administration workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#090b0a] text-foreground">{children}</div>;
}
