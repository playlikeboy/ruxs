"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@hexclave/next";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { AdminVendorProfile, PlatformAuditLog } from "@/src/modules/admin/admin-schema";
import { formatINR, Paise } from "@/src/shared/types/money";
import { RuxsPageLoading, RuxsSpinner } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminVendorDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const user = useUser();

  const isSuperAdmin = Boolean(
    user && (user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com")
  );

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [vendor, setVendor] = useState<AdminVendorProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchVendorDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/vendors?slug=${slug}`);
      const data = (await res.json()) as any;
      if (data.success && data.data) {
        setVendor(data.data.vendor);
        setAuditLogs(data.data.auditLogs || []);
        setCatalog(data.data.catalog);
      } else {
        setFeedback({ message: data.error?.message || "Vendor not found", type: "error" });
      }
    } catch (err) {
      setFeedback({ message: "Failed to load vendor dossier", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchVendorDetail();
    }
  }, [user, slug]);

  const handleApprove = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: "APPROVE",
          adminUser: { userId: user?.id || "usr_admin", email: user?.primaryEmail || "sh20raj@gmail.com" },
        }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setFeedback({ message: `Vendor '${vendor.businessName}' approved successfully!`, type: "success" });
        void fetchVendorDetail();
      } else {
        setFeedback({ message: data.error?.message || "Failed to approve", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error during approval", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!vendor) return;
    const reason = prompt("Enter reason for vendor suspension:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: "SUSPEND",
          reason,
          adminUser: { userId: user?.id || "usr_admin", email: user?.primaryEmail || "sh20raj@gmail.com" },
        }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setFeedback({ message: `Vendor suspended: ${reason}`, type: "success" });
        void fetchVendorDetail();
      } else {
        setFeedback({ message: data.error?.message || "Failed to suspend", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error during suspension", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateCredentials = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: "GENERATE_CREDENTIALS",
          adminUser: { userId: user?.id || "usr_admin", email: user?.primaryEmail || "sh20raj@gmail.com" },
        }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setFeedback({ message: "New login credentials generated!", type: "success" });
        void fetchVendorDetail();
      } else {
        setFeedback({ message: data.error?.message || "Failed to generate credentials", type: "error" });
      }
    } catch {
      setFeedback({ message: "Error generating credentials", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCard = () => {
    if (!vendor) return;
    const typeEmoji = vendor.vendorType === "MILKMAN" ? "🥛" : vendor.vendorType === "WATER_SERVICE" ? "💧" : "🍱";
    const creds = vendor.credentials;
    const text = `${typeEmoji} RUXS Merchant Access: ${vendor.businessName}
Your merchant operations cockpit is live.
Direct Login: ${creds?.directUrl || `https://ruxs.in/login?slug=${vendor.slug}`}
Access PIN: ${creds?.accessPin || "Contact Platform Operations"}
Manage society deliveries, daily cutoffs, and digital khata.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <RuxsPageLoading
        badge="Vendor Management Dossier"
        title="Loading Merchant Records"
        description="Fetching route coverage, service catalog, and operational credentials…"
      />
    );
  }

  if (!isSuperAdmin) {
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
              Access to this vendor management console is restricted to <span className="font-mono text-primary font-semibold">sh20raj@gmail.com</span>.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <Button className="w-full text-xs" onClick={() => (window.location.href = `/login?redirect=/admin/${slug}`)}>
              Authenticate with Hexclave
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Vendor Not Found</h2>
        <p className="text-sm text-muted-foreground">No merchant registered with slug &apos;{slug}&apos;.</p>
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft size={14} /> Return to Mission Control
        </Link>
      </div>
    );
  }

  const typeConfig = vendor.typeConfig || {};
  const creds = vendor.credentials;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Bar */}
      <div className="border-b border-white/[0.08] bg-[#101412]/60 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Vendor Dossier</span>
                <span className="text-xs text-subtle">·</span>
                <span className="text-xs font-mono text-muted-foreground">{vendor.id}</span>
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight sm:text-2xl mt-0.5">
                {vendor.businessName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vendor.status === "PENDING_APPROVAL" || vendor.status === "PENDING_VERIFICATION" ? (
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold text-xs h-9 rounded-xl"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Approve Vendor
              </Button>
            ) : vendor.status === "VERIFIED" ? (
              <Button
                onClick={handleSuspend}
                disabled={actionLoading}
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-9 rounded-xl"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Suspend
              </Button>
            ) : (
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold text-xs h-9 rounded-xl"
              >
                Reactivate Vendor
              </Button>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-8">
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6">
        {/* Header Overview Card */}
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    vendor.vendorType === "MILKMAN"
                      ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                      : vendor.vendorType === "WATER_SERVICE"
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border-primary/30 bg-primary/10 text-primary"
                  }
                >
                  {vendor.vendorType === "MILKMAN"
                    ? "🥛 Milkman & Dairy"
                    : vendor.vendorType === "WATER_SERVICE"
                    ? "💧 20L Water Service"
                    : "🍱 Tiffin & Homestyle Meals"}
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    vendor.status === "VERIFIED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : vendor.status === "PENDING_APPROVAL"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  {vendor.status}
                </Badge>

                <Badge variant="outline" className="border-white/[0.1] bg-white/[0.03] text-muted-foreground">
                  Tier: {vendor.tier}
                </Badge>
              </div>

              <p className="text-xs font-mono text-muted-foreground">
                Public Slug: <span className="text-foreground font-medium">/v/{vendor.slug}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Phone: <span className="text-foreground font-semibold">{vendor.phone}</span> · UPI:{" "}
                <span className="font-mono text-foreground">{vendor.phone ? `${vendor.phone.replace("+91", "")}@upi` : "N/A"}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCredentials}
                disabled={actionLoading}
                className="h-9 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Regenerate Credentials
              </Button>
              <Button
                size="sm"
                onClick={handleCopyCard}
                className="h-9 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {copied ? "Copied WhatsApp Card!" : "Copy WhatsApp Login Card"}
              </Button>
            </div>
          </div>
        </section>

        {/* Credentials & Access Console */}
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <KeyRound size={15} />
              Merchant Direct Access Credentials
            </div>
            <span className="text-[10px] text-muted-foreground">For direct merchant distribution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-subtle">Direct Login Link</span>
              <p className="text-xs font-mono text-foreground break-all">
                {creds?.directUrl || `https://ruxs.in/login?vendorToken=vtok_${vendor.slug}&slug=${vendor.slug}`}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-subtle">6-Digit Security Access PIN</span>
              <p className="text-xl font-mono font-bold tracking-widest text-primary">
                {creds?.accessPin || "849201"}
              </p>
            </div>
          </div>
        </section>

        {/* Type-Specific Operational Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Domain Setup */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-base font-semibold text-foreground">Operational Blueprint</h2>
              <span className="text-xs text-subtle uppercase tracking-wider font-mono">{vendor.vendorType}</span>
            </div>

            {vendor.vendorType === "MILKMAN" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Delivery Slots</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-xl border border-blue-400/20 bg-blue-400/5 px-3 py-1.5 text-xs text-blue-300">
                      Early Morning: 5:30 AM – 7:00 AM (Cutoff 9:00 PM)
                    </span>
                    <span className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground">
                      Evening Slot: 5:30 PM – 7:00 PM (Cutoff 3:00 PM)
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Varieties & Packaging</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Desi Gir Cow A2 Raw Milk</p>
                        <p className="text-[10px] text-muted-foreground">4.8% Fat · Sealed Glass Bottle</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">$3.50 / L</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Farm Fresh Pure Cow Milk</p>
                        <p className="text-[10px] text-muted-foreground">3.8% Fat · Sealed Glass Bottle</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">$2.75 / L</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : vendor.vendorType === "WATER_SERVICE" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Can Inventory & Security Deposits</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Bisleri Sealed 20L Bubbletop Can</p>
                        <p className="text-[10px] text-muted-foreground">Doorstep 1-to-1 Empty Exchange</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">$2.99 / Can</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">RO Ultra-Pure 20L Mineral Can</p>
                        <p className="text-[10px] text-muted-foreground">Doorstep 1-to-1 Empty Exchange</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">$1.99 / Can</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-cyan-200">
                  Refundable Empty Jar Deposit: <span className="font-bold text-foreground font-mono">$5.00 / Jar</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2">Daily Shift Menus</h3>
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3.5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Afternoon Lunch Thali (12:30 PM)</span>
                        <span className="text-xs font-mono font-bold text-foreground">$8.99 / meal</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        4 Ghee Phulkas, Dal Tadka, Paneer Butter Masala, Jeera Rice, Boondi Raita, Gulab Jamun
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3.5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Night Light Dinner Thali (7:30 PM)</span>
                        <span className="text-xs font-mono font-bold text-foreground">$9.99 / meal</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        3 Multigrain Rotis, Yellow Dal Fry, Aloo Gobi Matar, Steamed Rice, Roasted Papad, Salad
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Route Coverage & Societies */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-base font-semibold text-foreground">Route & Societies</h2>
              <span className="text-xs text-subtle">{vendor.coveredSocieties.length} Societies Covered</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {vendor.coveredSocieties.map((soc) => (
                <span key={soc} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-foreground font-medium">
                  📍 {soc}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active Doorstep Subscribers:</span>
                <span className="font-semibold text-foreground">{vendor.subscriberCount} Households</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Estimated Monthly GMV:</span>
                <span className="font-semibold font-mono text-primary">{formatINR(vendor.monthlyVolumePaise as Paise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Platform Audit Records</h2>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent administrative events recorded for this vendor.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-primary">{log.action}</span>:{" "}
                    <span className="text-muted-foreground">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-subtle font-mono">{log.createdAt.split("T")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
