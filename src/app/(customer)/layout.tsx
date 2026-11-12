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
    <div className="flex min-h-screen flex-col bg-bg text-ink antialiased selection:bg-peach">
      <main className="relative mx-auto w-full max-w-md flex-1 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
