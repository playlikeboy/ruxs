import { RuxsMark } from "@/components/marketing/ruxs-mark";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink antialiased selection:bg-peach">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="RUXs home">
            <RuxsMark className="h-9 w-9 shrink-0" alt="" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-[-0.03em] text-accent sm:text-xl">RUXs</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-4 text-sm font-medium text-muted lg:flex">
            <Link href="/for/kids" className="transition-colors hover:text-ink">Kids &amp; learning</Link>
            <Link href="/app/kids/shop" className="transition-colors hover:text-ink">RUXs Store</Link>
            <Link href="/for/tiffin-services" className="transition-colors hover:text-ink">Meals</Link>
            <Link href="/app" className="transition-colors hover:text-ink">All services</Link>
            <Link href="/merchant-panel" className="transition-colors hover:text-ink">For merchants</Link>
            <Link href="/pricing" className="transition-colors hover:text-ink">Pricing</Link>
            <Link href="/about" className="transition-colors hover:text-ink">About</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/app/kids" className="inline-flex min-h-10 items-center rounded-control px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface sm:hidden">
              Kids
            </Link>
            <Link href="/sign-in" className="inline-flex min-h-10 items-center rounded-control px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface sm:px-3.5 sm:text-sm">
              Sign in
            </Link>
            <Link href="/app" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-ink px-3.5 text-xs font-semibold text-bg transition-colors hover:bg-ink/90 sm:gap-2 sm:px-4 sm:text-sm">
              Open the app <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface py-12">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2.5" aria-label="RUXs home">
                <RuxsMark className="h-8 w-8 shrink-0" alt="" aria-hidden="true" />
                <span className="font-extrabold tracking-[-0.03em] text-accent">RUXs</span>
              </Link>
              <p className="max-w-sm text-sm leading-6 text-muted">
                Kids&apos; classes, workshops and learning kits, the RUXs Store, and neighbourhood services for everyday life — meals, water, dairy, local stores, gifts and specialists.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Explore RUXs</h2>
              <nav aria-label="Customer links" className="flex flex-col items-start gap-2.5 text-sm text-muted">
                <Link href="/app" className="hover:text-ink">All local services</Link>
                <Link href="/app/kids" className="hover:text-ink">Kids Zone &amp; classes</Link>
                <Link href="/for/kids" className="hover:text-ink">Kids classes, workshops &amp; kits</Link>
                <Link href="/app/kids/shop" className="hover:text-ink">RUXs Store</Link>
                <Link href="/app/category/gifts" className="hover:text-ink">Gifts &amp; hampers</Link>
                <Link href="/app/category/mehndi" className="hover:text-ink">Mehndi &amp; henna</Link>
                <Link href="/pricing" className="hover:text-ink">How pricing works</Link>
              </nav>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">For local businesses</h2>
              <nav aria-label="Merchant links" className="flex flex-col items-start gap-2.5 text-sm text-muted">
                <Link href="/merchant-panel" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-accent">
                  Merchant workspace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link href="/apply" className="hover:text-ink">List your business</Link>
                <Link href="/for/tiffin-services" className="hover:text-ink">For tiffin kitchens</Link>
                <Link href="/for/water-suppliers" className="hover:text-ink">For water suppliers</Link>
              </nav>
              <nav aria-label="Company links" className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-muted">
                <Link href="/about" className="hover:text-ink">About</Link>
                <Link href="/privacy" className="hover:text-ink">Privacy</Link>
                <Link href="/terms" className="hover:text-ink">Terms</Link>
              </nav>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Support &amp; Contact</h2>
              <div className="flex flex-col items-start gap-2.5 text-sm text-muted">
                <a
                  href="mailto:adminruxs@gmail.com"
                  className="inline-flex items-center gap-2 hover:text-ink"
                >
                  <Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>adminruxs@gmail.com</span>
                </a>
                <a
                  href="https://wa.me/919610201507"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 hover:text-ink"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                  <span>
                    <strong className="block font-semibold tabular-nums text-ink">9610201507</strong>
                    <span className="text-xs text-muted">WhatsApp messages only</span>
                    <span className="sr-only"> (opens WhatsApp in a new tab)</span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} RUXs. All rights reserved.</span>
            <span>Each provider sets their own prices, service areas and terms.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
