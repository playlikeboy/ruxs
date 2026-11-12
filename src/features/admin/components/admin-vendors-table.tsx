"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  ShoppingBag,
  Square,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppIcon } from "@/components/ui/app-icon";
import { buttonClass } from "@/components/ui/button";
import { VENDOR_TYPE_INFO, toVendorType } from "@/core/vendor-types";
import {
  adminBulkDeleteVendors,
  adminBulkSetVendorStatus,
  adminDeleteVendor,
  adminGenerateCredentials,
  adminSetVendorStatus,
  adminToggleAcceptingOrders,
} from "@/features/admin/actions";
import { AdminDialog } from "./admin-dialog";
import { ExportButton, type ExportData } from "./export-button";
import { APP_URL } from "@/lib/app-url";


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
    vendorType: string;
    categoryId: string | null;
    loginId: string | null;
    acceptingOrders?: boolean;
    createdAt: Date;
  };
  products: number;
  customers: number;
}

const DEFAULT_STATUS_CONFIG = {
  label: "Pending",
  badge: "border-warn/20 bg-warn/10 text-warn",
  dot: "bg-warn",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Active",
    badge: "border-good/20 bg-good/10 text-good",
    dot: "bg-good",
  },
  pending: DEFAULT_STATUS_CONFIG,
  suspended: {
    label: "Suspended",
    badge: "border-bad/20 bg-bad/10 text-bad",
    dot: "bg-bad",
  },
};

export function AdminVendorsTable({ rows }: { rows: VendorRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorRow["vendor"] | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    vendorName: string;
    loginId: string;
    password: string;
    loginUrl: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.vendor.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // --- Handlers ---
  const handleToggleStatus = (vendorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    if (nextStatus === "suspended" && !window.confirm("Suspend this vendor? Their store disappears from the app and their panel locks.")) return;
    startTransition(async () => {
      const res = await adminSetVendorStatus({ vendorId, status: nextStatus });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(nextStatus === "active" ? "Store activated" : "Store suspended");
        router.refresh();
      }
    });
  };

  const handleToggleOrders = (vendorId: string, current: boolean) => {
    startTransition(async () => {
      const res = await adminToggleAcceptingOrders({
        vendorId,
        acceptingOrders: !current,
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(res.acceptingOrders ? "Store now accepting orders" : "Store paused for orders");
        router.refresh();
      }
    });
  };

  const handleGenerateCredentials = (vendorId: string, vendorName: string, hasLogin: boolean) => {
    if (hasLogin && !window.confirm(`Replace the password for ${vendorName}? The owner's old password stops working.`)) return;
    startTransition(async () => {
      const res = await adminGenerateCredentials({ vendorId });
      if (!res.ok) toast.error(res.error);
      else {
        setCredentialsModal({
          vendorName,
          loginId: res.credentials.loginId,
          password: res.credentials.password,
          loginUrl: res.credentials.loginUrl,
        });
        toast.success("Fresh credentials issued");
      }
    });
  };

  const handleDeleteVendor = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await adminDeleteVendor({ vendorId: target.id });
      if (!res.ok) {
        if ("protectedByLedger" in res && res.protectedByLedger) {
          toast.warning("Store suspended instead", {
            description: res.error,
            duration: 8000,
          });
          setDeleteTarget(null);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to delete store");
        }
      } else {
        toast.success(res.message || `Store "${target.name}" deleted.`);
        setDeleteTarget(null);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        router.refresh();
      }
    });
  };

  const handleBulkStatus = (status: "active" | "suspended") => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const res = await adminBulkSetVendorStatus({ vendorIds: selectedIds, status });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`${status === "active" ? "Activated" : "Suspended"} ${res.count} ${res.count === 1 ? "store" : "stores"}`);
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const res = await adminBulkDeleteVendors({ vendorIds: selectedIds });
      if (!res.ok) toast.error(res.error);
      else {
        const parts = [];
        if (res.deletedCount > 0) parts.push(`${res.deletedCount} permanently deleted`);
        if (res.suspendedCount > 0) parts.push(`${res.suspendedCount} suspended (protected by financial ledger)`);
        toast.success(parts.length ? parts.join(", ") : "No stores changed");
        setBulkDeleteConfirmOpen(false);
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

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
        "Accepting Orders",
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
        r.vendor.acceptingOrders !== false ? "Yes" : "No",
        r.vendor.status,
        new Date(r.vendor.createdAt).toLocaleDateString("en-IN"),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-ink">{rows.length}</span> stores listed
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            filename="ruxs-vendors"
            title="Export CSV"
            getData={getExportData}
          />
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-ink px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="h-4 w-4" />
            <span>
              <strong className="text-white">{selectedIds.length}</strong> stores selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("active")}
              className="flex min-h-9 items-center gap-1.5 rounded-[10px] bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
            >
              <Power className="h-3.5 w-3.5" /> Activate
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("suspended")}
              className="flex min-h-9 items-center gap-1.5 rounded-[10px] bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
            >
              <PowerOff className="h-3.5 w-3.5" /> Suspend
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="flex min-h-9 items-center gap-1.5 rounded-[10px] bg-bad px-3 text-xs font-semibold text-white transition hover:bg-bad/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="min-h-9 rounded-[10px] px-2 text-xs text-white/80 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card List */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ vendor, products, customers }) => {
          const typeInfo = VENDOR_TYPE_INFO[toVendorType(vendor.vendorType, vendor.businessType)];
          const statusCfg = STATUS_CONFIG[vendor.status] ?? DEFAULT_STATUS_CONFIG;
          const isSelected = selectedIds.includes(vendor.id);

          return (
            <li
              key={vendor.id}
              className={
                "relative rounded-[16px] border bg-surface p-4 shadow-2xs transition " +
                (isSelected ? "border-ink bg-ink/5" : "border-line")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(vendor.id)}
                    aria-label={`Select ${vendor.name}`}
                    aria-pressed={isSelected}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-accent" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/vendors/${vendor.id}`}
                      className="truncate font-bold text-sm text-ink hover:underline"
                    >
                      {vendor.name}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {typeInfo.label} · {vendor.area}, {vendor.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize " +
                      statusCfg.badge
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + statusCfg.dot} />
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-[10px] bg-bg p-2.5 text-xs">
                <div>
                  <span className="text-muted">Catalog items:</span>{" "}
                  <strong className="font-mono text-ink">{products}</strong>
                </div>
                <div>
                  <span className="text-muted">Customers:</span>{" "}
                  <strong className="font-mono text-ink">{customers}</strong>
                </div>
                <div className="col-span-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted">Login ID:</span>
                  <span className="font-mono text-ink font-semibold">{vendor.loginId ?? "not set"}</span>
                </div>
              </div>

              {/* Mobile Quick Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5 text-xs">
                <Link
                  href={`/admin/vendors/${vendor.id}`}
                  className="flex min-h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2.5 font-semibold text-ink hover:bg-bg"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
                <Link
                  href={`/app/store/${vendor.slug}`}
                  target="_blank"
                  className="flex min-h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2.5 text-muted hover:text-ink hover:bg-bg"
                >
                  <Store className="h-3 w-3" /> Store <ExternalLink className="h-2.5 w-2.5" />
                </Link>
                <Link
                  href={`/merchant-panel/${vendor.slug}/today`}
                  target="_blank"
                  className="flex min-h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2.5 text-muted hover:text-ink hover:bg-bg"
                >
                  Panel <ExternalLink className="h-2.5 w-2.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(vendor.id, vendor.status)}
                  className="flex min-h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2.5 text-muted hover:text-ink"
                >
                  {vendor.status === "active" ? (
                    <>
                      <PowerOff className="h-3 w-3 text-bad" /> Suspend
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3 text-good" /> Activate
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(vendor)}
                  className="ml-auto flex min-h-9 items-center gap-1 rounded-[10px] border border-bad/20 bg-bad/5 px-2.5 font-semibold text-bad transition hover:bg-bad/10"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop High-Density Data Table */}
      <div className="hidden overflow-visible rounded-[16px] border border-line bg-surface md:block shadow-2xs">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  aria-label="Select all stores"
                  aria-pressed={allSelected}
                  className="rounded-[6px] text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-accent" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 font-bold text-ink">Store &amp; Location</th>
              <th className="px-3 py-3 font-semibold">Category &amp; Type</th>
              <th className="px-3 py-3 font-semibold">Merchant Access</th>
              <th className="px-3 py-3 text-right font-semibold">Items</th>
              <th className="px-3 py-3 text-right font-semibold">Customers</th>
              <th className="px-3 py-3 font-semibold">Orders</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ vendor, products, customers }) => {
              const typeInfo = VENDOR_TYPE_INFO[toVendorType(vendor.vendorType, vendor.businessType)];
              const statusCfg = STATUS_CONFIG[vendor.status] ?? DEFAULT_STATUS_CONFIG;
              const isSelected = selectedIds.includes(vendor.id);
              const isMenuOpen = activeMenuId === vendor.id;
              const accepting = vendor.acceptingOrders !== false;
              const storeUrl = `${APP_URL}/app/store/${vendor.slug}`;

              return (
                <tr
                  key={vendor.id}
                  className={
                    "transition-colors hover:bg-bg/50 " +
                    (isSelected ? "bg-accent/5 hover:bg-accent/10" : "")
                  }
                >
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(vendor.id)}
                      aria-label={`Select ${vendor.name}`}
                      aria-pressed={isSelected}
                      className="rounded-[6px] text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-accent" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* Store Name, Slug & Phone */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-bg border border-line text-sm font-bold text-ink">
                        {vendor.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/vendors/${vendor.id}`}
                          className="font-bold text-ink hover:underline truncate block"
                        >
                          {vendor.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="font-mono text-[11px] text-muted">{vendor.phone}</span>
                          <span>·</span>
                          <span className="truncate">{vendor.area}, {vendor.city}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Type */}
                  <td className="px-3 py-3.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <AppIcon name={vendor.vendorType} className="h-4 w-4 text-muted" />
                      <span className="font-semibold text-ink">{typeInfo.label}</span>
                    </div>
                    <span className="text-[11px] text-muted capitalize">
                      {vendor.businessType}
                    </span>
                  </td>

                  {/* Merchant Access */}
                  <td className="px-3 py-3.5 text-xs">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {vendor.loginId ? (
                        <span className="font-semibold text-ink">{vendor.loginId}</span>
                      ) : (
                        <span className="text-warn font-medium">not configured</span>
                      )}
                      {vendor.loginId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(vendor.loginId!, `login-${vendor.id}`, "Login ID")}
                          className="rounded-[4px] text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                          aria-label={`Copy login ID for ${vendor.name}`}
                          title="Copy login ID"
                        >
                          {copiedKey === `login-${vendor.id}` ? (
                            <Check className="h-3 w-3 text-good" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateCredentials(vendor.id, vendor.name, !!vendor.loginId)}
                      className="mt-0.5 text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="h-3 w-3" /> Reset password
                    </button>
                  </td>

                  {/* Products */}
                  <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink font-semibold">
                    {products}
                  </td>

                  {/* Customers */}
                  <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink font-semibold">
                    {customers}
                  </td>

                  {/* Orders toggle */}
                  <td className="px-3 py-3.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleOrders(vendor.id, accepting)}
                      title={accepting ? "Pause orders" : "Resume orders"}
                      aria-label={accepting ? `Orders open for ${vendor.name}. Pause orders` : `Orders paused for ${vendor.name}. Resume orders`}
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition " +
                        (accepting
                          ? "bg-good/10 text-good hover:bg-good/20"
                          : "bg-muted/10 text-muted hover:bg-muted/20") +
                        " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      }
                    >
                      <ShoppingBag className="h-3 w-3" />
                      {accepting ? "Open" : "Paused"}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize " +
                        statusCfg.badge
                      }
                    >
                      <span className={"h-1.5 w-1.5 rounded-full " + statusCfg.dot} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Actions & More Menu */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="relative inline-flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/vendors/${vendor.id}`}
                        className="flex h-8 items-center rounded-[8px] border border-line bg-surface px-2.5 text-xs font-semibold text-ink transition hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Edit
                      </Link>

                      {/* Dropdown Menu Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : vendor.id)
                        }
                        aria-label={`More options for ${vendor.name}`}
                        aria-expanded={isMenuOpen}
                        aria-controls={isMenuOpen ? `vendor-menu-${vendor.id}` : undefined}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line text-muted transition hover:bg-bg hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Menu Popover */}
                      {isMenuOpen && (
                        <>
                          <div
                            aria-hidden="true"
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div
                            id={`vendor-menu-${vendor.id}`}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setActiveMenuId(null);
                            }}
                            className="absolute right-0 top-full z-50 mt-1 w-56 rounded-[12px] border border-line bg-surface p-1.5 text-left text-xs shadow-lg"
                          >
                            <Link
                              href={`/admin/vendors/${vendor.id}`}
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium focus-visible:bg-bg focus-visible:outline-none"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted" /> Edit details
                            </Link>

                            <Link
                              href={`/app/store/${vendor.slug}`}
                              target="_blank"
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium focus-visible:bg-bg focus-visible:outline-none"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <Store className="h-3.5 w-3.5 text-muted" /> View storefront <ExternalLink className="h-3 w-3 ml-auto text-muted" />
                            </Link>

                            <Link
                              href={`/merchant-panel/${vendor.slug}/today`}
                              target="_blank"
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium focus-visible:bg-bg focus-visible:outline-none"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted" /> Open merchant panel
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                copyToClipboard(storeUrl, `store-${vendor.id}`, "Storefront link");
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left focus-visible:bg-bg focus-visible:outline-none"
                            >
                              <Copy className="h-3.5 w-3.5 text-muted" /> Copy storefront link
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleToggleOrders(vendor.id, accepting);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left focus-visible:bg-bg focus-visible:outline-none"
                            >
                              <ShoppingBag className="h-3.5 w-3.5 text-muted" />
                              {accepting ? "Pause orders" : "Resume orders"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleToggleStatus(vendor.id, vendor.status);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left focus-visible:bg-bg focus-visible:outline-none"
                            >
                              {vendor.status === "active" ? (
                                <>
                                  <PowerOff className="h-3.5 w-3.5 text-bad" /> Suspend store
                                </>
                              ) : (
                                <>
                                  <Power className="h-3.5 w-3.5 text-good" /> Activate store
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-line" />

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(vendor);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left font-semibold text-bad hover:bg-bad/10 focus-visible:bg-bad/10 focus-visible:outline-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete store…
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Single vendor delete */}
      <AdminDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        busy={isPending}
        icon={<Trash2 className="h-5 w-5" />}
        title={<>Delete &ldquo;{deleteTarget?.name}&rdquo;?</>}
        description="Permanent for test stores; a safe suspension for stores with money history."
      >
        <ul className="list-disc space-y-1.5 rounded-[12px] bg-bg py-3 pl-8 pr-3.5 text-sm text-muted">
          <li>A store with no ledger history is deleted with its catalog items and login.</li>
          <li>A store with ledger history is suspended and paused instead, so accounting records stay intact.</li>
        </ul>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button type="button" disabled={isPending} onClick={() => setDeleteTarget(null)} className={buttonClass("secondary", "sm")}>
            Cancel
          </button>
          <button type="button" disabled={isPending} onClick={handleDeleteVendor} className={"inline-flex min-h-10 select-none items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-bad hover:bg-bad/90"}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-3.5 w-3.5" />}
            {isPending ? "Deleting…" : "Delete store"}
          </button>
        </div>
      </AdminDialog>

      {/* Bulk delete */}
      <AdminDialog
        open={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        busy={isPending}
        icon={<AlertTriangle className="h-5 w-5" />}
        title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? "store" : "stores"}?`}
        description="This can't be undone for stores that get deleted."
      >
        <p className="text-sm text-muted">
          Stores with no ledger history are deleted permanently. Stores with ledger history are suspended and paused instead.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button type="button" disabled={isPending} onClick={() => setBulkDeleteConfirmOpen(false)} className={buttonClass("secondary", "sm")}>
            Cancel
          </button>
          <button type="button" disabled={isPending} onClick={handleBulkDelete} className={"inline-flex min-h-10 select-none items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-bad hover:bg-bad/90"}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-3.5 w-3.5" />}
            {isPending ? "Deleting…" : "Delete stores"}
          </button>
        </div>
      </AdminDialog>

      {/* Fresh credentials */}
      <AdminDialog
        open={credentialsModal !== null}
        onClose={() => setCredentialsModal(null)}
        tone="accent"
        icon={<KeyRound className="h-5 w-5" />}
        title={`Login for ${credentialsModal?.vendorName ?? ""}`}
        description="Copy these now. The password is not shown again."
      >
        {credentialsModal && (
          <>
            <dl className="space-y-3 rounded-[12px] border border-line bg-bg p-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Login ID</dt>
                <dd className="mt-0.5 flex items-center justify-between gap-2 font-mono font-semibold text-ink">
                  <span className="break-all">{credentialsModal.loginId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.loginId, "cred-login", "Login ID")}
                    aria-label="Copy login ID"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {copiedKey === "cred-login" ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
              <div className="border-t border-line pt-3">
                <dt className="text-xs text-muted">Password (shown once)</dt>
                <dd className="mt-0.5 flex items-center justify-between gap-2 font-mono font-semibold text-ink">
                  <span className="select-all break-all">{credentialsModal.password}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.password, "cred-pass", "Password")}
                    aria-label="Copy password"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {copiedKey === "cred-pass" ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
              <div className="border-t border-line pt-3">
                <dt className="text-xs text-muted">Sign-in link</dt>
                <dd className="mt-0.5 flex items-center justify-between gap-2 font-mono text-xs text-muted">
                  <span className="break-all">{credentialsModal.loginUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.loginUrl, "cred-url", "Sign-in link")}
                    aria-label="Copy sign-in link"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {copiedKey === "cred-url" ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCredentialsModal(null)} className={buttonClass("secondary", "sm")}>
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = `RUXs merchant login\nStore: ${credentialsModal.vendorName}\nLogin ID: ${credentialsModal.loginId}\nPassword: ${credentialsModal.password}\nLogin page: ${credentialsModal.loginUrl}`;
                  copyToClipboard(text, "cred-all", "Login details");
                }}
                className={buttonClass("primary", "sm")}
              >
                <Copy className="h-3.5 w-3.5" /> Copy all details
              </button>
            </div>
          </>
        )}
      </AdminDialog>
    </div>
  );
}
