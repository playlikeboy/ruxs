"use client";

import Link from "next/link";
import { ExportButton, type ExportData } from "./export-button";

interface VendorRow {
  vendor: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    city: string;
    area: string;
    status: string;
    businessType: string;
    categoryId: string | null;
    loginId: string | null;
    createdAt: Date;
  };
  products: number;
  customers: number;
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-good/10 text-good border-good/20",
  pending: "bg-warn/10 text-warn border-warn/20",
  suspended: "bg-bad/10 text-bad border-bad/20",
};

export function AdminVendorsTable({ rows }: { rows: VendorRow[] }) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "Store Name",
        "Slug",
        "Phone",
        "Type",
        "Category",
        "Area",
        "City",
        "Login ID",
        "Products Count",
        "Customers Count",
        "Status",
        "Created At",
      ],
      rows: rows.map((r) => [
        r.vendor.name,
        r.vendor.slug,
        r.vendor.phone,
        r.vendor.businessType,
        r.vendor.categoryId || "",
        r.vendor.area,
        r.vendor.city,
        r.vendor.loginId || "",
        r.products,
        r.customers,
        r.vendor.status,
        new Date(r.vendor.createdAt).toLocaleDateString("en-IN"),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename="ruxs-vendors"
          title="Export Stores"
          getData={getExportData}
        />
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map(({ vendor, products, customers }) => (
          <li key={vendor.id}>
            <Link
              href={`/admin/vendors/${vendor.id}`}
              className="block rounded-[14px] border border-line bg-surface p-4 shadow-2xs active:bg-bg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-ink">{vendor.name}</p>
                  <p className="truncate text-xs text-muted">
                    {vendor.businessType === "booking" ? "Booking provider" : "Delivery store"} · {vendor.area}, {vendor.city}
                  </p>
                </div>
                <span className={"shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize " + (STATUS_TONE[vendor.status] ?? "")}>
                  {vendor.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {products} {products === 1 ? "item" : "items"} · {customers} {customers === 1 ? "customer" : "customers"} · login <span className="font-mono text-ink">{vendor.loginId ?? "not set"}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-[14px] border border-line bg-surface md:block shadow-2xs">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Store</th>
              <th className="px-4 py-3 font-semibold">Area &amp; Category</th>
              <th className="px-4 py-3 font-semibold">Login ID</th>
              <th className="px-4 py-3 text-right font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Customers</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ vendor, products, customers }) => (
              <tr key={vendor.id} className="transition-colors hover:bg-bg/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/vendors/${vendor.id}`} className="font-semibold text-xs text-ink hover:underline">
                    {vendor.name}
                  </Link>
                  <p className="font-mono text-[11px] text-muted">{vendor.phone}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  <p className="text-ink font-medium">{vendor.area}, {vendor.city}</p>
                  <span className="text-[11px] capitalize">{vendor.categoryId ?? vendor.businessType}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {vendor.loginId ? (
                    <span className="text-ink font-medium">{vendor.loginId}</span>
                  ) : (
                    <span className="text-warn font-medium">not set</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{products}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{customers}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full border px-2 py-0.5 text-xs font-semibold capitalize " + (STATUS_TONE[vendor.status] ?? "")}>
                    {vendor.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/vendors/${vendor.id}`}
                    className="rounded-[6px] border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-bg transition"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
