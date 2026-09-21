import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AppHeaderUserNav } from "@/components/navigation/AppHeaderUserNav";
import { Home, Layers, PlayCircle, Wallet, Store } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop/Tablet Top Header */}
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/85 backdrop-blur-xl transition-all">
        <div className="ds-container flex h-16 items-center justify-between">
          <Link href="/" aria-label="RUXS home" className="group flex items-center gap-2">
            <BrandLogo variant="light" priority />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-gray-600 md:flex font-medium">
            <Link className="transition hover:text-black" href="/#services">Services</Link>
            <Link className="transition hover:text-black" href="/#how-it-works">How it works</Link>
            <Link className="transition hover:text-black" href="/#ledger">Account & Khata</Link>
            <Link className="transition hover:text-black" href="/vendor/onboard">For vendors</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white text-xs font-medium py-2 px-3.5 rounded-xl shadow-sm hover:brightness-105 transition"
            >
              <span>Launch App</span>
            </Link>
            <AppHeaderUserNav />
          </div>
        </div>
      </header>

      {/* Main Content Viewport with mobile bottom bar clearance */}
      <main className="flex-1 pb-20 md:pb-8">{children}</main>

      {/* Desktop Footer */}
      <footer className="hidden sm:block border-t border-blue-100/80 bg-slate-50/60 text-gray-600">
        <div className="ds-container py-12">
          <div className="grid gap-10 sm:grid-cols-[1.2fr_.8fr_.8fr]">
            <div className="max-w-sm">
              <BrandLogo variant="light" className="w-[112px]" />
              <p className="mt-4 text-sm leading-6 text-gray-500">
                The quiet operating layer for recurring local household services. Bangalore & Hyderabad gated apartment societies.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Explore</p>
              <div className="mt-4 grid gap-2.5 text-sm">
                <Link href="/#services" className="text-gray-600 transition hover:text-black">Services</Link>
                <Link href="/#how-it-works" className="text-gray-600 transition hover:text-black">How it works</Link>
                <Link href="/app" className="text-gray-600 transition hover:text-black">Customer App</Link>
                <Link href="/vendor/onboard" className="text-gray-600 transition hover:text-black">For vendors</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Product & Hub</p>
              <div className="mt-4 grid gap-2.5 text-sm">
                <Link href="/login" className="text-gray-600 transition hover:text-black">Sign in</Link>
                <Link href="/admin" className="text-gray-600 transition hover:text-black">Platform Admin</Link>
                <a href="https://github.com/SH20RAJ/ruxs" target="_blank" rel="noopener noreferrer" className="text-gray-600 transition hover:text-black">GitHub</a>
                <a href="mailto:hello@ruxs.in" className="text-gray-600 transition hover:text-black">Contact</a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-blue-100/60 pt-6 text-[11px] text-gray-400">
            © {new Date().getFullYear()} RUXS. Built for recurring local life.
          </div>
        </div>
      </footer>

      {/* Mobile-First Floating / Docked Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-blue-100/80 bg-white/95 px-3 backdrop-blur-xl md:hidden safe-area-bottom shadow-lg shadow-black/[0.04]"
      >
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-black active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Home</span>
        </Link>

        <Link
          href="/#services"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-black active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Services</span>
        </Link>

        <Link
          href="/app"
          className="flex flex-col items-center justify-center -mt-3.5"
          aria-label="Launch App"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-gray-700 to-gray-900 text-white shadow-lg shadow-black/20 active:scale-90 transition-transform">
            <PlayCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-gray-900 mt-0.5 leading-none">App</span>
        </Link>

        <Link
          href="/app"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-black active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Khata</span>
        </Link>

        <Link
          href="/vendor/dashboard"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-black active:scale-95 transition-all py-1 px-2.5 min-w-[56px]"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none tracking-tight">Vendor</span>
        </Link>
      </nav>
    </div>
  );
}
