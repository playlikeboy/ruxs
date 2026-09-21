import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AppHeaderUserNav } from "@/components/navigation/AppHeaderUserNav";
import { Home, Layers, PlayCircle, Wallet, Store, Truck } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Desktop/Tablet Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="ds-container flex h-16 items-center justify-between">
          <Link href="/" aria-label="RUXS home" className="group flex items-center">
            <BrandLogo priority />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link className="transition hover:text-foreground" href="/#services">Services</Link>
            <Link className="transition hover:text-foreground" href="/#how-it-works">How it works</Link>
            <Link className="transition hover:text-foreground" href="/#ledger">Account</Link>
            <Link className="transition hover:text-foreground" href="/vendor/onboard">For vendors</Link>
          </nav>

          <AppHeaderUserNav />
        </div>
      </header>

      {/* Main Content Viewport with mobile bottom bar clearance */}
      <main className="flex-1 pb-20 md:pb-8">{children}</main>

      {/* Desktop Footer */}
      <footer className="hidden sm:block border-t border-border bg-background">
        <div className="ds-container py-12">
          <div className="grid gap-10 sm:grid-cols-[1.2fr_.8fr_.8fr]">
            <div className="max-w-sm">
              <BrandLogo className="w-[112px]" />
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The quiet operating layer for recurring local household services in India.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Explore</p>
              <div className="mt-4 grid gap-2.5 text-sm">
                <Link href="/#services" className="text-muted-foreground transition hover:text-foreground">Services</Link>
                <Link href="/#how-it-works" className="text-muted-foreground transition hover:text-foreground">How it works</Link>
                <Link href="/subscribe" className="text-muted-foreground transition hover:text-foreground">Get started</Link>
                <Link href="/vendor/onboard" className="text-muted-foreground transition hover:text-foreground">For vendors</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Product</p>
              <div className="mt-4 grid gap-2.5 text-sm">
                <Link href="/login" className="text-muted-foreground transition hover:text-foreground">Sign in</Link>
                <Link href="/admin" className="text-muted-foreground transition hover:text-foreground">Platform Admin</Link>
                <a href="https://github.com/SH20RAJ/ruxs" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition hover:text-foreground">GitHub</a>
                <a href="mailto:hello@ruxs.in" className="text-muted-foreground transition hover:text-foreground">Contact</a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-[11px] text-subtle">
            © {new Date().getFullYear()} RUXS. Built for recurring local life.
          </div>
        </div>
      </footer>

      {/* Mobile-First Floating / Docked Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 px-3 backdrop-blur-xl md:hidden safe-area-bottom shadow-2xl"
      >
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Home</span>
        </Link>

        <Link
          href="/#services"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Services</span>
        </Link>

        <Link
          href="/subscribe"
          className="flex flex-col items-center justify-center -mt-3.5"
          aria-label="Get Started"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-90 transition-transform">
            <PlayCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-primary mt-0.5 leading-none">Start</span>
        </Link>

        <Link
          href="/app"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">App</span>
        </Link>

        <Link
          href="/vendor/dashboard"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Hub</span>
        </Link>
      </nav>
    </div>
  );
}
