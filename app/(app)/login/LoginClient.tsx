"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useHexclaveApp, SignIn, UserButton } from "@hexclave/next";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hexclaveApp = useHexclaveApp();
  const user = useUser();

  const redirectParam = searchParams.get("redirect") || "";

  // Auto redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const isSuperAdmin =
        user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com";
      if (redirectParam) {
        router.push(redirectParam);
      } else if (isSuperAdmin) {
        router.push("/admin");
      } else {
        router.push("/customer/dashboard");
      }
    }
  }, [user, redirectParam, router]);

  // If user is already authenticated
  if (user) {
    const isSuperAdmin =
      user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com";

    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="flex justify-center">
            <UserButton showUserInfo={false} />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Hexclave Session Active
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {user.displayName || user.primaryEmail || (user as any).email || user.id}
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
              onClick={() => router.push(isSuperAdmin ? "/admin" : (redirectParam || "/customer/dashboard"))}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span>{isSuperAdmin ? "Launch Platform Admin Mission Control" : "Continue to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

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
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full mb-4 text-center space-y-2">
        <Link href="/" className="inline-block">
          <BrandLogo className="w-24 mx-auto" priority />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In with Hexclave</h1>
        <p className="text-xs text-muted-foreground">
          Centralised, secure authentication for recurring local household services.
        </p>
      </div>

      {redirectParam.includes("admin") && (
        <div className="max-w-md w-full mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Platform Admin Console: Only <strong>sh20raj@gmail.com</strong> is authorized.</span>
        </div>
      )}

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
        <SignIn
          fullPage={false}
          automaticRedirect={true}
        />
      </div>
    </div>
  );
}
