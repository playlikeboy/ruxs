import type { Metadata } from "next";
import VendorDashboardClient from "./VendorDashboardClient";

export const metadata: Metadata = {
  title: "Vendor operations · RUXS",
  description: "Run daily recurring-service preparation, subscriber and cutoff operations.",
  alternates: { canonical: "https://ruxs.in/vendor/dashboard" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Vendor operations · RUXS",
    description: "Run daily recurring-service preparation, subscriber and cutoff operations.",
    url: "https://ruxs.in/vendor/dashboard",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendor operations · RUXS",
    description: "Run daily recurring-service preparation, subscriber and cutoff operations.",
  },
};

export default function Page() {
  return <VendorDashboardClient />;
}
