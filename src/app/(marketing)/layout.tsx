import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink antialiased selection:bg-[#FFE8DD]">
      <header className="sticky top-0 z-30 border-b border-line bg-[#FAFAF7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="RUXS home">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-accent text-lg font-extrabold text-white">R</span>
            <span className="text-xl font-bold tracking-tight text-ink">RUXS</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/for/tiffin-services" className="transition-colors hover:text-ink">Tiffins</Link>
            <Link href="/for/water-suppliers" className="transition-colors hover:text-ink">Water Cans</Link>
            <Link href="/about" className="transition-colors hover:text-ink">About</Link>
            <Link href="/in/bengaluru" className="transition-colors hover:text-ink">Bengaluru</Link>
          </nav>

          <Link
            href="/app"
            className="rounded-[10px] bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 sm:text-sm"
          >
            Merchant Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface py-12">
        <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-accent text-xs font-bold text-white">R</span>
                <span className="font-bold text-ink">RUXS</span>
              </Link>
              <p className="max-w-sm text-xs leading-5 text-muted">
                The daily operating system for neighbourhood tiffin kitchens and 20L water suppliers. Each merchant sets their own product prices.
              </p>
            </div>

            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted">
              <Link href="/about" className="hover:text-ink">About RUXS</Link>
              <Link href="/for/tiffin-services" className="hover:text-ink">Tiffin Services</Link>
              <Link href="/for/water-suppliers" className="hover:text-ink">Water Suppliers</Link>
              <Link href="/in/bengaluru" className="hover:text-ink">Bengaluru Local</Link>
              <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
            </nav>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row">
            <span>© {new Date().getFullYear()} RUXS. All rights reserved.</span>
            <span>Merchant-set prices. Direct UPI payments. Paise accuracy.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
