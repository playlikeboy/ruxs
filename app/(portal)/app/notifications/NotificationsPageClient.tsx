"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2, Package, Sparkles, Settings2 } from "lucide-react";
import { useCustomerUI } from "@/src/modules/customer-ui";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";

const iconByType = {
  ORDER: Package,
  ROUTINE: Sparkles,
  OFFER: Bell,
  SYSTEM: Settings2,
} as const;

export default function NotificationsPageClient() {
  const { notifications, unreadNotifCount, markNotificationRead } = useCustomerUI();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5 text-ink font-sans">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink shadow-xs hover:bg-surface-band transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            Customer App
          </p>
          <h1 className="mt-1 text-lg font-bold font-display">Notifications</h1>
        </div>
        <span className="rounded-full bg-coral/15 border border-coral/30 px-2.5 py-1 text-[10px] font-bold text-action">
          {unreadNotifCount} unread
        </span>
      </header>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-card">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-band text-action">
              <Bell size={24} />
            </div>
            <h2 className="mt-4 text-base font-bold text-ink font-display">You&apos;re all caught up</h2>
            <p className="mt-1 text-xs text-ink-muted">
              New delivery updates, cutoff notifications and khata receipts will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = iconByType[notification.type] || Bell;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markNotificationRead(notification.id)}
                  className={`flex w-full gap-3.5 p-4 text-left transition-colors sm:p-5 cursor-pointer ${
                    notification.read
                      ? "bg-surface-raised text-ink-muted hover:bg-surface-band"
                      : "bg-coral/5 text-ink hover:bg-coral/10"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      notification.read
                        ? "bg-surface-band text-ink-muted"
                        : "bg-coral/15 text-action"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink truncate">
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-ink-muted shrink-0">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-coral shrink-0 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
