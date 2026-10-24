"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { setTapFeedback, tapFeedback, tapFeedbackEnabled } from "@/lib/tap-feedback";

const TARGET = 'a[href], button:not([disabled]), [role="button"], [role="radio"], [role="tab"], summary, input[type="checkbox"], input[type="radio"]';

/** Mount once per shell: gives every tappable control a light buzz and tick. */
export function TapFeedback() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return; // touch and pen only; desktop clicks stay silent
      const el = (e.target as Element | null)?.closest(TARGET);
      if (el && !el.closest("[data-no-feedback]")) tapFeedback();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}

const noSubscribe = () => () => {};

/** On/off switch for tap sounds and vibration on this device. */
export function TapFeedbackSwitch() {
  const stored = useSyncExternalStore(noSubscribe, tapFeedbackEnabled, () => true);
  const [override, setOverride] = useState<boolean | null>(null);
  const on = override ?? stored;
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 text-sm text-ink">
      <span>
        <span className="block font-semibold">Tap sounds and vibration</span>
        <span className="block text-muted">A soft tick and buzz when you tap, on this device.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => {
          setTapFeedback(e.target.checked);
          setOverride(e.target.checked);
          if (e.target.checked) tapFeedback();
        }}
        className="h-6 w-11 shrink-0 cursor-pointer accent-accent"
      />
    </label>
  );
}
