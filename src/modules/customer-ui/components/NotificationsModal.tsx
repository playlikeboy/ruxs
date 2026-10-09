"use client";

import React from "react";
import { ShoppingBag, Milk, Sparkles } from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { DSBottomSheet, DSButton } from "@/src/design-system";

export function NotificationsModal() {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationRead,
  } = useCustomerUI();

  return (
    <DSBottomSheet
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
      title="Notifications & Alerts"
      subtitle="Live updates on orders, society cutoffs and routines"
      maxWidth="max-w-md"
    >
      <div className="space-y-3 pb-4 text-ink font-sans">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`rounded-2xl border p-4 select-none cursor-pointer transition-colors ${
                notif.read
                  ? "border-border bg-surface-raised"
                  : "border-coral/40 bg-coral/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-band text-ink-muted">
                    {notif.type === "ORDER" ? (
                      <ShoppingBag size={16} className="text-action" />
                    ) : notif.type === "ROUTINE" ? (
                      <Milk size={16} className="text-coral" />
                    ) : (
                      <Sparkles size={16} className="text-[#B45309]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">{notif.title}</h4>
                    <span className="text-[10px] text-ink-muted">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-coral shrink-0 mt-1" />
                )}
              </div>

              <p className="mt-2.5 text-xs text-ink-muted leading-relaxed">
                {notif.message}
              </p>
            </div>
          ))
        )}

        <DSButton
          variant="outline"
          fullWidth
          onClick={() => setIsNotificationsOpen(false)}
        >
          Dismiss
        </DSButton>
      </div>
    </DSBottomSheet>
  );
}
