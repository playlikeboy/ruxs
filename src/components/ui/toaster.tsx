"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className:
          "bg-surface text-ink border border-line rounded-control shadow-sm text-sm",
      }}
    />
  );
}
