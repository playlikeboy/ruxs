import type { Metadata } from "next";
import CustomerDashboardClient from "./CustomerDashboardClient";

export const metadata: Metadata = {
  title: "Household dashboard · RUXS",
  description: "Manage recurring household services, fulfillment and account activity.",
  alternates: { canonical: "https://ruxs.in/customer/dashboard" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Household dashboard · RUXS",
    description: "Manage recurring household services, fulfillment and account activity.",
    url: "https://ruxs.in/customer/dashboard",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Household dashboard · RUXS",
    description: "Manage recurring household services, fulfillment and account activity.",
  },
};

export default function Page() {
  return <CustomerDashboardClient />;
}
