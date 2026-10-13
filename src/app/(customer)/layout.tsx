import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased selection:bg-[#FFE8DD]">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-12">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
