"use client";

import React from "react";
import { ArrowLeft, Bell, Check, Sparkles, AlertCircle } from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { DSBottomSheet, DSButton } from "@/src/design-system";

export function NotificationsModal() {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationRead,
    setActiveTab,
  } = useCustomerUI();

  return (
    <DSBottomSheet
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
      title="Notifications"
      subtitle="Live updates on orders, society cutoffs and offers"
      maxWidth="max-w-md"
    >
      <div className="space-y-3 pb-4">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`rounded-2xl border p-4 transition-all ${
                notif.read
                  ? "border-white/[0.06] bg-white/[0.015]"
                  : "border-emerald-500/30 bg-emerald-500/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-base">
                    {notif.type === "ORDER" ? "🍕" : notif.type === "ROUTINE" ? "🥛" : "🎁"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                )}
              </div>

              <p className="mt-2.5 text-xs text-foreground/90 leading-relaxed">
                {notif.message}
              </p>

              {/* Action Buttons (Screen 5: Decline & View Details) */}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => markNotificationRead(notif.id)}
                  className="rounded-xl border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-white/[0.05] transition"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(notif.id);
                    setIsNotificationsOpen(false);
                    if (notif.type === "ORDER") setActiveTab("tracking");
                  }}
                  className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-[11px] font-bold text-black hover:bg-emerald-400 transition shadow"
                >
                  {notif.actionLabel || "View Details"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DSBottomSheet>
  );
}
