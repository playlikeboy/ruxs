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
        <main className="flex-1 w-full max-w-md mx-auto relative pb-20 sm:pb-8">
          {children}
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}
