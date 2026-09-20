"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@hexclave/next";
import { Household } from "@/src/modules/households/household-schema";
import {
  ArrowRight,
  Calendar,
  Check,
  CircleAlert,
  Home,
  Link2,
  Lock,
  Settings,
  UserPlus,
  Users,
  Wallet,
  X,
} from "@/components/icons/animated";

export default function HouseholdClient() {
  const user = useUser();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sharedServiceSkipped, setSharedServiceSkipped] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchHousehold = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/households?householdId=hh_sobha_b402");
      const data = (await response.json()) as { success: boolean; data?: Household };
      if (data.success && data.data) setHousehold(data.data);
      else setHousehold(null);
    } catch (fetchError) {
      console.error(fetchError);
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void fetchHousehold();
    else setLoading(false);
  }, [user]);

  const ownerName = useMemo(
    () => user?.displayName || (user as any)?.name || user?.primaryEmail || (user as any)?.email || "Primary resident",
    [user]
  );

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!household || !newMemberName.trim() || !newMemberPhone.trim()) return;

    setError(null);
    try {
      const response = await fetch("/api/households/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: household.id,
          invitedByUserId: household.primaryOwnerId,
          name: newMemberName.trim(),
          phone: newMemberPhone.startsWith("+91") ? newMemberPhone : "+91 " + newMemberPhone,
          role: "MEMBER",
          canManageSubscriptions: false,
          canSkipDeliveries: true,
        }),
      });

      const data = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Unable to send invite.");

      setNewMemberName("");
      setNewMemberPhone("");
      setInviteOpen(false);
      await fetchHousehold();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to send invite.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock size={21} /></div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Household access</p>
          <h1 className="mt-2 text-2xl font-semibold">Your shared home workspace</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in to manage flatmates, shared services and household-level delivery controls.
          </p>
          <Link href="/login?redirect=/customer/household" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">
            Sign in <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-[28px] bg-white/[0.035]" />
          <div className="h-52 animate-pulse rounded-3xl bg-white/[0.03]" />
          <div className="h-80 animate-pulse rounded-3xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        <CircleAlert size={22} className="mx-auto text-subtle" />
        <h1 className="mt-4 text-xl font-semibold">Household details are unavailable</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Refresh the workspace or complete household setup before inviting members.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/customer/onboard" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">Complete setup</Link>
          <Link href="/customer/dashboard" className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-xs text-muted-foreground">Back to overview</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.1),transparent_36%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">Shared household</span>
                <span className="text-subtle">{household.societyName} · {household.towerWing} · {household.flatNumber}</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{household.name}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Primary owner & billing contact: <span className="font-medium text-foreground">{ownerName}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/customer/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] px-3.5 text-xs font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
                <Home size={13} /> Personal overview
              </Link>
              <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground">
                <UserPlus size={14} /> Invite flatmate
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Shared services</p>
              <h2 className="mt-2 text-xl font-semibold">Water & milk for the flat</h2>
            </div>
            <button
              type="button"
              onClick={() => setSharedServiceSkipped((value) => !value)}
              className={sharedServiceSkipped ? "inline-flex h-9 items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 text-[11px] font-semibold text-destructive" : "inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.09] px-3 text-[11px] font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"}
            >
              {sharedServiceSkipped ? <X size={13} /> : <Calendar size={13} />}
              {sharedServiceSkipped ? "Skipped for tomorrow" : "Skip tomorrow"}
            </button>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {[
              { title: "20L Water Jar", detail: "Alternate days · doorstep delivery", meta: "1 jar currently held", price: "₹90 / jar" },
              { title: "Nandini Toned Milk", detail: "Daily · 6:30 AM · 2 packets", meta: "Delivered to doorstep bag", price: "₹48 / day" },
            ].map((service) => (
              <div key={service.title} className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{service.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{service.detail}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">{service.price}</span>
                </div>
                <p className="mt-5 flex items-center gap-1.5 text-[10px] text-primary"><Check size={12} /> {service.meta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-end justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Members & permissions</p>
              <h2 className="mt-2 text-xl font-semibold">Who can change the routine</h2>
            </div>
            <span className="rounded-full border border-white/[0.09] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {household.members.length} members
            </span>
          </div>

          <div className="divide-y divide-white/[0.07]">
            {household.members.map((member) => (
              <div key={member.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={member.role === "PRIMARY_OWNER" ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-subtle"}>
                    <Users size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <span className="rounded-full border border-white/[0.09] bg-white/[0.02] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{member.role.replace("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{member.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-primary">1-tap skip enabled</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{member.canManageSubscriptions ? "Subscription admin" : "Billing view only"}</p>
                  </div>
                  {member.role !== "PRIMARY_OWNER" && (
                    <button type="button" onClick={() => setHousehold((current) => current ? { ...current, members: current.members.filter((entry) => entry.userId !== member.userId) } : current)} className="rounded-xl border border-destructive/20 px-2.5 py-2 text-[10px] font-semibold text-destructive hover:bg-destructive/10">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Invite without friction", detail: "Generate a direct household invite for someone who lives with you.", href: "#invite", icon: Link2 },
            { title: "Change service defaults", detail: "Keep recurring services simple from the Services workspace.", href: "/customer/subscribe", icon: Settings },
            { title: "Split the monthly bill", detail: "Review shared household expenses and settle your share.", href: "/customer/expenses", icon: Wallet },
          ].map(({ title, detail, href, icon: Icon }) => (
            <Link key={title} href={href} onClick={href === "#invite" ? () => setInviteOpen(true) : undefined} className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
              <Icon size={16} className="text-primary" />
              <h3 className="mt-4 text-xs font-semibold">{title}</h3>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{detail}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">Open <ArrowRight size={12} /></span>
            </Link>
          ))}
        </section>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/[0.1] bg-[#111512] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Household invite</p>
                <h2 className="mt-2 text-lg font-semibold">Add a flatmate</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">They will be able to see shared deliveries and use 1-tap skip.</p>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05]"><X size={15} /></button>
            </div>

            {error && <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}

            <form onSubmit={handleInvite} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">Name</span>
                <input required value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm outline-none focus:border-ring" placeholder="e.g. Rahul Sharma" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">Mobile number</span>
                <input required value={newMemberPhone} onChange={(event) => setNewMemberPhone(event.target.value)} className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm outline-none focus:border-ring" placeholder="9876543210" />
              </label>
              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
                Send invite <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
