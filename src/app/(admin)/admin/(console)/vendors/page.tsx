import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getAdminVendorList } from "@/features/admin/queries";

export const metadata = { title: "Vendors" };

const STATUS_TONE: Record<string, string> = {
  active: "bg-good/10 text-good",
  pending: "bg-warn/10 text-warn",
  suspended: "bg-bad/10 text-bad",
};

export default async function AdminVendorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const rows = await getAdminVendorList(q);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor stores</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} stores. Open one to edit details, manage its login, or jump into its panel.</p>
        </div>
        <Link href="/admin/vendors/new" className="flex h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> New vendor
        </Link>
      </div>

      <form className="relative max-w-md" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input name="q" defaultValue={q} placeholder="Search name, city, phone…" aria-label="Search vendors" className="h-11 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-sm" />
      </form>

      <ul className="space-y-2 md:hidden">
        {rows.map(({ vendor, products, customers }) => (
          <li key={vendor.id}>
            <Link href={`/admin/vendors/${vendor.id}`} className="block rounded-[14px] border border-line bg-surface p-4 active:bg-bg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{vendor.name}</p>
                  <p className="truncate text-xs text-muted">{vendor.area}, {vendor.city}</p>
                </div>
                <span className={"shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize " + (STATUS_TONE[vendor.status] ?? "")}>{vendor.status}</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {products} {products === 1 ? "item" : "items"} · {customers} {customers === 1 ? "customer" : "customers"} · login <span className="font-mono">{vendor.loginId ?? "not set"}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-[12px] border border-line bg-surface md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Store</th>
              <th className="px-4 py-3 font-semibold">Area</th>
              <th className="px-4 py-3 font-semibold">Login ID</th>
              <th className="px-4 py-3 text-right font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Customers</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ vendor, products, customers }) => (
              <tr key={vendor.id} className="hover:bg-bg">
                <td className="px-4 py-3">
                  <Link href={`/admin/vendors/${vendor.id}`} className="font-semibold text-ink hover:underline">{vendor.name}</Link>
                  <p className="font-mono text-xs text-muted">{vendor.phone}</p>
                </td>
                <td className="px-4 py-3 text-muted">{vendor.area}, {vendor.city}</td>
                <td className="px-4 py-3 font-mono text-xs">{vendor.loginId ?? <span className="text-warn">not set</span>}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{products}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{customers}</td>
                <td className="px-4 py-3"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold capitalize " + (STATUS_TONE[vendor.status] ?? "")}>{vendor.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
