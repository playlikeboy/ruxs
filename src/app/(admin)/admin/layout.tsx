import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/hexclave-provider";
import { Toaster } from "@/components/ui/toaster";

/** Platform admin lives apart from households and merchants, and is never indexed. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · RUXs Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
