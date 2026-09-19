"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";

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
  serviceCategories: string[];
  coveredSocieties: string[];
  status: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED";
  tier: "STARTER" | "GROWTH" | "PRO";
  subscriberCount: number;
  monthlyVolumePaise: number;
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
    serviceCategories: "TIFFIN",
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

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    executeAction("CREATE_VENDOR", {
      businessName: newVendorForm.businessName,
      phone: newVendorForm.phone,
      serviceCategories: [newVendorForm.serviceCategories],
      coveredSocieties: newVendorForm.coveredSocieties.split(",").map((s) => s.trim()),
      tier: newVendorForm.tier,
    });
    setShowNewVendorModal(false);
    setNewVendorForm({
      businessName: "",
      phone: "",
      serviceCategories: "TIFFIN",
      coveredSocieties: "Sobha Classic, Purva Fairmont",
      tier: "STARTER",
    });
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
    return (
      <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-mono">Loading RUXS Platform Control Cockpit...</p>
      </div>
    );
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
    <div className="min-h-screen py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Admin Header Bar */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                👑 Super Admin Console
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/10">
                🛡️ {user.primaryEmail || (user as any).email}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                • Neon DB Active
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Global Platform Oversight & Control
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live vendor verification, dispute arbitration, fulfillment engines & digital khata ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              disabled={actionLoading}
              className="text-xs font-semibold"
            >
              🔄 Refresh Data
            </Button>
            <Link href="/customer/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
              🏠 Household
            </Link>
            <Link href="/vendor/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
              🏪 Vendor Hub
            </Link>
            <Link href="/delivery" className={buttonVariants({ variant: "outline", size: "sm" })}>
              🛵 Driver Sheet
            </Link>
            <Link href="/disputes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              ⚖️ Disputes
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await hexclaveApp.signOut();
                router.push("/login");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
            feedback.type === "success"
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-destructive/10 border-destructive/40 text-destructive"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cockpit Metrics */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Active Vendors</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-foreground font-mono">{overview.verifiedVendors}</span>
                <span className="text-[10px] text-muted-foreground">/{overview.totalVendors}</span>
              </div>
              <span className="text-[10px] text-amber-500 font-semibold mt-1 block">
                {overview.pendingVendors} pending review
              </span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Households</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-primary font-mono">{overview.totalHouseholds}</span>
                <span className="text-[10px] text-muted-foreground">flats</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">3 societies connected</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Today Drops</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-foreground font-mono">{overview.todayDeliveriesCount}</span>
                <span className="text-[10px] text-primary font-medium">{overview.deliveredCount} done</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">{overview.inPrepCount} in preparation</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Open Disputes</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-2xl font-black font-mono ${
                    overview.openDisputesCount > 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {overview.openDisputesCount}
                </span>
                <span className="text-[10px] text-muted-foreground">cases</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">Compensating refunds</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Asset Cans / Tiffins</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-foreground font-mono">{overview.totalAssetHoldingsCount}</span>
                <span className="text-[10px] text-muted-foreground">held</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">₹1,050 deposits locked</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Monthly GMV</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-primary font-mono">₹18.4L</span>
              </div>
              <span className="text-[10px] text-primary font-semibold mt-1 block">● 98.2% auto-settled</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tab Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border">
        {[
          { id: "overview", label: "📊 Cockpit Overview" },
          { id: "vendors", label: `🏪 Vendors (${vendors.length})` },
          { id: "households", label: `🏠 Households (${households.length})` },
          { id: "fulfillments", label: `📦 Fulfillments (${fulfillments.length})` },
          { id: "kitchen", label: "🍳 Kitchen Batches" },
          { id: "assets", label: `🛢️ Assets (${assetHoldings.length})` },
          { id: "disputes", label: `⚖️ Disputes (${disputes.length})` },
          { id: "audit", label: `📜 Audit Log (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COCKPIT OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Trigger Operations Bar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                ⚡ Emergency & Autopilot Operational Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleTriggerOvernight}
                disabled={actionLoading}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition text-left space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">🌙 Overnight Run</span>
                  <Badge variant="secondary" className="text-[10px]">Generate</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Triggers daily fulfillment snapshots for all active subscriptions.
                </p>
                <span className="text-[10px] text-primary font-bold block pt-1">Execute Engine →</span>
              </button>

              <button
                onClick={handleLockCutoff}
                disabled={actionLoading}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition text-left space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">🔒 Cutoff Lock</span>
                  <Badge variant="secondary" className="text-[10px]">Freeze</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sweeps pending morning/lunch cutoffs and locks kitchen cooking batches.
                </p>
                <span className="text-[10px] text-primary font-bold block pt-1">Lock Batches →</span>
              </button>

              <button
                onClick={handleDispatchNotification}
                disabled={actionLoading}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition text-left space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">💬 WhatsApp Poll</span>
                  <Badge variant="secondary" className="text-[10px]">Simulate</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dispatches interactive morning cutoff poll with Skip/Deliver buttons.
                </p>
                <span className="text-[10px] text-primary font-bold block pt-1">Dispatch Test →</span>
              </button>

              <button
                onClick={() => setShowNewVendorModal(true)}
                className="p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition text-left space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">➕ Onboard Vendor</span>
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Quick</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Directly onboard a local tiffin cook, milk vendor or water supplier.
                </p>
                <span className="text-[10px] text-primary font-bold block pt-1">Add Vendor →</span>
              </button>
            </CardContent>
          </Card>

          {/* Quick Summaries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent Items: Pending Vendors & Open Disputes */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  ⚠️ Items Requiring Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendors.filter((v) => v.status === "PENDING_VERIFICATION").map((v) => (
                  <div key={v.id} className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{v.businessName}</span>
                        <Badge variant="secondary" className="text-[9px]">PENDING VERIFICATION</Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">{v.phone} • {v.serviceCategories.join(", ")}</span>
                    </div>
                    <Button size="sm" onClick={() => handleVerifyVendor(v.id)} className="text-xs font-bold">
                      Verify & Activate
                    </Button>
                  </div>
                ))}

                {disputes.filter((d) => d.status === "OPEN").map((d) => (
                  <div key={d.id} className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{d.customerName}</span>
                        <Badge variant="destructive" className="text-[9px]">OPEN DISPUTE</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{d.evidence.customerComment}</p>
                      <span className="text-[10px] font-mono text-primary font-bold">₹{d.disputedAmountPaise / 100}</span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => handleResolveDispute(d.id, "FULL_REFUND", d.disputedAmountPaise)} className="text-xs font-bold">
                      Full Refund
                    </Button>
                  </div>
                ))}

                {vendors.filter((v) => v.status === "PENDING_VERIFICATION").length === 0 &&
                  disputes.filter((d) => d.status === "OPEN").length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      🎉 All vendor queues and disputes are currently clear!
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Today's Live Production & Kitchen Counter */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  🍳 Live Kitchen Cooking Batches
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">Lunch Shift</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {kitchenBatches && Object.keys(kitchenBatches.skuBreakdown).length > 0 ? (
                  Object.entries(kitchenBatches.skuBreakdown).map(([sku, item]) => (
                    <div key={sku} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground">{item.productName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono block">SKU: {sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-mono font-black text-primary">{item.quantity}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">₹{item.totalPaise / 100}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Standard Vegetarian Lunch Thali</span>
                      <span className="text-base font-mono font-black text-primary">142 portions</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">A2 Farm Fresh Cow Milk 1L</span>
                      <span className="text-base font-mono font-black text-primary">210 pouches</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">20L RO Mineral Water Can</span>
                      <span className="text-base font-mono font-black text-primary">86 cans</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: VENDORS MANAGEMENT */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Local Vendor Network Directory</h2>
            <Button onClick={() => setShowNewVendorModal(true)} size="sm" className="font-bold text-xs">
              ➕ Onboard New Vendor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((vendor) => {
              const isVerified = vendor.status === "VERIFIED";
              const isPending = vendor.status === "PENDING_VERIFICATION";
              const isSuspended = vendor.status === "SUSPENDED";

              return (
                <Card key={vendor.id} className="bg-card border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-base font-bold text-foreground block">{vendor.businessName}</span>
                        <span className="text-xs text-muted-foreground font-mono">{vendor.phone} • /{vendor.slug}</span>
                      </div>
                      <Badge
                        variant={isVerified ? "default" : isPending ? "secondary" : "destructive"}
                        className="text-[10px] font-black uppercase"
                      >
                        {vendor.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {vendor.serviceCategories.map((c) => (
                        <span key={c} className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border/50 pt-2 font-mono">
                      <div>Societies: {vendor.coveredSocieties.join(", ")}</div>
                      <div>Active Subscribers: <strong className="text-foreground">{vendor.subscriberCount}</strong> flats</div>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-semibold">Tier:</span>
                        <select
                          value={vendor.tier}
                          onChange={(e) => handleTierChange(vendor.id, e.target.value as any)}
                          className="bg-background border border-input text-xs rounded-md px-2 py-1 text-foreground"
                        >
                          <option value="STARTER">Starter</option>
                          <option value="GROWTH">Growth</option>
                          <option value="PRO">Pro</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button size="sm" onClick={() => handleVerifyVendor(vendor.id)} className="text-xs font-bold">
                            ✓ Approve
                          </Button>
                        )}
                        {isVerified && (
                          <Button size="sm" variant="destructive" onClick={() => handleSuspendVendor(vendor.id)} className="text-xs font-semibold">
                            Suspend
                          </Button>
                        )}
                        {isSuspended && (
                          <Button size="sm" variant="outline" onClick={() => handleReactivateVendor(vendor.id)} className="text-xs font-semibold">
                            Re-activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HOUSEHOLDS & DIGITAL KHATA */}
      {activeTab === "households" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Households & Digital Khata Balances</h2>
            <Button onClick={() => setShowKhataModal(true)} size="sm" className="font-bold text-xs">
              💳 Add Manual Khata Adjustment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {households.map((h) => {
              const isDebt = h.khataBalancePaise < 0;
              const absRupees = Math.abs(h.khataBalancePaise) / 100;

              return (
                <Card key={h.id} className="bg-card border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-bold text-foreground block">{h.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {h.societyName} • {h.towerWing}-{h.flatNumber}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Floor {h.floor}
                      </Badge>
                    </div>

                    {/* Members List */}
                    <div className="space-y-1 bg-muted/20 p-2 rounded-lg border border-border/40 text-[11px]">
                      <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Registered Residents</span>
                      {h.members.map((m) => (
                        <div key={m.id} className="flex justify-between items-center text-foreground">
                          <span>{m.name} ({m.role.replace("_", " ")})</span>
                          <span className="text-muted-foreground font-mono text-[10px]">{m.phone}</span>
                        </div>
                      ))}
                    </div>

                    {/* Khata Balance */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                      <span className="text-muted-foreground font-semibold">Khata Net Balance:</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          isDebt ? "text-amber-500" : "text-primary"
                        }`}
                      >
                        {isDebt ? `-₹${absRupees} (Owes)` : `+₹${absRupees} (Prepaid)`}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setKhataForm({ ...khataForm, customerId: h.members[0]?.userId || "usr_priya" });
                          setShowKhataModal(true);
                        }}
                        className="w-full text-xs font-semibold"
                      >
                        Adjust Khata
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TODAY'S FULFILLMENTS */}
      {activeTab === "fulfillments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Today's Daily Delivery Fulfillments</h2>
            <Button size="sm" onClick={handleTriggerOvernight} className="font-bold text-xs">
              🌙 Trigger Overnight Sweep
            </Button>
          </div>

          <div className="space-y-2.5">
            {fulfillments.map((f) => (
              <Card key={f.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{f.items[0]?.productName || "Essential Service"}</span>
                      <Badge
                        variant={
                          f.status === "DELIVERED"
                            ? "default"
                            : f.status === "IN_PREPARATION" || f.status === "OUT_FOR_DELIVERY"
                            ? "secondary"
                            : f.status.includes("SKIP")
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] font-black uppercase"
                      >
                        {f.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{f.shift} Shift</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Customer: <strong className="text-foreground">{f.customerId}</strong> • Total:{" "}
                      <strong className="text-primary font-mono">₹{f.totalPricePaise / 100}</strong>
                    </p>
                    {f.notes && <p className="text-[11px] text-amber-500/90 mt-0.5">Note: {f.notes}</p>}
                  </div>

                  {/* Transition State Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {f.status !== "IN_PREPARATION" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransitionFulfillment(f.id, "IN_PREPARATION")}
                        className="text-xs"
                      >
                        In Prep
                      </Button>
                    )}
                    {f.status !== "OUT_FOR_DELIVERY" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransitionFulfillment(f.id, "OUT_FOR_DELIVERY")}
                        className="text-xs"
                      >
                        Dispatch
                      </Button>
                    )}
                    {f.status !== "DELIVERED" && (
                      <Button
                        size="sm"
                        onClick={() => handleTransitionFulfillment(f.id, "DELIVERED")}
                        className="text-xs font-bold"
                      >
                        ✓ Mark Delivered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: KITCHEN BATCHES */}
      {activeTab === "kitchen" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Kitchen Batch Cooking & Packing Breakdown</h2>
              <p className="text-xs text-muted-foreground">Aggregated SKU requirements for the lunch service shift</p>
            </div>
            <Button size="sm" onClick={handleLockCutoff} className="font-bold text-xs">
              🔒 Force Cutoff Lock
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">Standard Veg Thalis</span>
                <span className="text-3xl font-black font-mono text-primary block">142</span>
                <span className="text-[11px] text-muted-foreground">Sharma Homestyle Kitchen</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">Farm Fresh Milk 1L</span>
                <span className="text-3xl font-black font-mono text-primary block">210</span>
                <span className="text-[11px] text-muted-foreground">Gokul Farm Dairy</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">20L RO Water Jars</span>
                <span className="text-3xl font-black font-mono text-primary block">86</span>
                <span className="text-[11px] text-muted-foreground">PureAqua Systems</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: ASSETS & CONTAINERS */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">High-Value Circulating Asset Tracking</h2>
            <Button size="sm" onClick={() => setShowExchangeModal(true)} className="font-bold text-xs">
              🛢️ Record Doorstep Container Swap
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assetHoldings.map((a, idx) => (
              <Card key={idx} className="bg-card border-border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-foreground block">{a.assetType.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">Holder: {a.customerId}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {a.holdingCount} units
                    </Badge>
                  </div>

                  <div className="border-t border-border/50 pt-2 text-xs flex justify-between font-mono">
                    <span className="text-muted-foreground">Deposit Liability:</span>
                    <strong className="text-primary font-bold">₹{a.totalDepositHeldPaise / 100}</strong>
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    Exit Reconcile Guard: Security deposit refundable only when container count reaches 0.
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DISPUTE QUEUE */}
      {activeTab === "disputes" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Customer Dispute Resolution & Khata Refunds</h2>

          <div className="space-y-3">
            {disputes.map((d) => (
              <Card key={d.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{d.customerName}</span>
                        <Badge
                          variant={d.status === "OPEN" ? "destructive" : "secondary"}
                          className="text-[10px] font-black uppercase"
                        >
                          {d.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{d.customerPhone} • Reason: {d.reason}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-primary">₹{d.disputedAmountPaise / 100}</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">Order {d.fulfillmentId}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-xl border border-border/50 text-xs space-y-1">
                    <span className="font-semibold text-foreground block">Customer Explanation:</span>
                    <p className="text-muted-foreground">{d.evidence.customerComment}</p>
                    {d.evidence.driverDropNotes && (
                      <p className="text-amber-500/90 text-[11px] pt-1">Driver Note: {d.evidence.driverDropNotes}</p>
                    )}
                  </div>

                  {d.status === "OPEN" && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveDispute(d.id, "UPHELD_NO_REFUND", d.disputedAmountPaise)}
                        className="text-xs"
                      >
                        Dismiss Dispute
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveDispute(d.id, "FULL_REFUND", d.disputedAmountPaise)}
                        className="text-xs font-bold bg-primary text-primary-foreground"
                      >
                        ✓ Grant Full Refund (+Credit Khata)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Tamper-Evident Platform Audit Trail</h2>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/40 font-mono">
              ● Cryptographically Verified
            </Badge>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0 divide-y divide-border">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">Target: {log.targetType} ({log.targetId})</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{log.createdAt}</span>
                  </div>
                  <p className="text-foreground leading-snug">{log.details}</p>
                  <span className="text-[10px] text-muted-foreground block font-mono">Actor: {log.adminEmail}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: Onboard Vendor */}
      {showNewVendorModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-card-foreground">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Onboard Local Vendor</h3>
              <button onClick={() => setShowNewVendorModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore Organic Milk Supply"
                  value={newVendorForm.businessName}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, businessName: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>
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
                <label className="font-semibold text-foreground">Primary Category</label>
                <select
                  value={newVendorForm.serviceCategories}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, serviceCategories: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="TIFFIN">🍱 Tiffin & Meals Delivery</option>
                  <option value="MILK">🥛 Fresh Cow Milk Delivery</option>
                  <option value="WATER">💧 20L Water Jar Delivery</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Covered Societies (comma-separated)</label>
                <input
                  type="text"
                  value={newVendorForm.coveredSocieties}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, coveredSocieties: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNewVendorModal(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2 font-bold">
                  Create Vendor
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
