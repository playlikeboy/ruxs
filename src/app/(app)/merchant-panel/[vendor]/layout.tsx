import Link from "next/link";
import { requireVendorAccess } from "@/lib/auth/session";
import { VendorBottomNav } from "@/components/nav/vendor-bottom-nav";
import { UserNav } from "@/components/auth/user-nav";
import { countOpenShopOrders } from "@/features/shop-orders/queries";

export default async function VendorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const access = await requireVendorAccess(slug);
  const newOrders = await countOpenShopOrders(access.vendorId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-ink text-sm font-bold text-white" aria-hidden="true">
            {access.vendor.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <Link href={"/merchant-panel/" + slug + "/today"} className="block truncate text-[15px] font-semibold leading-tight text-ink">
              {access.vendor.name}
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className={"h-1.5 w-1.5 rounded-full " + (access.vendor.acceptingOrders ? "bg-good" : "bg-bad")} aria-hidden="true" />
              {access.vendor.acceptingOrders ? "Taking orders" : "Paused"} · <span className="capitalize">{access.role}</span>
            </p>
          </div>
        </div>
        <UserNav />
      </header>

      <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <VendorBottomNav slug={slug} newOrders={newOrders} />
    </div>
  );
}
