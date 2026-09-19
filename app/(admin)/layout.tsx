import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Mission Control | RUXS",
  description: "Platform Administration Cockpit. Restricted to authorized administrators.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* High-density Admin Mission Control Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <BrandLogo className="w-20" priority />
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                Mission Control
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-4">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">LIVE CLUSTER</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Access Restriction Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted: sh20raj@gmail.com</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Viewport */}
      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground bg-card/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} RUXS Platform Engine · Restful Edge Runtime</span>
          <span className="font-mono text-[11px] text-muted-foreground/70">Authorised Personnel Only (sh20raj@gmail.com)</span>
        </div>
      </footer>
    </div>
  );
}
