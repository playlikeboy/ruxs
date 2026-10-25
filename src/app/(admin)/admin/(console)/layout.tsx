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
          <span className="rounded-[4px] bg-accent/15 px-1 py-0.2 text-[9px] font-black uppercase tracking-wider text-accent">
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
            className="flex h-9 items-center gap-2.5 rounded-[10px] bg-accent/10 px-3 text-xs font-bold text-accent hover:bg-accent hover:text-white transition"
          >
            <Plus className="h-4 w-4" /> Add Vendor Store
          </Link>

          <Link
            href="/merchant-panel"
            target="_blank"
            className="flex h-8 items-center justify-between rounded-[8px] px-3 text-xs font-medium text-muted hover:bg-bg hover:text-ink transition"
          >
            <span className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5 text-muted" /> Merchant Panel
            </span>
            <ExternalLink className="h-3 w-3 text-muted/60" />
          </Link>

          <Link
            href="/app"
            target="_blank"
            className="flex h-8 items-center justify-between rounded-[8px] px-3 text-xs font-medium text-muted hover:bg-bg hover:text-ink transition"
          >
            <span className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-muted" /> Household App
            </span>
            <ExternalLink className="h-3 w-3 text-muted/60" />
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

            <div className="hidden items-center gap-3 lg:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Systems Operational
              </span>
              <span className="text-muted/40">|</span>
              <span className="text-xs text-muted">RUXs Multi-Vendor Marketplace Core</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/vendors/new"
                className="hidden sm:flex h-9 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-xs font-bold text-white shadow-2xs hover:opacity-95 transition"
              >
                <Plus className="h-3.5 w-3.5" />
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
        <main className="mx-auto max-w-7xl overflow-x-clip pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
