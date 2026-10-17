"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Bell, Check, Mail, Send, Smartphone } from "lucide-react";
import {
  sendTestNotificationEmail,
  updateNotificationPreferences,
} from "@/features/notifications/actions";
import type { NotificationPreferences } from "@/features/notifications/types";

function subscribePush() {
  return () => {};
}

function getPushSnapshot(): "granted" | "denied" | "default" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
}

function getServerPushSnapshot(): "granted" | "denied" | "default" | "unsupported" {
  return "default";
}

export function NotificationSettings({
  initial,
  userEmail,
}: {
  initial: NotificationPreferences;
  userEmail?: string | null;
}) {
  const [prefs, setPrefs] = useState({
    emailOrders: initial.emailOrders,
    emailPlans: initial.emailPlans,
    emailBills: initial.emailBills,
    emailReviews: initial.emailReviews,
    pwaPush: initial.pwaPush,
  });

  const [pending, startTransition] = useTransition();
  const [testingEmail, setTestingEmail] = useState(false);
  const [pushOverride, setPushOverride] = useState<"granted" | "denied" | "default" | "unsupported" | null>(null);
  const browserPushStatus = useSyncExternalStore(subscribePush, getPushSnapshot, getServerPushSnapshot);
  const pushStatus = pushOverride ?? browserPushStatus;

  const handleToggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    startTransition(async () => {
      const res = await updateNotificationPreferences(updated);
      if (res.ok) {
        toast.success("Preferences updated");
      } else {
        toast.error("Failed to update preferences");
      }
    });
  };

  const handleRequestPush = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setPushOverride(permission);
      if (permission === "granted") {
        toast.success("Device notifications enabled!");
        new window.Notification("RUXs Notifications Enabled", {
          body: "You will now receive timely updates for your daily deliveries and orders.",
          icon: "/icon",
        });
      } else if (permission === "denied") {
        toast.error("Notifications were blocked. Please enable them in browser settings.");
      }
    } catch {
      toast.error("Could not request notification permissions");
    }
  };

  const handleTestEmail = async () => {
    if (!userEmail) {
      toast.error("No email associated with account");
      return;
    }
    setTestingEmail(true);
    try {
      const res = await sendTestNotificationEmail();
      if (res.ok) {
        toast.success(`Test email sent to ${userEmail}! Check your inbox.`);
      } else {
        toast.error(res.error || "Failed to send test email");
      }
    } catch {
      toast.error("Error sending test email");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-peach text-accent">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Email Notifications</h3>
              <p className="text-xs text-neutral-500">From notifications.ruxs.in</p>
            </div>
          </div>
          {userEmail && (
            <button
              type="button"
              disabled={testingEmail}
              onClick={handleTestEmail}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-semibold text-ink hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3 w-3 text-accent" />
              {testingEmail ? "Sending…" : "Send test email"}
            </button>
          )}
        </div>

        <ul className="divide-y divide-black/5">
          <li className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium text-ink">Orders &amp; deliveries</p>
              <p className="text-xs text-neutral-500">Order confirmed, preparing, dispatched, and delivered</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.emailOrders}
              disabled={pending}
              onClick={() => handleToggle("emailOrders")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                prefs.emailOrders ? "bg-ink" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                  prefs.emailOrders ? "translate-x-5.5 mt-0.5" : "translate-x-0.5 mt-0.5"
                }`}
              />
            </button>
          </li>

          <li className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium text-ink">Daily plans &amp; skips</p>
              <p className="text-xs text-neutral-500">Confirmation when you take today off or resume plans</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.emailPlans}
              disabled={pending}
              onClick={() => handleToggle("emailPlans")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                prefs.emailPlans ? "bg-ink" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                  prefs.emailPlans ? "translate-x-5.5 mt-0.5" : "translate-x-0.5 mt-0.5"
                }`}
              />
            </button>
          </li>

          <li className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium text-ink">Monthly bills &amp; receipts</p>
              <p className="text-xs text-neutral-500">Monthly khata statements and payment receipts</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.emailBills}
              disabled={pending}
              onClick={() => handleToggle("emailBills")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                prefs.emailBills ? "bg-ink" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                  prefs.emailBills ? "translate-x-5.5 mt-0.5" : "translate-x-0.5 mt-0.5"
                }`}
              />
            </button>
          </li>

          <li className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium text-ink">Reviews &amp; replies</p>
              <p className="text-xs text-neutral-500">Notifies you when store owners reply to your review</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.emailReviews}
              disabled={pending}
              onClick={() => handleToggle("emailReviews")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                prefs.emailReviews ? "bg-ink" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                  prefs.emailReviews ? "translate-x-5.5 mt-0.5" : "translate-x-0.5 mt-0.5"
                }`}
              />
            </button>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-neutral-800">
              <Smartphone className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">PWA &amp; Device Notifications</h3>
              <p className="text-xs text-neutral-500">Alerts on your phone or desktop screen</p>
            </div>
          </div>
          {pushStatus === "granted" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-good">
              <Check className="h-3.5 w-3.5" /> Enabled
            </span>
          ) : pushStatus === "unsupported" ? (
            <span className="text-xs text-neutral-400">Unsupported</span>
          ) : (
            <button
              type="button"
              onClick={handleRequestPush}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95"
            >
              <Bell className="h-3 w-3" /> Turn on
            </button>
          )}
        </div>

        {pushStatus === "granted" && (
          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
            <p className="text-xs text-neutral-500">Device push is active for this device</p>
            <button
              type="button"
              onClick={() => {
                new window.Notification("RUXs Test Notification", {
                  body: "Push notifications are working smoothly on your device! 🔔",
                  icon: "/icon",
                });
                toast.success("Device notification sent!");
              }}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Test push alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
