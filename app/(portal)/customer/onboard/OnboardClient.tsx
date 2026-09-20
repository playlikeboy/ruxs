"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Home,
  MessageCircle,
  Package,
  Lock,
} from "@/components/icons/animated";

interface CustomerCreatedState {
  userId: string;
  fullName: string;
  phone: string;
  householdId: string;
  societyName: string;
  flatNumber: string;
  deliveryDropPreference: string;
}

export default function OnboardClient() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [societyName, setSocietyName] = useState("");
  const [towerWing, setTowerWing] = useState("");
  const [floor, setFloor] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [dropPreference, setDropPreference] = useState<"DOOR_BAG" | "SECURITY_GATE" | "RING_BELL">("DOOR_BAG");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<CustomerCreatedState | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/customer/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          whatsappOptIn,
          societyName,
          towerWing,
          floor,
          flatNumber,
          deliveryDropPreference: dropPreference,
          deliveryNotes,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: CustomerCreatedState;
        error?: { message: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to complete setup");
      }

      setCreatedCustomer(data.data!);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[920px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {createdCustomer ? (
        <section className="mx-auto max-w-2xl rounded-[30px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.1),transparent_38%),rgba(16,20,18,0.76)] p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Check size={22} /></div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Household ready</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Welcome, {createdCustomer.fullName}.</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Your doorstep details are saved. The next step is simply choosing the services you normally want.</p>

          <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
            {[
              ["Home", createdCustomer.societyName + " · " + createdCustomer.flatNumber, Home],
              ["Drop", createdCustomer.deliveryDropPreference.replace("_", " "), Package],
              ["WhatsApp", whatsappOptIn ? "Morning polls on" : "Optional", MessageCircle],
            ].map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                <Icon size={15} className="text-primary" />
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-subtle">{label}</p>
                <p className="mt-1 text-xs font-medium leading-5">{String(value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/customer/subscribe" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground">
              Browse services <ArrowRight size={13} />
            </Link>
            <Link href="/customer/dashboard" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.09] px-4 text-xs font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
              Open overview
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <section className="rounded-[30px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.09),transparent_38%),rgba(16,20,18,0.76)] p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Household setup</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Tell RUXS where the routine lives.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Save your home details once. Services can then use the same doorstep instructions every day.</p>
          </section>

          {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_.84fr]">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Home size={16} /></div>
                <div>
                  <p className="text-sm font-semibold">Resident details</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Used for your household account.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Field label="Full name"><input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sh Raj" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
                <Field label="Mobile number"><input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>

                <label className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                  <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="h-4 w-4 accent-primary" />
                  <span>
                    <span className="block text-xs font-medium">Morning WhatsApp polls</span>
                    <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">Allow quick skip / confirmation prompts before service cutoffs.</span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package size={16} /></div>
                <div>
                  <p className="text-sm font-semibold">Doorstep details</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Keep deliveries predictable.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Field label="Society / layout"><input required value={societyName} onChange={(e) => setSocietyName(e.target.value)} placeholder="Sobha Classic" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Tower"><input required value={towerWing} onChange={(e) => setTowerWing(e.target.value)} placeholder="B" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
                  <Field label="Floor"><input required value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="4" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
                  <Field label="Flat"><input required value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} placeholder="402" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">Drop preference</p>
                  <div className="grid gap-2">
                    {[
                      ["DOOR_BAG", "Door bag / shoe rack"],
                      ["SECURITY_GATE", "Security gate"],
                      ["RING_BELL", "Ring bell & handover"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDropPreference(id as "DOOR_BAG" | "SECURITY_GATE" | "RING_BELL")}
                        className={
                          dropPreference === id
                            ? "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-left text-xs font-semibold text-primary"
                            : "rounded-xl border border-white/[0.08] bg-white/[0.015] px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Optional delivery note"><input value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Leave the tiffin on the wooden hook" className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-subtle focus:border-ring" /></Field>
              </div>
            </section>

            <div className="lg:col-span-2 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Lock size={16 className="mt-0.5 text-primary" />
                <p className="text-[10px] leading-5 text-muted-foreground">RUXS uses the household details above to keep recurring deliveries consistent. You can change service settings later without rebuilding your household.</p>
              </div>
              <button type="submit" disabled={loading} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50">
                {loading ? "Saving household…" : "Save household & continue"}
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">{label}</span>
      {children}
    </label>
  );
}
