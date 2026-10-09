import type { ReactNode } from "react";
import { Suspense } from "react";
import { CustomerAppShell } from "./CustomerAppShell";

export default function CustomerAppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CustomerAppShell>
        {children}
      </CustomerAppShell>
    </Suspense>
  );
}
