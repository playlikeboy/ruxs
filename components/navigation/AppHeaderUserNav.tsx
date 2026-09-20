"use client";

import React from "react";
import Link from "next/link";
import { useUser, UserButton } from "@hexclave/next";
import { ShieldCheck, LayoutDashboard } from "lucide-react";

export function AppHeaderUserNav() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
        >
          Sign in
        </Link>
        <Link href="/subscribe" className="ds-button min-h-10 px-4 text-xs font-semibold">
          Get started
        </Link>
      </div>
    );
  }

  const isSuperAdmin =
    user.primaryEmail === "sh20raj@gmail.com" || (user as any).email === "sh20raj@gmail.com";

  return (
    <div className="flex items-center gap-3">
      {isSuperAdmin && (
        <Link
          href="/admin"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </Link>
      )}

      <Link
        href="/customer/dashboard"
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card/60 text-xs font-medium text-foreground hover:bg-card transition-colors"
      >
        <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
        <span>My Account</span>
      </Link>

      <Link
        href="/subscribe"
        className="hidden sm:inline-flex ds-button min-h-9 px-3.5 text-xs font-semibold"
      >
        + Service
      </Link>

      <div className="flex items-center pl-1">
        <UserButton showUserInfo={false} />
      </div>
    </div>
  );
}
