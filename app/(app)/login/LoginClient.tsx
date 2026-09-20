"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHexclaveApp, useUser } from "@hexclave/next";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Role = "CUSTOMER" | "VENDOR_ADMIN" | "DELIVERY_STAFF" | "PLATFORM_ADMIN";

function isSafeInternalPath(value: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

function isDestinationAllowed(role: Role, path: string) {
  if (role === "PLATFORM_ADMIN") return path.startsWith("/");
  if (role === "VENDOR_ADMIN") return path.startsWith("/vendor/");
  if (role === "DELIVERY_STAFF") return path.startsWith("/delivery");
  return path.startsWith("/customer/");
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hexclaveApp = useHexclaveApp();
  const user = useUser();

  const requestedDestination = searchParams.get("redirect");
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resolveDestination = async (accountEmail: string) => {
    try {
      const res = await fetch("/api/auth/destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountEmail }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        data?: { role?: Role; destination?: string };
      };

      const role = data.data?.role || "CUSTOMER";
      const fallback = data.data?.destination || "/customer/dashboard";
      const requested = requestedDestination || "";

      if (isSafeInternalPath(requested) && isDestinationAllowed(role, requested)) {
        return requested;
      }

      return fallback;
    } catch {
      return "/customer/dashboard";
    }
  };

  useEffect(() => {
    const accountEmail =
      (user as any)?.primaryEmail ||
      (user as any)?.email ||
      "";

    if (!accountEmail || routing) return;

    let active = true;
    setRouting(true);

    void resolveDestination(accountEmail).then((destination) => {
      if (active) router.replace(destination);
    });

    return () => {
      active = false;
    };
  }, [user, requestedDestination, router]);

  const handleCredentialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result =
        authMode === "SIGN_IN"
          ? await hexclaveApp.signInWithCredential({
              email: email.trim(),
              password,
              noRedirect: true,
            })
          : await hexclaveApp.signUpWithCredential({
              email: email.trim(),
              password,
              noRedirect: true,
            });

      if (result.status === "error") {
        throw new Error(result.error.message || "Authentication failed.");
      }

      setSuccessMsg(authMode === "SIGN_IN" ? "Signed in. Opening your workspace…" : "Account created. Opening your workspace…");
      const destination = await resolveDestination(email.trim());
      window.setTimeout(() => router.replace(destination), 250);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await hexclaveApp.signInWithOAuth("google");
    } catch (err: any) {
      setError(err?.message || "Google sign-in could not be started.");
    }
  };

  const handleMagicLink = async () => {
    if (!email.includes("@")) {
      setError("Enter a valid email address first.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await hexclaveApp.sendMagicLinkEmail(email.trim());
      if (result.status === "error") {
        throw new Error(result.error.message || "Could not send magic link.");
      }
      setMagicLinkSent(true);
      setSuccessMsg("Magic link sent. Check your inbox to continue.");
    } catch (err: any) {
      setError(err?.message || "Could not send magic link.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await hexclaveApp.signInWithPasskey();
      if (result.status === "error") {
        throw new Error(result.error.message || "Passkey verification failed.");
      }
      setSuccessMsg("Passkey verified. Opening your workspace…");
    } catch (err: any) {
      setError(err?.message || "Passkey verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (routing) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold">Opening your workspace</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">RUXS is detecting your account access automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <BrandLogo className="w-24" priority />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3 w-3" />
            One account, the right workspace
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Welcome to RUXS</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in once. RUXS automatically opens the household, vendor or platform workspace attached to your account.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 shadow-2xl sm:p-7">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.025] text-xs font-semibold text-foreground transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">or continue with email</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-subtle focus:border-ring focus:bg-white/[0.035]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button type="button" onClick={handleMagicLink} className="text-[11px] font-semibold text-primary hover:text-foreground">
                  {magicLinkSent ? "Resend magic link" : "Use magic link"}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-subtle focus:border-ring focus:bg-white/[0.035]"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:brightness-105 disabled:opacity-50"
            >
              {loading ? "Signing in…" : authMode === "SIGN_IN" ? "Sign in" : "Create account"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-5 text-xs">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "SIGN_IN" ? "SIGN_UP" : "SIGN_IN")}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {authMode === "SIGN_IN" ? "Create an account" : "Already registered?"}
            </button>
            <button
              type="button"
              onClick={handlePasskeySignIn}
              className="inline-flex items-center gap-1.5 font-semibold text-primary"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Passkey
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-subtle">
          <ShieldCheck className="h-3.5 w-3.5" />
          Role-based access is detected from your account. Admin access is never selected on this screen.
        </div>
      </div>
    </div>
  );
}
