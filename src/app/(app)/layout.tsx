import { TapFeedback } from "@/components/ui/tap-feedback";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg text-ink flex flex-col antialiased selection:bg-[#FFE8DD]">
        {/* Each page sets its own width: the merchant panel is full-width, auth pages stay narrow. */}
        <main className="relative w-full flex-1 overflow-x-clip">
          {children}
        </main>
        <Toaster />
        <TapFeedback />
      </div>
    </AuthProvider>
  );
}
