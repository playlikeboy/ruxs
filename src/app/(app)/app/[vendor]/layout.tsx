import Link from "next/link";
import { requireVendorAccess } from "@/lib/auth/session";
import { VendorBottomNav } from "@/components/nav/vendor-bottom-nav";
import { UserNav } from "@/components/auth/user-nav";

export default async function VendorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const access = await requireVendorAccess(slug);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <Link
            href={`/app/${slug}/today`}
            className="text-base font-semibold text-ink leading-tight hover:text-accent transition-colors"
          >
            {access.vendor.name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>{access.vendor.area}</span>
            <span>•</span>
            <span className="capitalize">{access.role}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {access.role === "owner" && (
            <div className="flex items-center gap-1 text-xs">
              <Link
                href={`/app/${slug}/products`}
                className="px-2 py-1 text-muted hover:text-ink rounded-[6px] hover:bg-[#FAFAF7]"
              >
                Products
              </Link>
              <Link
                href={`/app/${slug}/settings`}
                className="px-2 py-1 text-muted hover:text-ink rounded-[6px] hover:bg-[#FAFAF7]"
              >
                Settings
              </Link>
            </div>
          )}
          <UserNav />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pb-16">{children}</div>

      {/* Bottom Nav */}
      <VendorBottomNav slug={slug} />
    </div>
  );
}
