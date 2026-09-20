"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle, ArrowUpRight, BarChart3, CheckCircle2, ChevronRight, Copy, Database, ExternalLink, Gavel, Lock, RefreshCw, ShieldCheck, Store, UsersRound, WalletCards } from "lucide-react";
import { formatINR, Paise } from "@/src/shared/types/money";
import { RuxsAdminSkeleton, RuxsPageLoading } from "@/components/ui/LoadingState";

interface AdminOverview {
  totalVendors: number;
  verifiedVendors: number;
  pendingVendors: number;
  suspendedVendors: number;
  totalHouseholds: number;
  todayDeliveriesCount: number;
  deliveredCount: number;
  inPrepCount: number;
  skippedCount: number;
  openDisputesCount: number;
  totalAssetHoldingsCount: number;
  monthlyGmvPaise: number;
  dbConnected: boolean;
  serviceDate: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  phone: string;
  vendorType?: "MILKMAN" | "WATER_SERVICE" | "TIFFIN";
  serviceCategories: string[];
  coveredSocieties: string[];
  status: "PENDING_VERIFICATION" | "PENDING_APPROVAL" | "VERIFIED" | "SUSPENDED";
  tier: "STARTER" | "GROWTH" | "PRO";
  subscriberCount: number;
  monthlyVolumePaise: number;
  credentials?: { loginToken: string; accessPin: string; directUrl: string };
  createdAt: string;
}

interface Household {
  id: string;
  name: string;
  societyName: string;
  towerWing: string;
  floor: string | number;
  flatNumber: string;
  city: string;
  members: { id: string; name: string; phone: string; role: string; userId?: string }[];
  khataBalancePaise: number;
  activeSubscriptionsCount: number;
}

interface Fulfillment {
  id: string;
  tenantId: string;
  subscriptionId: string;
  customerId: string;
  serviceDate: string;
  shift: string;
  status: string;
  items: { productId: string; productName: string; quantity: number; unitPricePaise: number; totalPricePaise: number }[];
  totalPricePaise: number;
  cutoffTime: string;
  deliveredAt?: string;
  notes?: string;
}

interface Dispute {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  fulfillmentId: string;
  reason: string;
  disputedAmountPaise: number;
  evidence: { customerComment?: string; driverDeliveredAt?: string; driverDropNotes?: string };
  status: "OPEN" | "REFUNDED" | "REJECTED";
  createdAt: string;
}

interface AssetHolding {
  tenantId: string;
  customerId: string;
  assetType: string;
  holdingCount: number;
  depositPerUnitPaise: number;
  totalDepositHeldPaise: number;
}

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

interface KitchenBatches {
  totalScheduled: number;
  totalConfirmed: number;
  totalInPrep: number;
  totalDelivered: number;
  totalSkipped: number;
  skuBreakdown: Record<string, { productName: string; quantity: number; totalPaise: number }>;
}

export default function AdminClient() {
  const router = useRouter();
  const user = useUser();
  const hexclaveApp = useHexclaveApp();

  const isSuperAdmin = Boolean(
    user && (user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com")
  );

  const [activeTab, setActiveTab] = useState<
    "overview" | "vendors" | "households" | "fulfillments" | "kitchen" | "assets" | "disputes" | "audit"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [assetHoldings, setAssetHoldings] = useState<AssetHolding[]>([]);
  const [kitchenBatches, setKitchenBatches] = useState<KitchenBatches | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals & Inline forms state
  const [newVendorForm, setNewVendorForm] = useState({
    businessName: "",
    phone: "",
    vendorType: "TIFFIN" as "MILKMAN" | "WATER_SERVICE" | "TIFFIN",
    serviceCategories: "TIFFIN",
    locality: "HSR Layout Sector 2",
    coveredSocieties: "Sobha Classic, Purva Fairmont",
    tier: "STARTER" as "STARTER" | "GROWTH" | "PRO",
  });
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);

  const [khataForm, setKhataForm] = useState({
    customerId: "usr_priya",
    direction: "CREDIT" as "CREDIT" | "DEBIT",
    amountRupees: 200,
    notes: "Manual UPI payment settlement",
  });
  const [showKhataModal, setShowKhataModal] = useState(false);

  const [exchangeForm, setExchangeForm] = useState({
    customerId: "usr_priya",
    assetType: "WATER_JAR_20L",
    delivered: 2,
    collected: 2,
  });
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/data");
      const json = (await res.json()) as any;
      if (json.success && json.data) {
        setOverview(json.data.overview);
        setVendors(json.data.vendors);
        setHouseholds(json.data.households);
        setFulfillments(json.data.fulfillments);
        setDisputes(json.data.disputes);
        setAssetHoldings(json.data.assetHoldings);
        setKitchenBatches(json.data.kitchenBatches);
        setAuditLogs(json.data.auditLogs);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setFeedback({ message: "Failed to connect to platform API", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const executeAction = async (action: string, payload: any) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Action failed");
      }
      setFeedback({ message: data.data?.message || "Action completed successfully", type: "success" });
      await fetchDashboard();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to execute administrative action", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyVendor = (vendorId: string) => {
    executeAction("VERIFY_VENDOR", { vendorId });
  };

  const handleSuspendVendor = (vendorId: string) => {
    const reason = prompt("Enter suspension reason (e.g. hygiene failure, unaddressed disputes):");
    if (!reason) return;
    executeAction("SUSPEND_VENDOR", { vendorId, reason });
  };

  const handleReactivateVendor = (vendorId: string) => {
    executeAction("REACTIVATE_VENDOR", { vendorId });
  };

  const handleTierChange = (vendorId: string, tier: "STARTER" | "GROWTH" | "PRO") => {
    executeAction("CHANGE_TIER", { vendorId, tier });
  };

  const handleCopyCreds = (vendor: Vendor) => {
    const creds = vendor.credentials;
    const typeEmoji = vendor.vendorType === "MILKMAN" ? "🥛" : vendor.vendorType === "WATER_SERVICE" ? "💧" : "🍱";
    const directUrl = creds?.directUrl || `https://ruxs.in/login?vendorToken=vtok_${vendor.slug}&slug=${vendor.slug}`;
    const pin = creds?.accessPin || "849201";
    const text = `${typeEmoji} RUXS Merchant Access: ${vendor.businessName}
Your merchant operations cockpit is live.
Direct Login: ${directUrl}
Access PIN: ${pin}
Manage society deliveries, daily cutoffs, and digital khata.`;

    navigator.clipboard.writeText(text);
    setFeedback({ message: `Copied WhatsApp login card for '${vendor.businessName}'!`, type: "success" });
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROVISION_DIRECT",
          adminUser: { userId: user?.id || "usr_admin", email: user?.primaryEmail || "sh20raj@gmail.com" },
          directProvision: {
            businessName: newVendorForm.businessName,
            phone: newVendorForm.phone,
            vendorType: newVendorForm.vendorType,
            locality: newVendorForm.locality,
            coveredSocieties: newVendorForm.coveredSocieties.split(",").map((s) => s.trim()),
            tier: newVendorForm.tier,
          },
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to provision vendor");
      }
      setFeedback({
        message: `Vendor '${newVendorForm.businessName}' authorized and auto-approved! Direct credentials created.`,
        type: "success",
      });
      setShowNewVendorModal(false);
      setNewVendorForm({
        businessName: "",
        phone: "",
        vendorType: "TIFFIN",
        serviceCategories: "TIFFIN",
        locality: "HSR Layout Sector 2",
        coveredSocieties: "Sobha Classic, Purva Fairmont",
        tier: "STARTER",
      });
      await fetchDashboard();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to provision vendor", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerOvernight = () => {
    if (confirm("Trigger overnight fulfillment generator for all active household subscriptions?")) {
      executeAction("TRIGGER_OVERNIGHT", { serviceDate: overview?.serviceDate });
    }
  };

  const handleLockCutoff = () => {
    if (confirm("Force lock expired cutoffs and freeze kitchen cooking batch counts?")) {
      executeAction("LOCK_CUTOFF", { tenantId: "ten_sharma_tiffin", serviceDate: overview?.serviceDate });
    }
  };

  const handleTransitionFulfillment = (fulfillmentId: string, toStatus: string) => {
    executeAction("TRANSITION_FULFILLMENT", { fulfillmentId, toStatus });
  };

  const handleResolveDispute = (disputeId: string, decision: "FULL_REFUND" | "UPHELD_NO_REFUND", amountPaise: number) => {
    executeAction("RESOLVE_DISPUTE", {
      disputeId,
      decision,
      refundPaise: decision === "FULL_REFUND" ? amountPaise : 0,
      resolutionNotes: decision === "FULL_REFUND" ? "Approved full compensating refund to customer digital khata" : "Dispute dismissed after verification",
    });
  };

  const handleAddKhata = (e: React.FormEvent) => {
    e.preventDefault();
    executeAction("ADD_KHATA_ENTRY", {
      customerId: khataForm.customerId,
      direction: khataForm.direction,
      amountPaise: Math.round(khataForm.amountRupees * 100),
      notes: khataForm.notes,
    });
    setShowKhataModal(false);
  };

  const handleAssetExchange = (e: React.FormEvent) => {
    e.preventDefault();
    executeAction("RECORD_ASSET_EXCHANGE", {
      customerId: exchangeForm.customerId,
      assetType: exchangeForm.assetType,
      quantityDelivered: Number(exchangeForm.delivered),
      quantityCollected: Number(exchangeForm.collected),
    });
    setShowExchangeModal(false);
  };

  const handleDispatchNotification = () => {
    executeAction("DISPATCH_NOTIFICATION", {
      phone: "+919876543212",
      name: "Priya Sharma",
      channel: "WHATSAPP",
      templateType: "MORNING_POLL",
    });
  };

  if (loading && !overview) {
    return <RuxsAdminSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border bg-card shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Lock className="w-7 h-7" />
          </div>
          <CardHeader className="p-0 space-y-1.5">
            <Badge variant="outline" className="mx-auto uppercase tracking-wider text-[10px] border-primary/30 text-primary">
              Mission Control Security
            </Badge>
            <CardTitle className="text-xl font-bold text-foreground">Platform Admin Restricted</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access to the RUXS Platform Control Cockpit is strictly restricted to <span className="font-mono text-primary font-semibold">sh20raj@gmail.com</span>. Please authenticate with Hexclave.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-2">
            <Button
              className="w-full font-semibold text-xs h-11"
              onClick={() => {
                window.location.href = "/login?redirect=/admin";
              }}
            >
              Sign In with Hexclave (sh20raj@gmail.com)
            </Button>
            <Link
              href="/"
              className="inline-block text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              ← Return to Consumer Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/40 bg-card shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="w-7 h-7" />
          </div>
          <CardHeader className="p-0 space-y-1.5">
            <Badge variant="destructive" className="mx-auto uppercase tracking-wider text-[10px]">
              403 Access Forbidden
            </Badge>
            <CardTitle className="text-xl font-bold text-foreground">Unauthorized Account</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This console is exclusively restricted to <strong className="font-mono text-primary">sh20raj@gmail.com</strong>.
            </p>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground mt-2 font-mono">
              Signed in as: <span className="text-foreground font-medium">{user.primaryEmail || (user as any).email || user.id}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-2">
            <Button
              variant="outline"
              className="w-full text-xs h-10 border-border"
              onClick={async () => {
                await hexclaveApp.signOut();
                window.location.href = "/login?redirect=/admin";
              }}
            >
              Sign Out & Switch to sh20raj@gmail.com
            </Button>
            <Link
              href="/"
              className="inline-block text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              ← Return to Consumer Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[0.08] bg-[#0d100e] lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e24a3b] text-sm font-black text-white">R</div>
          <div>
            <p className="text-sm font-semibold">RUXS</p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-subtle">Platform control</p>
          </div>
        </div>

        <div className="px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Workspace</p>
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "vendors", label: "Vendors", icon: Store },
              { id: "households", label: "Households", icon: UsersRound },
              { id: "fulfillments", label: "Fulfillments", icon: ArrowUpRight },
              { id: "kitchen", label: "Kitchen", icon: Database },
              { id: "assets", label: "Assets", icon: WalletCards },
              { id: "disputes", label: "Disputes", icon: Gavel },
              { id: "audit", label: "Audit log", icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={activeTab === tab.id
                  ? "flex w-full items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-left text-xs font-semibold text-primary"
                  : "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === "disputes" && overview?.openDisputesCount ? (
                  <span className="ml-auto rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-300">{overview.openDisputesCount}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/[0.08] p-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Platform data</p>
                <p className="text-[10px] text-muted-foreground">{overview?.dbConnected ? "Connected" : "Unavailable"}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await hexclaveApp.signOut();
              router.push("/login");
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090b0a]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Platform control center</p>
              <h1 className="mt-1 text-sm font-semibold sm:text-base">
                {activeTab === "overview" ? "Overview" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboard}
                disabled={actionLoading}
                className="h-9 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs"
              >
                <RefreshCw className={actionLoading ? "mr-2 h-3.5 w-3.5 animate-spin" : "mr-2 h-3.5 w-3.5"} />
                Refresh
              </Button>
              <Link href="/" className="hidden h-9 items-center rounded-xl border border-white/[0.1] px-3 text-xs text-muted-foreground hover:bg-white/[0.03] hover:text-foreground sm:flex">
                Home
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {feedback && (
            <div className={feedback.type === "success"
              ? "mb-5 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-primary"
              : "mb-5 flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive"}
            >
              <span>{feedback.message}</span>
              <button type="button" onClick={() => setFeedback(null)} className="text-current opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
            {[
              ["Vendors", overview ? String(overview.verifiedVendors) + "/" + String(overview.totalVendors) : "—", overview ? String(overview.pendingVendors) + " pending" : "—"],
              ["Households", String(overview?.totalHouseholds || 0), "active records"],
              ["Today", String(overview?.todayDeliveriesCount || 0), String(overview?.deliveredCount || 0) + " delivered"],
              ["Disputes", String(overview?.openDisputesCount || 0), "open cases"],
              ["GMV", overview ? formatINR((overview.monthlyGmvPaise || 0) as Paise) : "₹0", "current window"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
                <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
                <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[10px] text-subtle">{detail}</p>
              </div>
            ))}
          </section>

          <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1">
            {[
              ["overview", "Overview"],
              ["vendors", "Vendors"],
              ["households", "Households"],
              ["fulfillments", "Fulfillments"],
              ["kitchen", "Kitchen"],
              ["assets", "Assets"],
              ["disputes", "Disputes"],
              ["audit", "Audit"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as any)}
                className={activeTab === id
                  ? "rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground"
                  : "rounded-xl px-3 py-2 text-[11px] font-medium text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <section className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.08),transparent_34%),rgba(16,20,18,0.76)] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Global oversight</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Run the platform, not the tabs.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Vendor review, household activity, delivery state, kitchen demand, disputes and the audit trail are one controlled workflow.
                </p>

                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleTriggerOvernight}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.04]"
                  >
                    <p className="text-xs font-semibold">Generate overnight fulfillment</p>
                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Create daily snapshots for active recurring subscriptions.</p>
                    <span className="mt-3 inline-flex text-[10px] font-semibold text-primary">Run engine <ChevronRight className="ml-1 h-3.5 w-3.5" /></span>
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleLockCutoff}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.04]"
                  >
                    <p className="text-xs font-semibold">Lock expired cutoffs</p>
                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Freeze kitchen quantities after the operational window.</p>
                    <span className="mt-3 inline-flex text-[10px] font-semibold text-primary">Lock batches <ChevronRight className="ml-1 h-3.5 w-3.5" /></span>
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Attention</p>
                <h2 className="mt-3 text-xl font-semibold">Open disputes</h2>
                <div className="mt-5 space-y-2">
                  {disputes.filter((item) => item.status === "OPEN").slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab("disputes")}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3 text-left hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{item.customerName}</p>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.reason}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-primary">{formatINR(item.disputedAmountPaise as Paise)}</span>
                    </button>
                  ))}
                  {disputes.filter((item) => item.status === "OPEN").length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-xs text-muted-foreground">No open disputes.</div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "vendors" && (
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Network</p>
                  <h2 className="mt-2 text-xl font-semibold">Vendor operations</h2>
                </div>
                <Button size="sm" className="h-9 rounded-xl text-xs" onClick={() => setShowNewVendorModal(true)}>Add vendor</Button>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {vendors.map((vendor) => {
                  const isPending = vendor.status === "PENDING_VERIFICATION" || vendor.status === "PENDING_APPROVAL";
                  const typeLabel =
                    vendor.vendorType === "MILKMAN"
                      ? "🥛 Milkman"
                      : vendor.vendorType === "WATER_SERVICE"
                      ? "💧 Water Service"
                      : "🍱 Tiffin Service";

                  return (
                    <div key={vendor.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.35fr_.7fr_.7fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/${vendor.slug}`}
                            className="group flex items-center gap-1.5 truncate text-sm font-semibold hover:text-primary transition"
                          >
                            <span className="truncate">{vendor.businessName}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-70 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                          </Link>
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                            {typeLabel}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                              vendor.status === "VERIFIED"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : isPending
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {vendor.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {vendor.serviceCategories.join(" · ")} · {vendor.coveredSocieties.join(", ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold">{vendor.subscriberCount} subscribers</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatINR(vendor.monthlyVolumePaise as Paise)}</p>
                      </div>

                      <select
                        value={vendor.tier}
                        onChange={(event) => handleTierChange(vendor.id, event.target.value as any)}
                        className="h-9 rounded-xl border border-white/[0.1] bg-white/[0.02] px-3 text-xs"
                      >
                        <option value="STARTER">Starter</option>
                        <option value="GROWTH">Growth</option>
                        <option value="PRO">Pro</option>
                      </select>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {isPending && (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                            onClick={() => handleVerifyVendor(vendor.id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg border-white/[0.1] text-[10px]"
                          onClick={() => handleCopyCreds(vendor)}
                          title="Copy WhatsApp merchant login credentials"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Creds
                        </Button>
                        <Link
                          href={`/admin/${vendor.slug}`}
                          className="inline-flex h-8 items-center rounded-lg border border-white/[0.1] bg-white/[0.02] px-2.5 text-[10px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Dossier
                        </Link>
                        {vendor.status === "VERIFIED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-white/[0.1] text-[10px] text-rose-400 hover:text-rose-300"
                            onClick={() => handleSuspendVendor(vendor.id)}
                          >
                            Suspend
                          </Button>
                        )}
                        {vendor.status === "SUSPENDED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-white/[0.1] text-[10px] text-emerald-400"
                            onClick={() => handleReactivateVendor(vendor.id)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {vendors.length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No vendor records.</div>}
              </div>
            </section>
          )}

          {activeTab === "households" && (
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="border-b border-white/[0.08] px-5 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Household network</p>
                <h2 className="mt-2 text-xl font-semibold">Households</h2>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {households.map((household) => (
                  <div key={household.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1.4fr_.7fr_.7fr] md:items-center">
                    <div>
                      <p className="text-sm font-semibold">{household.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{household.societyName} · {household.towerWing} · {household.flatNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{household.activeSubscriptionsCount} active</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{household.members.length} members</p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs font-semibold text-primary">{formatINR(household.khataBalancePaise as Paise)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Khata</p>
                    </div>
                  </div>
                ))}
                {households.length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No household records.</div>}
              </div>
            </section>
          )}

          {activeTab === "fulfillments" && (
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="border-b border-white/[0.08] px-5 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Daily flow</p>
                <h2 className="mt-2 text-xl font-semibold">Fulfillments</h2>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {fulfillments.map((item) => (
                  <div key={item.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_.6fr_.6fr_auto] lg:items-center">
                    <div>
                      <p className="text-sm font-semibold">{item.items?.[0]?.productName || "Recurring service"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.serviceDate} · {item.shift} · {item.customerId}</p>
                    </div>
                    <span className="w-fit rounded-full border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[9px] font-semibold text-muted-foreground">{item.status.replaceAll("_", " ")}</span>
                    <div>
                      <p className="text-xs font-semibold">{formatINR(item.totalPricePaise as Paise)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Cutoff {item.cutoffTime}</p>
                    </div>
                    <select
                      value={item.status}
                      onChange={(event) => handleTransitionFulfillment(item.id, event.target.value)}
                      className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.02] px-2 text-[10px]"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="IN_PREPARATION">In preparation</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="SKIPPED">Skipped</option>
                    </select>
                  </div>
                ))}
                {fulfillments.length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No fulfillment records.</div>}
              </div>
            </section>
          )}

          {activeTab === "kitchen" && (
            <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Production snapshot</p>
                <h2 className="mt-2 text-xl font-semibold">Kitchen batch</h2>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Scheduled", kitchenBatches?.totalScheduled || 0],
                    ["Confirmed", kitchenBatches?.totalConfirmed || 0],
                    ["In prep", kitchenBatches?.totalInPrep || 0],
                    ["Delivered", kitchenBatches?.totalDelivered || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/[0.07] p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</p>
                      <p className="mt-3 text-xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">SKU mix</p>
                <h2 className="mt-2 text-xl font-semibold">Production breakdown</h2>
                <div className="mt-5 space-y-3">
                  {Object.entries(kitchenBatches?.skuBreakdown || {}).map(([id, item]) => (
                    <div key={id} className="rounded-2xl border border-white/[0.07] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{item.productName}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatINR(item.totalPaise as Paise)}</p>
                        </div>
                        <p className="text-lg font-semibold text-primary">{item.quantity}</p>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: Math.min((item.quantity / Math.max(kitchenBatches?.totalScheduled || 1, 1)) * 100, 100) + "%" }} />
                      </div>
                    </div>
                  ))}
                  {Object.keys(kitchenBatches?.skuBreakdown || {}).length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No kitchen batch data.</div>}
                </div>
              </section>
            </div>
          )}

          {activeTab === "assets" && (
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Asset ledger</p>
                  <h2 className="mt-2 text-xl font-semibold">Containers & deposits</h2>
                </div>
                <Button size="sm" className="h-9 rounded-xl text-xs" onClick={() => setShowExchangeModal(true)}>Record exchange</Button>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {assetHoldings.map((asset) => (
                  <div key={asset.customerId + asset.assetType} className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_.7fr_.7fr] md:items-center">
                    <div>
                      <p className="text-sm font-semibold">{asset.assetType}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{asset.customerId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{asset.holdingCount} units</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">held</p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs font-semibold text-primary">{formatINR(asset.totalDepositHeldPaise as Paise)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">deposit</p>
                    </div>
                  </div>
                ))}
                {assetHoldings.length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No asset holdings.</div>}
              </div>
            </section>
          )}

          {activeTab === "disputes" && (
            <section className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/[0.1] bg-white/[0.02] px-2 py-1 text-[9px] font-semibold text-muted-foreground">{dispute.status}</span>
                        <p className="text-sm font-semibold">{dispute.customerName}</p>
                      </div>
                      <h3 className="mt-3 text-base font-semibold">{dispute.reason}</h3>
                      <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{dispute.evidence.customerComment || "No customer comment provided."}</p>
                      <p className="mt-3 text-[10px] text-subtle">{dispute.createdAt}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] p-4 lg:min-w-[210px]">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Disputed amount</p>
                      <p className="mt-2 text-2xl font-semibold text-primary">{formatINR(dispute.disputedAmountPaise as Paise)}</p>
                      {dispute.status === "OPEN" && (
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" className="h-8 rounded-lg text-[10px]" onClick={() => handleResolveDispute(dispute.id, "FULL_REFUND", dispute.disputedAmountPaise)}>Refund</Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-lg border-white/[0.1] text-[10px]" onClick={() => handleResolveDispute(dispute.id, "UPHELD_NO_REFUND", dispute.disputedAmountPaise)}>Uphold</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {disputes.length === 0 && <div className="rounded-3xl border border-dashed border-white/[0.1] p-12 text-center text-xs text-muted-foreground">No disputes.</div>}
            </section>
          )}

          {activeTab === "audit" && (
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="border-b border-white/[0.08] px-5 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Governance</p>
                <h2 className="mt-2 text-xl font-semibold">Audit log</h2>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_.7fr_.7fr]">
                    <div>
                      <p className="text-xs font-semibold">{log.action}</p>
                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{log.details}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">{log.targetType}</p>
                      <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{log.targetId}</p>
                    </div>
                    <div className="lg:text-right">
                      <p className="text-[10px] text-muted-foreground">{log.adminEmail}</p>
                      <p className="mt-1 text-[10px] text-subtle">{log.createdAt}</p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && <div className="p-10 text-center text-xs text-muted-foreground">No audit events.</div>}
              </div>
            </section>
          )}
        </main>
      </div>
      {/* MODAL 1: Onboard Vendor */}
      {showNewVendorModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-card-foreground">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-foreground">Provision Local Merchant</h3>
                <p className="text-[11px] text-muted-foreground">Directly issues verified merchant credentials</p>
              </div>
              <button onClick={() => setShowNewVendorModal(false)} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateVendor} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Vendor Category & Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "MILKMAN" as const, label: "Milkman", emoji: "🥛" },
                    { type: "WATER_SERVICE" as const, label: "Water 20L", emoji: "💧" },
                    { type: "TIFFIN" as const, label: "Tiffin Hub", emoji: "🍱" },
                  ].map((item) => {
                    const isSelected = newVendorForm.vendorType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() =>
                          setNewVendorForm({
                            ...newVendorForm,
                            vendorType: item.type,
                            serviceCategories: item.type === "MILKMAN" ? "MILK" : item.type === "WATER_SERVICE" ? "WATER" : "TIFFIN",
                          })
                        }
                        className={`rounded-xl border p-2.5 text-center transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="text-base mb-1">{item.emoji}</div>
                        <div className="text-[11px]">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Business / Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder={
                    newVendorForm.vendorType === "MILKMAN"
                      ? "e.g. Bangalore Farm Fresh Dairy"
                      : newVendorForm.vendorType === "WATER_SERVICE"
                      ? "e.g. BlueSpring 20L Water Suppliers"
                      : "e.g. Annapurna Ghar Rasoi Tiffin"
                  }
                  value={newVendorForm.businessName}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, businessName: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Plan Tier</label>
                  <select
                    value={newVendorForm.tier}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, tier: e.target.value as any })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="PRO">Pro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Locality / Hub Base</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSR Layout Sector 2, 14th Main"
                  value={newVendorForm.locality}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, locality: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Covered Societies (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sobha Classic, Purva Fairmont, Prestige Falcon"
                  value={newVendorForm.coveredSocieties}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, coveredSocieties: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNewVendorModal(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="w-1/2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                  {actionLoading ? "Authorizing..." : "Authorize & Issue Access"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Adjust Khata */}
      {showKhataModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-card-foreground">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Manual Khata Balance Adjustment</h3>
              <button onClick={() => setShowKhataModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleAddKhata} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Target Customer</label>
                <select
                  value={khataForm.customerId}
                  onChange={(e) => setKhataForm({ ...khataForm, customerId: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                >
                  <option value="usr_priya">Priya Sharma (Sobha Classic B-402)</option>
                  <option value="usr_verma">Rahul Verma (Purva Fairmont A-101)</option>
                  <option value="usr_patel">Amit Patel (Prestige Falcon C-305)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Entry Type</label>
                <select
                  value={khataForm.direction}
                  onChange={(e) => setKhataForm({ ...khataForm, direction: e.target.value as any })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="CREDIT">CREDIT (+Payment Received / Balance Addition)</option>
                  <option value="DEBIT">DEBIT (-Service Fee / Penalty Deduction)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={khataForm.amountRupees}
                  onChange={(e) => setKhataForm({ ...khataForm, amountRupees: Number(e.target.value) })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Reason / Audit Notes</label>
                <input
                  type="text"
                  required
                  value={khataForm.notes}
                  onChange={(e) => setKhataForm({ ...khataForm, notes: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowKhataModal(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 font-bold">
                  Post to Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Doorstep Container Swap */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-card-foreground">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Record Container Exchange</h3>
              <button onClick={() => setShowExchangeModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleAssetExchange} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Household Flat</label>
                <select
                  value={exchangeForm.customerId}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, customerId: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                >
                  <option value="usr_priya">Priya Sharma (Sobha Classic B-402)</option>
                  <option value="usr_verma">Rahul Verma (Purva Fairmont A-101)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Asset Container</label>
                <select
                  value={exchangeForm.assetType}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, assetType: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="WATER_JAR_20L">20L RO Mineral Water Can (₹150 dep)</option>
                  <option value="INSULATED_TIFFIN_BOX">Insulated Stainless Tiffin (₹300 dep)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Delivered Full</label>
                  <input
                    type="number"
                    min="0"
                    value={exchangeForm.delivered}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, delivered: Number(e.target.value) })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Collected Empty</label>
                  <input
                    type="number"
                    min="0"
                    value={exchangeForm.collected}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, collected: Number(e.target.value) })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowExchangeModal(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 font-bold">
                  Confirm Swap
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
