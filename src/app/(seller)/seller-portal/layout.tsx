import type { Metadata } from "next";
import { TapFeedback } from "@/components/ui/tap-feedback";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";

/** The RUXs Store back office. Its own URL, the same admins as /admin, never indexed. */
export const metadata: Metadata = {
  title: { default: "Seller portal", template: "%s · RUXs Seller portal" },
  robots: { index: false, follow: false, nocache: true },
};

export default function SellerPortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
      <TapFeedback />
    </AuthProvider>
  );
}
