"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { ServiceCategory } from "../types";
import { CUSTOMER_ROUTES, buildCustomerUrl } from "../routes";
import { CatalogSvgIllustration } from "../svg-assets";

export function ServicesGridView({ categories }: { categories: ServiceCategory[] }) {
  const available = categories.filter((category) => category.id !== "ALL");

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 pb-28 pt-5 text-ink font-sans">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink shadow-xs hover:bg-surface-band transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            Customer App
          </p>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-ink font-display">
            Society Services
          </h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/15 text-action">
          <Sparkles size={18} />
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/15 border border-coral/30 text-action">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink font-display">
              Every recurring service, quietly handled.
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Pre-cleared milkmen, 20L water distributors, homestyle meals, puja flowers, and pet walkers with direct gate entry.
            </p>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center bg-surface-band">
            <p className="text-sm font-bold text-ink">No services are published yet.</p>
            <p className="mt-1 text-xs text-ink-muted">
              Approved merchants will appear here as soon as they activate their catalog.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {available.map((category) => (
              <Link
                key={category.id}
                href={buildCustomerUrl(CUSTOMER_ROUTES.search, { category: category.id })}
                className="group rounded-2xl border border-border bg-surface-band p-4 transition-all hover:border-action/40 hover:bg-surface-subtle flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised border border-border shadow-xs">
                    <CatalogSvgIllustration idOrCategory={category.id} size={28} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-ink group-hover:text-action transition-colors font-display">
                    {category.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {category.count} {category.count === 1 ? "item" : "items"}
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-action">
                  <span>Explore</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
