"use client";

import { ExportButton, type ExportData } from "./export-button";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface HouseholdRow {
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  society: string;
  flat: string;
  area: string;
  city: string;
  orders: number;
  stores: number;
  createdAt: Date;
}

export function AdminHouseholdsTable({ people }: { people: HouseholdRow[] }) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "User ID",
        "Name",
        "Phone",
        "Email",
        "Flat",
        "Society",
        "Area",
        "City",
        "Stores Subscribed",
        "Total Orders",
        "Joined Date",
      ],
      rows: people.map((p) => [
        p.userId,
        p.name,
        p.phone,
        p.email || "",
        p.flat,
        p.society,
        p.area,
        p.city,
        p.stores,
        p.orders,
        dateFmt.format(new Date(p.createdAt)),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename="ruxs-households"
          title="Export Households"
          getData={getExportData}
        />
      </div>

      <ul className="space-y-2 md:hidden">
        {people.map((p) => (
          <li key={p.userId} className="rounded-[14px] border border-line bg-surface p-4 text-sm shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink">{p.name}</p>
              <span className="text-xs text-muted">{dateFmt.format(new Date(p.createdAt))}</span>
            </div>
            <p className="text-xs text-muted mt-1">{p.flat}, {p.society} · {p.area}, {p.city}</p>
            <p className="mt-2 text-xs border-t border-line/60 pt-2 flex items-center justify-between">
              <span className="font-mono text-ink">{p.phone}</span>
              <span className="text-muted">{p.stores} stores · {p.orders} orders</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-[14px] border border-line bg-surface md:block shadow-2xs">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 text-right font-semibold">Stores</th>
              <th className="px-4 py-3 text-right font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {people.map((p) => (
              <tr key={p.userId} className="transition-colors hover:bg-bg/60">
                <td className="px-4 py-3 font-medium text-xs text-ink">{p.name}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  <span className="font-mono text-ink">{p.phone}</span>
                  {p.email && <br />}
                  {p.email}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.flat}, {p.society}
                  <br />
                  {p.area}, {p.city}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums font-semibold text-ink">
                  {p.stores}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums font-semibold text-accent">
                  {p.orders}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{dateFmt.format(new Date(p.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
