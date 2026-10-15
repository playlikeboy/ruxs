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
        <main className="relative mx-auto w-full max-w-md flex-1 overflow-x-clip pb-20 sm:pb-8">
          {children}
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}
