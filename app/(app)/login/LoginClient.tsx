"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, UserCheck, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hexclaveApp = useHexclaveApp();
  const user = useUser();

  const redirectParam = searchParams.get("redirect") || "";

  // Target role determination
  const initialRole = redirectParam.includes("admin")
    ? "PLATFORM_ADMIN"
    : redirectParam.includes("vendor")
    ? "VENDOR_ADMIN"
    : "CUSTOMER";

  const [targetRole, setTargetRole] = useState<"CUSTOMER" | "VENDOR_ADMIN" | "PLATFORM_ADMIN">(initialRole);
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");

  const [email, setEmail] = useState(
    targetRole === "PLATFORM_ADMIN" ? "sh20raj@gmail.com" : ""
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync email pre-fill when switching to admin tab
  useEffect(() => {
    if (targetRole === "PLATFORM_ADMIN") {
      setEmail("sh20raj@gmail.com");
    } else if (email === "sh20raj@gmail.com") {
      setEmail("");
    }
  }, [targetRole]);

  const getDestinationUrl = () => {
    if (redirectParam) return redirectParam;
    if (targetRole === "PLATFORM_ADMIN") return "/admin";
    if (targetRole === "VENDOR_ADMIN") return "/vendor/dashboard";
    return "/customer/dashboard";
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === "SIGN_IN") {
        const res = await hexclaveApp.signInWithCredential({
          email: email.trim(),
          password,
          noRedirect: true,
        });

        if (res.status === "error") {
          throw new Error(res.error.message || "Failed to sign in. Please verify your credentials.");
        }

        setSuccessMsg("Signed in successfully with Hexclave! Redirecting...");
        setTimeout(() => {
          router.push(getDestinationUrl());
        }, 400);
      } else {
        const res = await hexclaveApp.signUpWithCredential({
          email: email.trim(),
          password,
          noRedirect: true,
        });

        if (res.status === "error") {
          throw new Error(res.error.message || "Registration failed. Please check your details.");
        }

        setSuccessMsg("Account created with Hexclave! Redirecting...");
        setTimeout(() => {
          router.push(getDestinationUrl());
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await hexclaveApp.signInWithOAuth("google");
    } catch (err: any) {
      setError(err.message || "Google sign-in initiation failed.");
    }
  };

  const handleMagicLink = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address for magic link sign-in.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await hexclaveApp.sendMagicLinkEmail(email.trim());
      if (res.status === "error") {
        throw new Error(res.error.message || "Failed to send magic link.");
      }
      setMagicLinkSent(true);
      setSuccessMsg(`A secure login magic link was dispatched to ${email}. Check your inbox.`);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch magic link.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await hexclaveApp.signInWithPasskey();
      if (res.status === "error") {
        throw new Error(res.error.message || "Passkey verification failed.");
      }
      setSuccessMsg("Passkey verified! Redirecting...");
      setTimeout(() => {
        router.push(getDestinationUrl());
      }, 400);
    } catch (err: any) {
      setError(err.message || "Passkey not configured or cancelled.");
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated
  if (user) {
    const isSuperAdmin = user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com";
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <UserCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Hexclave Session Active</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {user.primaryEmail || (user as any).email || user.displayName || user.id}
            </p>
          </div>

          {isSuperAdmin && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-medium flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Authorized Platform Super Admin</span>
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => router.push(isSuperAdmin ? "/admin" : "/customer/dashboard")}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span>{isSuperAdmin ? "Launch Platform Admin Mission Control" : "Go to Household Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => router.push("/customer/dashboard")}
                className="w-full h-10 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View Consumer Experience
              </button>
            )}

            <button
              onClick={async () => {
                await hexclaveApp.signOut();
                router.refresh();
              }}
              className="w-full h-10 rounded-xl border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors"
            >
              Sign Out of Hexclave
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo className="w-24" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In with Hexclave</h1>
          <p className="text-xs text-muted-foreground">
            Centralised authentication for recurring local household services.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Select Your Destination Portal
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/50 border border-border text-xs">
            <button
              type="button"
              onClick={() => setTargetRole("CUSTOMER")}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                targetRole === "CUSTOMER"
                  ? "bg-card text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Consumer
            </button>
            <button
              type="button"
              onClick={() => setTargetRole("VENDOR_ADMIN")}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                targetRole === "VENDOR_ADMIN"
                  ? "bg-card text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vendor Hub
            </button>
            <button
              type="button"
              onClick={() => setTargetRole("PLATFORM_ADMIN")}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                targetRole === "PLATFORM_ADMIN"
                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Admin Restriction Notice */}
        {targetRole === "PLATFORM_ADMIN" && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Security Console</span>
            </div>
            <p className="text-[11px] text-amber-500/90 leading-relaxed">
              Only <strong className="font-mono underline">sh20raj@gmail.com</strong> is authorized to access <span className="font-mono">ruxs.in/admin</span>.
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Fast OAuth / Google Sign In */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground font-medium text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground absolute">
            or email & password
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleCredentialSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
              <button
                type="button"
                onClick={handleMagicLink}
                className="text-[11px] text-primary hover:underline"
              >
                Send magic link
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? "Authenticating with Hexclave..." : authMode === "SIGN_IN" ? "Sign In" : "Create Account"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Secondary Actions */}
        <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === "SIGN_IN" ? "SIGN_UP" : "SIGN_IN")}
            className="hover:text-foreground transition-colors"
          >
            {authMode === "SIGN_IN" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <button
            type="button"
            onClick={handlePasskeySignIn}
            className="text-primary hover:underline font-medium"
          >
            Sign in with Passkey
          </button>
        </div>
      </div>
    </div>
  );
}
