"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Bell, BellOff, Check, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui/cn";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { sendMyTestAlert } from "@/features/notifications/actions";
import { usePushAlerts } from "./push-toggle";

const DISMISS_KEY = "ruxs_merchant_app_nudge";
const noSubscribe = () => () => {};

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

const PUSH_LABEL = {
  unsupported: "Not available in this browser",
  blocked: "Blocked. Allow notifications for ruxs.in in your browser settings.",
  off: "Get a ping for every new order and booking request, even when the app is closed.",
  on: "On for this phone.",
  working: "Checking…",
} as const;

function Row({ icon: Icon, title, detail, done, children }: { icon: typeof Bell; title: string; detail: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", done ? "bg-mint text-good" : "bg-peach text-accent")}>
        {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{detail}</p>
      </div>
      {children ? <div className="shrink-0 self-center">{children}</div> : null}
    </div>
  );
}

const button = "inline-flex min-h-10 items-center justify-center rounded-[12px] px-3.5 text-sm font-semibold transition-colors disabled:opacity-60";

/**
 * Set up the merchant app on this phone: install it and turn on order alerts.
 * `nudge` hides itself once both are done or the merchant dismisses it.
 */
export function MerchantAppCard({ vapidPublicKey, testPath, variant = "full" }: { vapidPublicKey: string | null; testPath: string; variant?: "full" | "nudge" }) {
  const { state: installState, install } = useInstallPrompt();
  const push = usePushAlerts(vapidPublicKey);
  const storedDismiss = useSyncExternalStore(noSubscribe, readDismissed, () => true);
  const [dismissedNow, setDismissed] = useState(false);
  const dismissed = storedDismiss || dismissedNow;
  const [pending, startTransition] = useTransition();

  const installed = installState === "installed";
  const alertsOn = push.state === "on";
  if (variant === "nudge" && (dismissed || (installed && (alertsOn || push.state === "unsupported")))) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: it just shows again next time */
    }
  };

  return (
    <section aria-labelledby="merchant-app-title" className="rounded-[16px] border border-line bg-surface px-4 pt-3 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="merchant-app-title" className="text-base font-semibold text-ink">Your shop on your phone</h2>
        {variant === "nudge" && (
          <button type="button" onClick={dismiss} aria-label="Hide" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="divide-y divide-line">
        <Row
          icon={Smartphone}
          title={installed ? "Merchant app installed" : "Install the merchant app"}
          detail={
            installed
              ? "Open RUXs Merchant from your home screen."
              : installState === "ios"
                ? "In Safari, tap Share, then Add to Home Screen."
                : installState === "ready"
                  ? "Opens straight to your orders, like any other app."
                  : "Open this page in Chrome on your phone to install it."
          }
          done={installed}
        >
          {installState === "ready" && (
            <button type="button" onClick={() => void install()} className={cn(button, "bg-ink text-bg hover:bg-[#383D36]")}>
              Install
            </button>
          )}
        </Row>
        <Row icon={push.state === "blocked" ? BellOff : Bell} title="Order alerts" detail={PUSH_LABEL[push.state]} done={alertsOn}>
          {push.state === "off" && (
            <button
              type="button"
              onClick={() => startTransition(async () => {
                const error = await push.enable();
                if (error) toast.error(error);
                else toast.success("Alerts are on for this phone");
              })}
              disabled={pending}
              className={cn(button, "bg-accent text-white hover:bg-[#A53F22]")}
            >
              Turn on
            </button>
          )}
          {alertsOn && variant === "full" && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await sendMyTestAlert({ path: testPath });
                  toast.success("Test alert sent. Check your notifications and email.");
                })}
                className={cn(button, "border border-line bg-bg text-ink hover:border-ink/30")}
              >
                Send test
              </button>
              <button type="button" disabled={pending} onClick={() => startTransition(() => push.disable())} className={cn(button, "text-muted hover:text-ink")}>
                Turn off
              </button>
            </div>
          )}
        </Row>
      </div>
    </section>
  );
}
