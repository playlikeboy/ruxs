import type { Metadata, Viewport } from "next";

// Installing from the merchant panel adds "RUXs Merchant", which opens straight to the panel.
export const metadata: Metadata = {
  manifest: "/merchant.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RUXs Merchant" },
};

export const viewport: Viewport = { themeColor: "#FFFDF8" };

export default function MerchantPanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
