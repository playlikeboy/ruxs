import React from "react";
import Image from "next/image";

export function RuxsSpinner({ className = "w-5 h-5", color = "text-primary" }: { className?: string; color?: string }) {
  return (
    <svg
      className={`animate-spin ${className} ${color}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function RuxsSkeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer-pulse rounded-xl ${className}`} />;
}

export function RuxsPageLoading({
  badge = "RUXS • Operating Layer",
  title = "Syncing everyday routines",
  description = "Checking delivery cutoff windows, khata balances, and doorstep drop status…",
  fullPage = true,
}: {
  badge?: string;
  title?: string;
  description?: string;
  fullPage?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center select-none ${
        fullPage ? "min-h-[75vh]" : "min-h-[360px]"
      }`}
    >
      <div className="relative flex flex-col items-center max-w-sm mx-auto">
        {/* Ambient Glow */}
        <div className="absolute -top-10 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none -z-10" />

        {/* Branded Emblem with Radiant Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/30 to-primary/0 blur-md animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl border border-white/[0.12] bg-[#101412] flex items-center justify-center shadow-2xl">
            <Image
              src="/brand/logo-mark.svg"
              alt="RUXS"
              width={28}
              height={28}
              className="drop-shadow-md animate-pulse"
              priority
            />
          </div>
          {/* Subtle orbiting spinner dot */}
          <div className="absolute -inset-1 rounded-[18px] border border-primary/30 border-dashed animate-spin [animation-duration:8s]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span>{badge}</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl mb-2">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-6">
          {description}
        </p>

        {/* Indeterminate Sleek Progress Rail */}
        <div className="w-48 h-1 rounded-full bg-white/[0.06] overflow-hidden relative">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

export function RuxsDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Hero Banner Skeleton */}
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <RuxsSkeleton className="h-5 w-28" />
          <RuxsSkeleton className="h-5 w-32" />
        </div>
        <RuxsSkeleton className="h-10 w-2/3 max-w-md" />
        <RuxsSkeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-3 pt-2">
          <RuxsSkeleton className="h-10 w-32 rounded-xl" />
          <RuxsSkeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center">
              <RuxsSkeleton className="h-3 w-20" />
              <RuxsSkeleton className="h-7 w-7 rounded-lg" />
            </div>
            <RuxsSkeleton className="h-7 w-24" />
            <RuxsSkeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
            <RuxsSkeleton className="h-5 w-40" />
            <RuxsSkeleton className="h-5 w-16 rounded-full" />
          </div>
          <RuxsSkeleton className="h-20 w-full rounded-xl" />
          <RuxsSkeleton className="h-20 w-full rounded-xl" />
          <RuxsSkeleton className="h-20 w-full rounded-xl" />
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
            <RuxsSkeleton className="h-5 w-32" />
            <RuxsSkeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <RuxsSkeleton className="h-12 w-full rounded-lg" />
            <RuxsSkeleton className="h-12 w-full rounded-lg" />
            <RuxsSkeleton className="h-12 w-full rounded-lg" />
            <RuxsSkeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RuxsCardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <RuxsSkeleton className="h-4 w-36" />
              <RuxsSkeleton className="h-4 w-16 rounded-full" />
            </div>
            <RuxsSkeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <RuxsSkeleton className="h-8 w-20 rounded-xl" />
            <RuxsSkeleton className="h-8 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
