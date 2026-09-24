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
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href={CUSTOMER_ROUTES.home} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer app</p>
          <h1 className="mt-1 text-xl font-bold">Notifications</h1>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
          {unreadNotifCount} unread
        </span>
      </header>

      <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Bell size={21} />
            </div>
            <h2 className="mt-4 text-sm font-bold">You&apos;re all caught up.</h2>
            <p className="mt-1 text-xs text-gray-500">New delivery, routine and account updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const Icon = iconByType[notification.type] || Bell;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markNotificationRead(notification.id)}
                  className={`flex w-full gap-3 p-4 text-left transition hover:bg-gray-50 sm:p-5 ${notification.read ? "bg-white" : "bg-red-50/30"}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.read ? "bg-gray-100 text-gray-500" : "bg-red-500 text-white"}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-bold text-gray-900">{notification.title}</p>
                      {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{notification.message}</p>
                    <p className="mt-2 text-[10px] text-gray-400">{notification.timestamp}</p>
                  </div>
                  {notification.read && <CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
