"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className:
          "bg-white text-[#1C1B19] border border-[#E7E5DF] rounded-[10px] shadow-sm text-sm",
      }}
    />
  );
}
