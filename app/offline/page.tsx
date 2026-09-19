import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
export const metadata: Metadata = {
  title: "Offline mode · RUXS",
  description: "Offline shell for RUXS. Live actions require an active connection.",
  alternates: { canonical: "https://ruxs.in/offline" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Offline mode · RUXS",
    description: "Offline shell for RUXS. Live actions require an active connection.",
    url: "https://ruxs.in/offline",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offline mode · RUXS",
    description: "Offline shell for RUXS. Live actions require an active connection.",
  },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-xl">↗</div>
      <h1 className="text-2xl font-semibold text-foreground">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The RUXS shell is available, but live service actions require an active connection.</p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>Return home</Link>
    </div>
  );
}
