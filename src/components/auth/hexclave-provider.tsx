"use client";

import { HexclaveProvider } from "@hexclave/next";
import { hexclaveClient } from "@/lib/auth/client";
// The SDK's component styles. HexclaveTheme would inject them, but it calls eval(),
// which our CSP blocks, so scripts/build-hexclave-css.mjs pre-renders them instead.
// Without them every Hexclave button shows its hidden loading spinner.
import "@/app/hexclave-theme.css";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <HexclaveProvider app={hexclaveClient}>{children}</HexclaveProvider>;
}
