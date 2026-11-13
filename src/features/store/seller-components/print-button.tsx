"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("primary", "sm", "print:hidden")}>
      <Printer className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  );
}
