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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 flex-col">
          <Link
            href={"/app/" + slug + "/today"}
            className="truncate text-base font-semibold leading-tight text-ink transition-colors hover:text-accent"
          >
            {access.vendor.name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>{access.vendor.area}</span>
            <span>•</span>
            <span className="capitalize">{access.role}</span>
          </div>
        </div>
        <UserNav />
      </header>

      <div className="flex-1 pb-16">{children}</div>
      <VendorBottomNav slug={slug} />
    </div>
  );
}
