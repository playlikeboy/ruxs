import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";
import { UserNav } from "@/components/auth/user-nav";
import { requireAdmin } from "@/lib/auth/session";
import { AdminTabs } from "@/features/admin/components/admin-tabs";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · RUXS Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <AuthProvider>
      <div className="min-h-dvh bg-bg text-ink antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
            <div className="flex items-center justify-between pb-3">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-sm font-black text-white">R</span>
                <span className="text-sm font-bold">RUXS <span className="font-medium text-muted">Admin</span></span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/app" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">Household app ↗</Link>
                <UserNav />
              </div>
            </div>
            <AdminTabs />
          </div>
        </header>
        <main className="mx-auto max-w-6xl overflow-x-clip">{children}</main>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
