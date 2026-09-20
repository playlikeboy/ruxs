"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export function RuxsSpinner({
  className = "w-5 h-5",
  color = "text-primary",
  size,
}: {
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9",
  };

  const finalClass = size ? sizeClasses[size] : className;

  return (
    <svg
      className={`animate-spin shrink-0 ${finalClass} ${color}`}
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

const DEFAULT_SYNC_STEPS = [
  "Connecting to encrypted operating layer…",
  "Reconciling daily routine ledgers…",
  "Checking delivery cutoff windows & khata…",
  "Readying live doorstep workspace…",
];

export function RuxsPageLoading({
  badge = "RUXS • Operating Layer",
  title = "Handling recurring life, quietly",
  description,
  steps = DEFAULT_SYNC_STEPS,
  fullPage = true,
}: {
  badge?: string;
  title?: string;
  description?: string;
  steps?: string[];
  fullPage?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (description || !steps.length) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [description, steps.length]);

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center select-none animate-in fade-in duration-300 ${
        fullPage ? "min-h-[75vh]" : "min-h-[360px]"
      }`}
    >
      <div className="relative flex flex-col items-center max-w-sm mx-auto">
        {/* Ambient Glow */}
        <div className="absolute -top-12 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none -z-10 animate-pulse" />

        {/* Branded Emblem with Radiant Orbital Ring */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/25 via-emerald-400/10 to-transparent blur-lg animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl border border-white/[0.12] bg-[#101412]/90 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Image
              src="/brand/logo-mark.svg"
              alt="RUXS"
              width={28}
              height={28}
              className="drop-shadow-md animate-pulse"
              priority
            />
          </div>
          {/* Subtle orbiting dashed ring */}
          <div className="absolute -inset-1.5 rounded-[20px] border border-primary/30 border-dashed animate-spin [animation-duration:9s]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/25 bg-primary/10 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary mb-3.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span>{badge}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl mb-2">
          {title}
        </h2>

        {/* Description or Dynamic Telemetry Steps */}
        <div className="h-10 flex items-center justify-center mb-6">
          <p
            key={description || stepIndex}
            className="text-xs text-muted-foreground leading-relaxed max-w-xs transition-opacity duration-300 animate-in fade-in"
          >
            {description || steps[stepIndex]}
          </p>
        </div>

        {/* Indeterminate Sleek Progress Rail */}
        <div className="w-52 h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/30 via-primary to-emerald-400 animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

export function RuxsDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-300">
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

export function RuxsAdminSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-300">
      {/* Admin Top Header Skeleton */}
      <div className="border-b border-white/[0.08] bg-[#101412]/50 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RuxsSkeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <RuxsSkeleton className="h-5 w-48" />
              <RuxsSkeleton className="h-3.5 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RuxsSkeleton className="h-9 w-24 rounded-lg" />
            <RuxsSkeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 space-y-6">
        {/* Navigation Tabs Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
          {Array.from({ length: 7 }).map((_, i) => (
            <RuxsSkeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
          ))}
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
              <div className="flex justify-between items-center">
                <RuxsSkeleton className="h-3 w-24" />
                <RuxsSkeleton className="h-8 w-8 rounded-lg" />
              </div>
              <RuxsSkeleton className="h-8 w-32" />
              <RuxsSkeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Operations Cluster Banner */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
            <RuxsSkeleton className="h-5 w-44" />
            <RuxsSkeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RuxsSkeleton className="h-24 rounded-xl" />
            <RuxsSkeleton className="h-24 rounded-xl" />
            <RuxsSkeleton className="h-24 rounded-xl" />
          </div>
        </div>

        {/* Data Table Skeleton */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
            <RuxsSkeleton className="h-5 w-36" />
            <RuxsSkeleton className="h-8 w-28 rounded-lg" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RuxsSkeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <RuxsSkeleton className="h-4 w-32" />
                  <RuxsSkeleton className="h-3 w-24" />
                </div>
              </div>
              <RuxsSkeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RuxsCardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
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

export function RuxsHouseholdSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <RuxsSkeleton className="h-4 w-28 rounded-full" />
          <RuxsSkeleton className="h-6 w-20 rounded-full" />
        </div>
        <RuxsSkeleton className="h-9 w-64" />
        <RuxsSkeleton className="h-4 w-80" />
      </div>

      {/* Flatmates Strip */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
        <div className="flex justify-between items-center">
          <RuxsSkeleton className="h-4 w-32" />
          <RuxsSkeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="flex gap-3 overflow-x-auto py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <RuxsSkeleton key={i} className="h-12 w-40 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Active Routines List */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
        <RuxsSkeleton className="h-5 w-44" />
        <RuxsCardListSkeleton count={2} />
      </div>
    </div>
  );
}
