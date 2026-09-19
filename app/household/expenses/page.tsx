import type { Metadata } from "next";
import HouseholdExpensesClient from "./HouseholdExpensesClient";

export const metadata: Metadata = {
  title: "Household expenses · RUXS",
  description: "Manage shared household expense workflows.",
  alternates: { canonical: "https://ruxs.in/household/expenses" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Household expenses · RUXS",
    description: "Manage shared household expense workflows.",
    url: "https://ruxs.in/household/expenses",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Household expenses · RUXS",
    description: "Manage shared household expense workflows.",
  },
};

export default function Page() {
  return <HouseholdExpensesClient />;
}
