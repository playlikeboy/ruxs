"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/core/money";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  society: string;
  tower: string;
  floor: string;
  flat: string;
  balancePaise: number;
}

export function CustomerListView({
  customers,
  slug,
}: {
  customers: CustomerItem[];
  slug: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.flat.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.society.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search by name, flat, society or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-surface border border-line rounded-[10px] text-ink placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Customer Count */}
      <div className="text-xs text-muted flex items-center justify-between px-1">
        <span>
          Showing {filtered.length} of {customers.length} households
        </span>
      </div>

      {/* Customer Cards */}
      <div className="space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/app/${slug}/customers/${c.id}`}
            className="block p-3.5 bg-surface border border-line rounded-[12px] hover:border-accent active:scale-[0.99] transition-all shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                  <span className="text-xs font-mono tabular-nums text-muted">
                    Flat {c.flat}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {c.society} {c.tower ? `• Tower ${c.tower}` : ""}
                </div>
                <div className="text-xs text-muted mt-0.5 font-mono">
                  {c.phone}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted">Khata Balance</div>
                <div
                  className={`text-sm font-bold font-mono tabular-nums mt-0.5 ${
                    c.balancePaise > 0
                      ? "text-[#B42318]"
                      : c.balancePaise < 0
                        ? "text-good"
                        : "text-ink"
                  }`}
                >
                  {formatINR(c.balancePaise)}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted bg-surface border border-line rounded-[12px]">
            No households match &quot;{query}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
