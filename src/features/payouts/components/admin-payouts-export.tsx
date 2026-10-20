"use client";

import { ExportButton, type ExportData } from "@/features/admin/components/export-button";

interface BalanceItem {
  vendor: {
    name: string;
    slug: string;
    upiVpa: string;
  };
  balance: {
    availablePaise: number;
    pendingPaise: number;
    withdrawnPaise: number;
    feePaise: number;
  };
}

interface RequestItem {
  payout: {
    id: string;
    amountPaise: number;
    status: string;
    requestedAt: Date;
    processedAt?: Date | null;
  };
  vendorName: string;
  upiVpa: string;
}

export function AdminPayoutsExport({
  balances,
  requests,
}: {
  balances: BalanceItem[];
  requests: RequestItem[];
}) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "Store Name",
        "UPI VPA",
        "Available Balance (Rs)",
        "Pending Delivery (Rs)",
        "Withdrawn to Date (Rs)",
        "RUXs Commission (Rs)",
      ],
      rows: balances.map((b) => [
        b.vendor.name,
        b.vendor.upiVpa,
        (b.balance.availablePaise / 100).toFixed(2),
        (b.balance.pendingPaise / 100).toFixed(2),
        (b.balance.withdrawnPaise / 100).toFixed(2),
        (b.balance.feePaise / 100).toFixed(2),
      ]),
    };
  };

  const getRequestsExportData = (): ExportData => {
    return {
      headers: [
        "Payout ID",
        "Store Name",
        "UPI VPA",
        "Amount (Rs)",
        "Status",
        "Requested Date",
        "Paid Date",
      ],
      rows: requests.map((r) => [
        r.payout.id,
        r.vendorName,
        r.upiVpa,
        (r.payout.amountPaise / 100).toFixed(2),
        r.payout.status,
        new Date(r.payout.requestedAt).toLocaleDateString("en-IN"),
        r.payout.processedAt ? new Date(r.payout.processedAt).toLocaleDateString("en-IN") : "—",
      ]),
    };
  };

  return (
    <div className="flex items-center gap-2">
      <ExportButton
        filename="ruxs-payout-balances"
        title="Export Balances"
        getData={getExportData}
      />
      <ExportButton
        filename="ruxs-withdrawal-requests"
        title="Export Requests"
        getData={getRequestsExportData}
      />
    </div>
  );
}
