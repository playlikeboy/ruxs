import type { Metadata } from "next";
import CustomerDashboardClient from "./CustomerDashboardClient";

export const metadata: Metadata = {
  title: "Household overview · RUXS",
  description: "Manage recurring services, today's delivery, your digital Khata and invoices.",
  alternates: { canonical: "https://ruxs.in/customer/dashboard" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerDashboardClient />;
}
