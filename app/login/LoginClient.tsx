"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_USERS, MASTER_DEMO_OTP } from "@/src/shared/auth/otp";

export default function LoginClient() {
  const router = useRouter();
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR_ADMIN" | "DELIVERY_STAFF" | "PLATFORM_ADMIN">("CUSTOMER");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = (await res.json()) as { success?: boolean; data?: { message?: string }; error?: { message?: string } };

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to request OTP");
      }

      setStep("OTP");
      setMessage(data.data?.message || "OTP sent successfully to your number.");
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, role }),
      });

      const data = (await res.json()) as { success?: boolean; error?: { message?: string } };

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid OTP code");
      }

      setMessage("Authenticated successfully! Redirecting...");
      setTimeout(() => {
        if (role === "PLATFORM_ADMIN") {
          router.push("/admin");
        } else if (role === "VENDOR_ADMIN") {
          router.push("/vendor/dashboard");
        } else if (role === "DELIVERY_STAFF") {
          router.push("/delivery");
        } else {
          router.push("/customer/dashboard");
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo: (typeof DEMO_USERS)[number]) => {
    setError(null);
    setMessage(null);
    setLoading(true);
    setPhone(demo.phone);
    setRole(demo.role);

    try {
      await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demo.phone }),
      });

      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demo.phone, code: MASTER_DEMO_OTP, role: demo.role }),
      });

      const data = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Demo login failed");
      }

      setMessage(`Logged in as ${demo.label}! Navigating to ${demo.redirect}...`);
      setTimeout(() => {
        router.push(demo.redirect);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to complete quick demo sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Main Sign-In Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl text-card-foreground space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xl shadow-lg">
              R
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Sign In to RUXS
            </h1>
            <p className="text-xs text-muted-foreground">
              Hyper-local household operations & recurring services
            </p>
          </div>

          {/* Role Switcher Tabs (4 roles) */}
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1 border border-border text-xs">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`rounded-lg py-2 font-semibold transition text-center ${
                role === "CUSTOMER"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Household
            </button>
            <button
              type="button"
              onClick={() => setRole("VENDOR_ADMIN")}
              className={`rounded-lg py-2 font-semibold transition text-center ${
                role === "VENDOR_ADMIN"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vendor Hub
            </button>
            <button
              type="button"
              onClick={() => setRole("DELIVERY_STAFF")}
              className={`rounded-lg py-2 font-semibold transition text-center ${
                role === "DELIVERY_STAFF"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => setRole("PLATFORM_ADMIN")}
              className={`rounded-lg py-2 font-semibold transition text-center ${
                role === "PLATFORM_ADMIN"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Step 1: Request OTP Form */}
          {step === "PHONE" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="phone-input" className="text-xs font-semibold text-foreground">
                  Indian Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-semibold text-muted-foreground">
                    +91
                  </span>
                  <input
                    id="phone-input"
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background py-3 pl-14 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.trim().length < 10}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Connecting..." : "Continue with OTP →"}
              </button>
            </form>
          ) : (
            /* Step 2: Verify OTP Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="otp-input" className="font-semibold text-foreground">
                    Enter 6-Digit OTP for +91 {phone}
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("PHONE")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Change number
                  </button>
                </div>

                <input
                  id="otp-input"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-input bg-background py-3 px-4 text-center tracking-[0.4em] font-mono text-lg font-bold text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {message && (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="text-[11px] text-muted-foreground text-center bg-muted/40 py-2 rounded-lg border border-border">
                💡 Master Sandbox Code: <strong className="text-primary font-mono">{MASTER_DEMO_OTP}</strong>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Sign In ✓"}
              </button>
            </form>
          )}

          <div className="pt-1 text-center text-xs text-muted-foreground">
            By signing in, you agree to RUXS{" "}
            <Link href="/docs" className="text-primary hover:underline">
              Terms of Service & Operational Policies
            </Link>
            .
          </div>
        </div>

        {/* ⚡ Instant 1-Click Demo Logins Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                ⚡ Instant 1-Click Demo Logins
              </span>
              <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 font-mono">
                Sandbox
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">OTP: 123456</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Explore complete role workflows with pre-configured accounts:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {DEMO_USERS.map((demo) => {
              const isSelected = phone === demo.phone && role === demo.role;
              return (
                <button
                  key={demo.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin(demo)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {demo.role === "PLATFORM_ADMIN" && "👑"}
                      {demo.role === "VENDOR_ADMIN" && "🏪"}
                      {demo.role === "DELIVERY_STAFF" && "🛵"}
                      {demo.role === "CUSTOMER" && "🏠"}
                      {demo.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      +91 {demo.phone}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {demo.description}
                  </p>
                  <div className="mt-2 text-[10px] font-bold text-primary flex items-center justify-between">
                    <span>1-Tap Sign In →</span>
                    <span className="text-muted-foreground font-mono text-[9px]">{demo.redirect}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
