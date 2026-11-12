"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Bell, Check, Mail, Send, Smartphone } from "lucide-react";
import {
  sendTestNotificationEmail,
  updateNotificationPreferences,
} from "@/features/notifications/actions";
import type { NotificationPreferences } from "@/features/notifications/types";

type EmailPrefKey = "emailOrders" | "emailPlans" | "emailBills" | "emailReviews";

const EMAIL_TOGGLES: { key: EmailPrefKey; title: string; detail: string }[] = [
  { key: "emailOrders", title: "Orders & deliveries", detail: "Order confirmed, preparing, dispatched, and delivered" },
  { key: "emailPlans", title: "Daily plans & skips", detail: "Confirmation when you take today off or resume plans" },
  { key: "emailBills", title: "Monthly bills & receipts", detail: "Monthly khata statements and payment receipts" },
  { key: "emailReviews", title: "Reviews & replies", detail: "Notifies you when store owners reply to your review" },
];

/** Shows a local notification; some mobile browsers only allow this through the service worker. */
function showLocalNotification(title: string, body: string) {
  try {
    new window.Notification(title, { body, icon: "/icon" });
    return true;
  } catch {
    return false;
  }
}

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

  const handleToggle = (key: EmailPrefKey) => {
    const previous = prefs;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    startTransition(async () => {
      try {
        const res = await updateNotificationPreferences(updated);
        if (!res.ok) throw new Error(res.error);
        toast.success("Preferences updated");
      } catch {
        setPrefs(previous);
        toast.error("Couldn't save that change. Please try again.");
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
        toast.success("Device notifications enabled");
        showLocalNotification("RUXs notifications enabled", "You will now receive timely updates for your daily deliveries and orders.");
      } else if (permission === "denied") {
        toast.error("Notifications are blocked. Allow them for this site in your browser settings.");
      }
    } catch {
      toast.error("Could not request notification permissions");
    }
  };

  const handleTestEmail = async () => {
    if (!userEmail) {
      toast.error("Add an email address to your account first.");
      return;
    }
    setTestingEmail(true);
    try {
      const res = await sendTestNotificationEmail();
      if (res.ok) {
        toast.success(`Test email sent to ${userEmail}. Check your inbox.`);
      } else {
        toast.error(res.error || "Failed to send test email");
      }
    } catch {
      toast.error("Could not send the test email. Please try again.");
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
              <Mail className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Email Notifications</h3>
              <p className="text-xs text-muted">From notifications.ruxs.in</p>
            </div>
          </div>
          {userEmail && (
            <button
              type="button"
              disabled={testingEmail}
              onClick={handleTestEmail}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-semibold text-ink hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3 w-3 text-accent" aria-hidden="true" />
              {testingEmail ? "Sending…" : "Send test email"}
            </button>
          )}
        </div>

        <ul className="divide-y divide-black/5">
          {EMAIL_TOGGLES.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p id={`pref-${t.key}`} className="text-sm font-medium text-ink">{t.title}</p>
                <p id={`pref-${t.key}-desc`} className="text-xs text-muted">{t.detail}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[t.key]}
                aria-labelledby={`pref-${t.key}`}
                aria-describedby={`pref-${t.key}-desc`}
                disabled={pending}
                onClick={() => handleToggle(t.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  prefs[t.key] ? "bg-ink" : "bg-neutral-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    prefs[t.key] ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-neutral-800">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">PWA &amp; Device Notifications</h3>
              <p className="text-xs text-muted">Alerts on your phone or desktop screen</p>
            </div>
          </div>
          {pushStatus === "granted" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-good">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Enabled
            </span>
          ) : pushStatus === "unsupported" ? (
            <span className="text-xs text-muted">Not supported in this browser</span>
          ) : (
            <button
              type="button"
              onClick={handleRequestPush}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white hover:bg-ink/90 active:scale-95"
            >
              <Bell className="h-3 w-3" aria-hidden="true" /> Turn on
            </button>
          )}
        </div>

        {pushStatus === "granted" && (
          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
            <p className="text-xs text-muted">Device push is active for this device</p>
            <button
              type="button"
              onClick={() => {
                if (showLocalNotification("RUXs test notification", "Push notifications are working on this device.")) {
                  toast.success("Device notification sent");
                } else {
                  toast.error("This browser can't show a test notification here.");
                }
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
