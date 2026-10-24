"use client";

import { AppIcon } from "@/components/ui/app-icon";

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
import { VENDOR_TYPE_INFO, toVendorType } from "@/core/vendor-types";
import {
  adminBulkDeleteVendors,
  adminBulkSetVendorStatus,
  adminDeleteVendor,
  adminGenerateCredentials,
  adminSetVendorStatus,
  adminToggleAcceptingOrders,
} from "@/features/admin/actions";
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
  badge: "border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  dot: "bg-amber-500",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Active",
    badge: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  pending: DEFAULT_STATUS_CONFIG,
  suspended: {
    label: "Suspended",
    badge: "border-rose-600/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
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

  const handleGenerateCredentials = (vendorId: string, vendorName: string) => {
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
        toast.success(`Updated ${res.count} stores to ${status}`);
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
        toast.success(`Bulk action complete: ${parts.join(", ") || "No changes"}`);
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
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-ink/20 bg-ink px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="h-4 w-4 text-accent" />
            <span>
              <strong className="text-white">{selectedIds.length}</strong> stores selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("active")}
              className="flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition disabled:opacity-50"
            >
              <Power className="h-3.5 w-3.5 text-emerald-400" /> Activate
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus("suspended")}
              className="flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition disabled:opacity-50"
            >
              <PowerOff className="h-3.5 w-3.5 text-rose-400" /> Suspend
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-[8px] px-2 py-1.5 text-xs text-white/70 hover:text-white transition"
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
                    className="text-muted hover:text-ink"
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
                  className="flex items-center gap-1 rounded-[8px] border border-line bg-surface px-2.5 py-1 font-semibold text-ink hover:bg-bg"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
                <Link
                  href={`/app/store/${vendor.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-[8px] border border-line bg-surface px-2.5 py-1 text-muted hover:text-ink hover:bg-bg"
                >
                  <Store className="h-3 w-3" /> Store <ExternalLink className="h-2.5 w-2.5" />
                </Link>
                <Link
                  href={`/merchant-panel/${vendor.slug}/today`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-[8px] border border-line bg-surface px-2.5 py-1 text-muted hover:text-ink hover:bg-bg"
                >
                  Panel <ExternalLink className="h-2.5 w-2.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(vendor.id, vendor.status)}
                  className="flex items-center gap-1 rounded-[8px] border border-line bg-surface px-2 py-1 text-[11px] text-muted hover:text-ink"
                >
                  {vendor.status === "active" ? (
                    <>
                      <PowerOff className="h-3 w-3 text-rose-500" /> Suspend
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3 text-emerald-500" /> Activate
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(vendor)}
                  className="ml-auto flex items-center gap-1 rounded-[8px] border border-bad/30 bg-bad/5 px-2 py-1 text-[11px] font-bold text-bad hover:bg-bad hover:text-white transition"
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
                  className="text-muted hover:text-ink"
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
              const storeUrl = `https://ruxs.in/app/store/${vendor.slug}`;

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
                      className="text-muted hover:text-ink"
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
                          className="text-muted hover:text-ink"
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
                      onClick={() => handleGenerateCredentials(vendor.id, vendor.name)}
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
                      title={accepting ? "Click to pause orders" : "Click to open orders"}
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition " +
                        (accepting
                          ? "bg-good/15 text-good hover:bg-good/25"
                          : "bg-muted/15 text-muted hover:bg-muted/25")
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
                        className="rounded-[8px] border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-bg transition"
                      >
                        Edit
                      </Link>

                      {/* Dropdown Menu Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : vendor.id)
                        }
                        aria-label="More store options"
                        aria-expanded={isMenuOpen}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-line text-muted hover:text-ink hover:bg-bg transition"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Menu Popover */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-1 w-52 rounded-[14px] border border-line bg-surface p-1.5 shadow-xl text-left text-xs animate-in fade-in zoom-in-95"
                          >
                            <Link
                              href={`/admin/vendors/${vendor.id}`}
                              role="menuitem"
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted" /> Edit Details &amp; Settings
                            </Link>

                            <Link
                              href={`/app/store/${vendor.slug}`}
                              target="_blank"
                              role="menuitem"
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <Store className="h-3.5 w-3.5 text-muted" /> View Public Storefront <ExternalLink className="h-3 w-3 ml-auto text-muted" />
                            </Link>

                            <Link
                              href={`/merchant-panel/${vendor.slug}/today`}
                              target="_blank"
                              role="menuitem"
                              className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted" /> Open Merchant Panel
                            </Link>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                copyToClipboard(storeUrl, `store-${vendor.id}`, "Storefront link");
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left"
                            >
                              <Copy className="h-3.5 w-3.5 text-muted" /> Copy Storefront URL
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                handleToggleOrders(vendor.id, accepting);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left"
                            >
                              <ShoppingBag className="h-3.5 w-3.5 text-muted" />
                              {accepting ? "Pause Orders" : "Resume Orders"}
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                handleToggleStatus(vendor.id, vendor.status);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-ink hover:bg-bg font-medium text-left"
                            >
                              {vendor.status === "active" ? (
                                <>
                                  <PowerOff className="h-3.5 w-3.5 text-rose-500" /> Suspend Store
                                </>
                              ) : (
                                <>
                                  <Power className="h-3.5 w-3.5 text-emerald-500" /> Activate Store
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-line" />

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setDeleteTarget(vendor);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 font-bold text-bad hover:bg-bad/10 text-left"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Store…
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

      {/* Single Vendor Delete Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-[18px] border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">
                  Delete &ldquo;{deleteTarget.name}&rdquo;?
                </h4>
                <p className="text-xs text-muted">Confirm store deletion or safe suspension</p>
              </div>
            </div>

            <div className="rounded-[12px] bg-bg p-3.5 text-xs text-muted space-y-2">
              <p>
                • Clean/test stores without ledger transactions will be permanently deleted from the database along with catalog items and logins.
              </p>
              <p>
                • Stores with immutable financial ledger history will be immediately deactivated and suspended instead to preserve legal accounting records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-[10px] border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-bg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteVendor}
                className="flex items-center gap-1.5 rounded-[10px] bg-bad px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-bad/90 transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-[18px] border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">
                  Delete {selectedIds.length} stores?
                </h4>
                <p className="text-xs text-muted">Bulk operation confirmation</p>
              </div>
            </div>

            <p className="text-xs text-muted">
              Unused or onboarding stores will be permanently wiped. Any stores with permanent financial ledger records will be automatically suspended and deactivated instead.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setBulkDeleteConfirmOpen(false)}
                className="rounded-[10px] border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-bg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-[10px] bg-bad px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-bad/90 transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Bulk Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fresh Credentials Modal */}
      {credentialsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-[18px] border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">
                  Credentials for {credentialsModal.vendorName}
                </h4>
                <p className="text-xs text-muted">Share these with the merchant securely</p>
              </div>
            </div>

            <div className="rounded-[14px] bg-bg p-4 space-y-3 text-xs border border-line">
              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wide">Login ID</span>
                <div className="flex items-center justify-between font-mono font-bold text-sm text-ink mt-0.5">
                  <span>{credentialsModal.loginId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.loginId, "cred-login", "Login ID")}
                    className="text-muted hover:text-ink"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-2">
                <span className="text-muted block text-[11px] uppercase tracking-wide">Password (Shown Once)</span>
                <div className="flex items-center justify-between font-mono font-bold text-sm text-ink mt-0.5">
                  <span className="bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded text-ink select-all">
                    {credentialsModal.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.password, "cred-pass", "Password")}
                    className="text-muted hover:text-ink"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-2">
                <span className="text-muted block text-[11px] uppercase tracking-wide">Sign-in Link</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-muted truncate mt-0.5">
                  <span className="truncate">{credentialsModal.loginUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialsModal.loginUrl, "cred-url", "Sign-in URL")}
                    className="text-muted hover:text-ink shrink-0 ml-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `RUXs Merchant Login\nStore: ${credentialsModal.vendorName}\nLogin ID: ${credentialsModal.loginId}\nPassword: ${credentialsModal.password}\nLogin URL: ${credentialsModal.loginUrl}`;
                  copyToClipboard(text, "cred-all", "All credentials");
                }}
                className="rounded-[10px] bg-accent px-4 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-95 transition"
              >
                Copy All Details
              </button>
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="rounded-[10px] border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-bg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
