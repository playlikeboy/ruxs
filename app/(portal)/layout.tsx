import type { ReactNode } from "react";

export default function PortalRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  );
}
