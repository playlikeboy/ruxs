import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CreditCard, Home, Settings2, UsersRound } from "lucide-react";

const navItems = [
  { href: "/customer/dashboard", label: "Overview", icon: Home },
  { href: "/subscribe", label: "Add service", icon: Settings2 },
  { href: "/household", label: "Household", icon: UsersRound },
];

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0d0c] text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.08] bg-[#0d100e] lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-white/[0.08] px-6">
            <Link href="/" aria-label="RUXS home">
              <BrandLogo priority className="w-[92px]" />
            </Link>
          </div>

          <div className="px-4 py-5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Household space</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Daily operations</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Services, deliveries and your digital Khata in one place.
              </p>
            </div>
          </div>

          <nav className="px-3">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Workspace</p>
            <div className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                >
                  <Icon className="h-4 w-4 text-subtle transition group-hover:text-primary" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-auto border-t border-white/[0.08] p-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">Digital Khata</p>
                <p className="text-[10px] text-muted-foreground">Transparent, searchable ledger</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0d0c]/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Link href="/" aria-label="RUXS home">
                  <BrandLogo className="w-[84px]" />
                </Link>
                <span className="h-5 w-px bg-white/[0.08]" />
                <span className="text-sm font-medium text-muted-foreground">Household</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold">Household overview</p>
                <p className="text-xs text-muted-foreground">Recurring services without the daily follow-up.</p>
              </div>
              <Link
                href="/login"
                className="rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-white/[0.16] hover:bg-white/[0.03] hover:text-foreground"
              >
                Account
              </Link>
            </div>
          </header>

          <main className="min-h-[calc(100vh-64px)] pb-20 lg:pb-8">{children}</main>

          <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.08] bg-[#0b0d0c]/95 px-2 backdrop-blur-xl lg:hidden">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex min-w-[72px] flex-col items-center gap-1 py-1 text-[10px] font-medium text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
