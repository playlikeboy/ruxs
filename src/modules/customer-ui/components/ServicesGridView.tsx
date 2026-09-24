"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoreVertical, Sparkles } from "lucide-react";
import type { ServiceCategory } from "../types";
import { CUSTOMER_ROUTES, buildCustomerUrl } from "../routes";
import { CatalogSvgIllustration } from "../svg-assets";

export function ServicesGridView({ categories }: { categories: ServiceCategory[] }) {
  const available = categories.filter((category) => category.id !== "ALL");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-28 pt-5 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer app</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-950">Services</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm">
          <MoreVertical size={18} />
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950">Every recurring service, in one place.</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Categories below are generated from the live marketplace catalog, so unavailable service types do not appear as dead-end UI.
            </p>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm font-semibold text-gray-900">No services are available yet.</p>
            <p className="mt-1 text-xs text-gray-500">Approved merchants will appear here as soon as they publish a service.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {available.map((category) => (
              <Link
                key={category.id}
                href={buildCustomerUrl(CUSTOMER_ROUTES.search, { category: category.id })}
                className="group rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-100">
                  <CatalogSvgIllustration idOrCategory={category.id} size={24} />
                </div>
                <p className="mt-3 text-sm font-bold text-gray-950">{category.label}</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {category.count} {category.count === 1 ? "item" : "items"}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                  Browse
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
