"use client";

import { useState, useSyncExternalStore } from "react";
import { Lightbulb, X } from "lucide-react";

const noSubscribe = () => () => {};

function dismissed(id: string) {
  try {
    return localStorage.getItem("ruxs_hint_" + id) === "1";
  } catch {
    return false;
  }
}

/** A one-line tip that stays dismissed on this device once closed. */
export function Hint({ id, children }: { id: string; children: React.ReactNode }) {
  const stored = useSyncExternalStore(noSubscribe, () => dismissed(id), () => true);
  const [closed, setClosed] = useState(false);
  if (stored || closed) return null;
  return (
    <div role="note" className="flex items-start gap-3 rounded-[16px] border border-line bg-brand-butter/70 px-4 py-3 text-sm text-ink">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{children}</p>
      <button
        type="button"
        aria-label="Dismiss tip"
        onClick={() => {
          setClosed(true);
          try {
            localStorage.setItem("ruxs_hint_" + id, "1");
          } catch {
            /* shows again next visit */
          }
        }}
        className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/60 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
