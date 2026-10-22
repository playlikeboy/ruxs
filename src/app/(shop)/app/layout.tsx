import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";
import { requireUser } from "@/lib/auth/session";
import { TabBar } from "@/features/consumer/components/tab-bar";

export const metadata: Metadata = {
  title: { default: "Explore", template: "%s · RUXs" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFF3E9",
  viewportFit: "cover",
};

export default async function ConsumerAppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <AuthProvider>
      <div className="min-h-dvh bg-app-canvas sm:py-0">
        <div className="relative mx-auto min-h-dvh max-w-md overflow-x-clip border-x border-app-canvas bg-app-surface pb-[calc(4rem+env(safe-area-inset-bottom))] text-ink antialiased sm:border-x-line sm:shadow-[0_18px_70px_-55px_rgba(42,54,40,0.35)]">
          {children}
        </div>
        <TabBar />
      </div>
      <Toaster />
    </AuthProvider>
  );
}
