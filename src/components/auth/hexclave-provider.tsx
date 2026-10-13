"use client";

import { HexclaveProvider } from "@hexclave/next";
import { hexclaveClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <HexclaveProvider app={hexclaveClient}>{children}</HexclaveProvider>;
}
