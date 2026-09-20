import type { Metadata } from "next";
import VendorDashboardClient from "./VendorDashboardClient";

export const metadata: Metadata = {
  title: "Vendor operations · RUXS",
  description: "Run today's recurring demand, kitchen production and subscriber operations.",
  alternates: { canonical: "https://ruxs.in/vendor/dashboard" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VendorDashboardClient />;
}
