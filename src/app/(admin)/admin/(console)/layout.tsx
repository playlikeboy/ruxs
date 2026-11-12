import Link from "next/link";
import { RuxsMark } from "@/components/marketing/ruxs-mark";
import { ExternalLink, Plus, Store, Home } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminBadges } from "@/features/admin/queries";
import { AdminSidebarNav, AdminTabs } from "@/features/admin/components/admin-tabs";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 group">
      <RuxsMark className="h-9 w-9 shrink-0" aria-hidden="true" />
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm tracking-tight text-ink group-hover:text-accent transition">
            RUXs
          </span>
          <span className="rounded-[4px] bg-accent/15 px-1 py-px text-[10px] font-bold uppercase tracking-wider text-accent">
            Console
          </span>
        </div>
        <span className="block text-[11px] font-medium text-muted">
          Platform Administration
        </span>
      </div>
    </Link>
  );
}

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const b = await getAdminBadges();
  const badges = {
    "/admin/vendors": b.pendingVendors,
    "/admin/payouts": b.openPayouts + b.refunds,
  };

  return (
    <div className="min-h-dvh bg-bg text-ink antialiased">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-2xs"
      >
        Skip to content
      </a>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Brand />
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto">
          <AdminSidebarNav badges={badges} />
        </div>

        {/* Sidebar Footer Shortcuts */}
        <div className="border-t border-line p-3 space-y-1">
          <Link
            href="/admin/vendors/new"
            className="flex h-9 items-center gap-2.5 rounded-control bg-accent/10 px-3 text-xs font-bold text-accent transition hover:bg-accent hover:text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add vendor store
          </Link>

          <Link
            href="/merchant-panel"
            target="_blank"
            className="flex h-9 items-center justify-between rounded-control px-3 text-xs font-medium text-muted transition hover:bg-bg hover:text-ink"
          >
            <span className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5" aria-hidden="true" /> Merchant Panel
              <span className="sr-only">(opens in a new tab)</span>
            </span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>

          <Link
            href="/app"
            target="_blank"
            className="flex h-9 items-center justify-between rounded-control px-3 text-xs font-medium text-muted transition hover:bg-bg hover:text-ink"
          >
            <span className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5" aria-hidden="true" /> Household App
              <span className="sr-only">(opens in a new tab)</span>
            </span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
            <div className="lg:hidden">
              <Brand />
            </div>

            {/* Spacer keeps the actions right-aligned on desktop, where the brand sits in the sidebar. */}
            <div className="hidden lg:block" aria-hidden="true" />

            <div className="flex items-center gap-3">
              <Link
                href="/admin/vendors/new"
                className="hidden h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-accent/90 sm:flex"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>New Store</span>
              </Link>
              <UserNav />
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden border-t border-line/60">
            <AdminTabs badges={badges} />
          </div>
        </header>

        {/* Page Content */}
        <main id="admin-main" tabIndex={-1} className="mx-auto max-w-7xl overflow-x-clip pb-16 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
