import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";
import { requireUser } from "@/lib/auth/session";
import { TabBar } from "@/features/consumer/components/tab-bar";

export const metadata: Metadata = {
  title: { default: "Explore", template: "%s · RUXS" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default async function ConsumerAppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <AuthProvider>
      <div className="min-h-dvh bg-neutral-100 sm:py-0">
        <div className="relative mx-auto min-h-dvh max-w-md overflow-x-clip bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] text-ink antialiased sm:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
          {children}
        </div>
        <TabBar />
      </div>
      <Toaster />
    </AuthProvider>
  );
}
