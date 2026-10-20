import Link from "next/link";
import { requireVendorAccess } from "@/lib/auth/session";
import { VendorBottomNav } from "@/components/nav/vendor-bottom-nav";
import { VendorSidebar } from "@/components/nav/vendor-sidebar";
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
  const provider = access.vendor.businessType === "booking";
  const newOrders = provider ? 0 : await countOpenShopOrders(access.vendorId);

  return (
    <div className="min-h-dvh bg-bg">
      <VendorSidebar
        slug={slug}
        storeName={access.vendor.name}
        area={access.vendor.area}
        role={access.role}
        acceptingOrders={access.vendor.acceptingOrders}
        newOrders={newOrders}
        provider={provider}
        category={access.vendor.categoryId}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white shadow-2xs" aria-hidden="true">
                {access.vendor.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <Link href={"/merchant-panel/" + slug + "/today"} className="block truncate text-[15px] font-semibold leading-tight text-ink">
                  {access.vendor.name}
                </Link>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={"h-2 w-2 rounded-full " + (access.vendor.acceptingOrders ? "bg-good shadow-[0_0_8px_rgba(47,125,79,0.4)]" : "bg-bad")} aria-hidden="true" />
                  {access.vendor.acceptingOrders ? "Taking orders" : "Paused"} · <span className="capitalize">{access.role}</span>
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-white shadow-2xs">
                {access.vendor.name.charAt(0)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{access.vendor.name}</span>
                <span className="flex items-center gap-1.5 rounded-full border border-black/5 bg-bg px-2.5 py-0.5 text-xs text-muted">
                  <span className={"h-2 w-2 rounded-full " + (access.vendor.acceptingOrders ? "bg-good shadow-[0_0_8px_rgba(47,125,79,0.4)]" : "bg-bad")} />
                  {access.vendor.acceptingOrders ? "Taking orders" : "Paused"}
                </span>
                <span className="rounded-full bg-peach/80 px-2 py-0.5 text-xs font-semibold capitalize text-accent">
                  {access.role}
                </span>
              </div>
            </div>
            <UserNav />
          </div>
        </header>

        <main className="mx-auto max-w-6xl pb-[calc(5rem+env(safe-area-inset-bottom))] lg:px-2 lg:pb-12">{children}</main>
      </div>

      <div className="lg:hidden">
        <VendorBottomNav slug={slug} newOrders={newOrders} provider={provider} />
      </div>
    </div>
  );
}
