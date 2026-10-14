import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink antialiased selection:bg-[#FFE8DD]">
      <header className="sticky top-0 z-30 border-b border-line bg-[#FAFAF7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="RUXS home">
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-accent text-lg font-extrabold text-white">R</span>
            <span className="text-xl font-bold tracking-tight text-ink">RUXS</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/for/tiffin-services" className="transition-colors hover:text-ink">Tiffin & Meals</Link>
            <Link href="/for/water-suppliers" className="transition-colors hover:text-ink">Water Cans</Link>
            <Link href="/app" className="transition-colors hover:text-ink">Consumer Portal</Link>
            <Link href="/pricing" className="transition-colors hover:text-ink">Pricing</Link>
            <Link href="/about" className="transition-colors hover:text-ink">About</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/sign-in" className="rounded-[10px] px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-surface sm:text-sm">
              Sign In
            </Link>
            <Link href="/app" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 sm:text-sm">
              Open App <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface py-12">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr_1fr]">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-xs font-bold text-white">R</span>
                <span className="font-bold text-ink">RUXS</span>
              </Link>
              <p className="max-w-sm text-sm leading-6 text-muted">
                Everyday essentials across India, from your neighbourhood. Discover tiffin subscriptions, water-can delivery and local services.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">For customers</h2>
              <nav aria-label="Customer links" className="flex flex-col items-start gap-2.5 text-sm text-muted">
                <Link href="/app" className="hover:text-ink">Consumer Portal & Hub</Link>
                <Link href="/pricing" className="hover:text-ink">How pricing works</Link>
                <Link href="/for/tiffin-services" className="hover:text-ink">Tiffin & meal plans</Link>
                <Link href="/for/water-suppliers" className="hover:text-ink">Water-can delivery</Link>
              </nav>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">For merchants</h2>
              <nav aria-label="Merchant links" className="flex flex-col items-start gap-2.5 text-sm text-muted">
                <Link href="/merchant" className="font-semibold text-ink hover:text-accent">
                  Merchant Workspace Portal →
                </Link>
                <Link href="/onboarding" className="hover:text-ink">Register as a Supplier</Link>
                <Link href="/for/tiffin-services" className="hover:text-ink">For tiffin kitchens</Link>
                <Link href="/for/water-suppliers" className="hover:text-ink">For water suppliers</Link>
              </nav>
              <nav aria-label="Company links" className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-muted">
                <Link href="/about" className="hover:text-ink">About</Link>
                <Link href="/privacy" className="hover:text-ink">Privacy</Link>
                <Link href="/terms" className="hover:text-ink">Terms</Link>
              </nav>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} RUXS. All rights reserved.</span>
            <span>Each merchant sets their own prices and service terms.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
