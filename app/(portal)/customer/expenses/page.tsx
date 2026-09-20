import type { Metadata } from "next";
import HouseholdExpensesClient from "./HouseholdExpensesClient";

export const metadata: Metadata = {
  title: "Household expenses · RUXS",
  description: "Review shared household expenses and settle your exact share.",
  alternates: { canonical: "https://ruxs.in/customer/expenses" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HouseholdExpensesClient />;
}
