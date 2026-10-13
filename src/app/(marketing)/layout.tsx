import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased selection:bg-[#FFE8DD]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[8px] bg-accent text-white font-extrabold flex items-center justify-center text-lg">
              R
            </span>
            <span className="text-xl font-bold tracking-tight text-ink">
              RUXS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/for/tiffin-services" className="hover:text-ink transition-colors">
              Tiffins
            </Link>
            <Link href="/for/water-suppliers" className="hover:text-ink transition-colors">
              Water Cans
            </Link>
            <Link href="/pricing" className="hover:text-ink transition-colors">
              Pricing
            </Link>
            <Link href="/in/bengaluru" className="hover:text-ink transition-colors">
              Bengaluru
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="px-4 py-2 bg-accent text-white text-xs sm:text-sm font-semibold rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              Sign In / Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-surface border-t border-line mt-20 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-[6px] bg-accent text-white font-bold flex items-center justify-center text-xs">
                  R
                </span>
                <span className="font-bold text-ink">RUXS</span>
              </div>
              <p className="text-xs text-muted max-w-sm">
                The one-link daily operating system for neighbourhood tiffin kitchens and 20L water suppliers.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted">
              <Link href="/for/tiffin-services" className="hover:text-ink">
                Tiffin Services
              </Link>
              <Link href="/for/water-suppliers" className="hover:text-ink">
                Water Suppliers
              </Link>
              <Link href="/pricing" className="hover:text-ink">
                Pricing
              </Link>
              <Link href="/in/bengaluru" className="hover:text-ink">
                Bengaluru Local
              </Link>
              <Link href="/privacy" className="hover:text-ink">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-ink">
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-line text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} RUXS. All rights reserved.</span>
            <span>Zero commission. Direct UPI payments. Paise accuracy.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
