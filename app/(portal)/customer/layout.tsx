import type { ReactNode } from "react";
import CustomerPortalNav from "@/components/portal/CustomerPortalNav";

export default function CustomerPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0d0c] text-foreground">
      <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
        <CustomerPortalNav />
        <main className="min-h-[calc(100vh-64px)] min-w-0 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
