import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform control · RUXS",
  description: "Internal RUXS platform administration workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#090b0a] text-foreground">{children}</div>;
}
