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
  badge = "RUXS",
  title = "Loading workspace…",
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
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center select-none animate-in fade-in duration-200 ${
        fullPage ? "min-h-[70vh]" : "min-h-[260px]"
      }`}
    >
      <div className="w-full max-w-xs bg-gradient-to-b from-sky-50/50 to-white rounded-3xl border border-blue-100/80 shadow-lg shadow-black/[0.03] p-7 flex flex-col items-center text-center text-black">
        {/* Minimal squircle icon badge */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white mb-4 shadow-sm border border-blue-50">
          <svg
            className="animate-spin w-5 h-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Minimal Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-blue-100 text-[10px] font-medium text-blue-900 mb-2">
          {badge}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h3>

        {/* Description */}
        {description && (
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed max-w-[220px]">
            {description}
          </p>
        )}

        {/* Minimal 3-dot pulse */}
        <div className="flex items-center gap-1.5 mt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse [animation-delay:300ms]" />
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
