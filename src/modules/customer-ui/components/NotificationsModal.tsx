"use client";

import React from "react";
import { ShoppingBag, Milk, Sparkles, Check } from "lucide-react";
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
      title="Notifications"
      subtitle="Live updates on orders, society cutoffs and offers"
      maxWidth="max-w-md"
    >
      <div className="space-y-3 pb-4 text-gray-900 font-sans">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`rounded-2xl border p-4 select-none cursor-pointer ${
                notif.read
                  ? "border-gray-100 bg-white"
                  : "border-red-200 bg-red-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    {notif.type === "ORDER" ? (
                      <ShoppingBag size={16} className="text-red-500" />
                    ) : notif.type === "ROUTINE" ? (
                      <Milk size={16} className="text-blue-500" />
                    ) : (
                      <Sparkles size={16} className="text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{notif.title}</h4>
                    <span className="text-[10px] text-gray-400">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1" />
                )}
              </div>

              <p className="mt-2.5 text-xs text-gray-600 leading-relaxed">
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
