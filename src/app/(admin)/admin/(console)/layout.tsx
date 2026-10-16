import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminBadges } from "@/features/admin/queries";
import { AdminSidebarNav, AdminTabs } from "@/features/admin/components/admin-tabs";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-sm font-black text-white">R</span>
      <span className="leading-tight">
        <span className="block text-sm font-bold">RUXs</span>
        <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">Admin</span>
      </span>
    </Link>
  );
}

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const b = await getAdminBadges();
  const badges = { "/admin/vendors": b.pendingVendors, "/admin/payouts": b.openPayouts + b.refunds };

  return (
    <div className="min-h-dvh bg-bg text-ink antialiased">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
          <div className="border-b border-line px-5 py-4"><Brand /></div>
          <div className="flex-1 overflow-y-auto"><AdminSidebarNav badges={badges} /></div>
          <div className="border-t border-line p-3">
            <Link href="/app" className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-muted hover:bg-bg hover:text-ink">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Household app
            </Link>
          </div>
        </aside>

        <div className="lg:pl-60">
          <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
              <div className="lg:hidden"><Brand /></div>
              <p className="hidden text-sm text-muted lg:block">Platform admin</p>
              <UserNav />
            </div>
            <div className="lg:hidden"><AdminTabs badges={badges} /></div>
          </header>
          <main className="mx-auto max-w-7xl overflow-x-clip pb-12">{children}</main>
        </div>
    </div>
  );
}
