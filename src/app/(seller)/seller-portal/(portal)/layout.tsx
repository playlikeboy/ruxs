import Link from "next/link";
import { ExternalLink, Home, Plus, ShieldCheck } from "lucide-react";
import { RuxsMark } from "@/components/marketing/ruxs-mark";
import { UserNav } from "@/components/auth/user-nav";
import { requireSeller } from "@/features/store/seller-auth";
import { getStorePendingCounts } from "@/features/store/admin-queries";
import { SellerSidebarNav, SellerTabs } from "@/features/store/seller-components/seller-nav";

function Brand() {
  return (
    <Link
      href="/seller-portal"
      className="group flex items-center gap-2.5 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <RuxsMark className="h-9 w-9 shrink-0" aria-hidden="true" />
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight text-ink transition group-hover:text-brand-deep">RUXs Store</span>
        <span className="block text-xs font-medium text-muted">Seller portal</span>
      </span>
    </Link>
  );
}

const shortcut =
  "flex h-10 items-center justify-between rounded-control px-3 text-[13px] font-medium text-muted transition hover:bg-bg hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default async function SellerPortalLayout({ children }: { children: React.ReactNode }) {
  await requireSeller();
  // A failed count must not take the whole portal down: the pages still work without badges.
  const counts = await getStorePendingCounts().catch((err: unknown) => {
    console.error("[seller-portal] badge counts failed", err instanceof Error ? err.message : err);
    return { toPack: 0, toForward: 0, returns: 0, reviews: 0, refundDue: 0 };
  });
  const badges = {
    "/seller-portal/orders": counts.toPack,
    "/seller-portal/returns": counts.returns,
    "/seller-portal/reviews": counts.reviews,
  };

  return (
    <div className="min-h-dvh bg-bg text-ink antialiased print:bg-white">
      <a
        href="#seller-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-2xs"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex print:!hidden">
        <div className="border-b border-line px-5 py-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SellerSidebarNav badges={badges} />
        </div>
        <div className="space-y-1 border-t border-line p-3">
          <Link href="/app/kids/shop" target="_blank" className={shortcut}>
            <span className="flex items-center gap-2">
              <Home className="h-4 w-4" aria-hidden="true" /> View the store
              <span className="sr-only">(opens in a new tab)</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link href="/admin" className={shortcut}>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin console
            </span>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64 print:!pl-0">
        <header className="sticky top-0 z-30 border-b border-line bg-surface pt-[env(safe-area-inset-top)] print:hidden">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
            <div className="lg:hidden">
              <Brand />
            </div>
            {/* Spacer keeps the actions right-aligned on desktop, where the brand sits in the sidebar. */}
            <div className="hidden lg:block" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <Link
                href="/seller-portal/products/new"
                className="hidden min-h-10 items-center gap-1.5 rounded-control bg-accent px-3 text-[13px] font-semibold text-white transition hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> New product
              </Link>
              <UserNav />
            </div>
          </div>
          <div className="border-t border-line/60 lg:hidden">
            <SellerTabs badges={badges} />
          </div>
        </header>

        <main id="seller-main" tabIndex={-1} className="mx-auto max-w-7xl overflow-x-clip pb-16 focus:outline-none print:max-w-none print:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
