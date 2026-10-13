import Link from "next/link";
import { requireVendorAccess } from "@/lib/auth/session";

export default async function MorePage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const access = await requireVendorAccess(slug);

  const links = [
    {
      title: "Bills & payments",
      description: "Monthly invoices, balances and payment status.",
      href: "/app/" + slug + "/bills",
      visible: true,
      marker: "₹",
    },
    {
      title: "Inventory & returnables",
      description: "Cans, dabbas and household asset balances.",
      href: "/app/" + slug + "/inventory",
      visible: true,
      marker: "02",
    },
    {
      title: "Analytics",
      description: "Order activity, delivered value and product performance for the last 30 days.",
      href: "/app/" + slug + "/analytics",
      visible: access.role === "owner" || access.role === "staff",
      marker: "03",
    },
    {
      title: "Products & prices",
      description: "Manage this business's products, prices, cutoffs and returnable assets.",
      href: "/app/" + slug + "/products",
      visible: access.role === "owner",
      marker: "04",
    },
    {
      title: "Business settings",
      description: "Manage your business details and invite staff or drivers.",
      href: "/app/" + slug + "/settings",
      visible: access.role === "owner",
      marker: "05",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">More tools</h1>
        <p className="mt-1 text-sm text-muted">Everything for managing {access.vendor.name} beyond today&apos;s run.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.filter((link) => link.visible).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex min-h-28 gap-4 rounded-[12px] border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-bg text-sm font-semibold tabular-nums text-accent" aria-hidden="true">{link.marker}</span>
            <span className="block">
              <span className="block font-semibold text-ink group-hover:text-accent">{link.title}</span>
              <span className="mt-1 block text-sm leading-5 text-muted">{link.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
