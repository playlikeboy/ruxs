import type { Metadata } from "next";
import HouseholdClient from "./HouseholdClient";

export const metadata: Metadata = {
  title: "Household · RUXS",
  description: "Manage shared household members, permissions and shared recurring services.",
  alternates: { canonical: "https://ruxs.in/customer/household" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HouseholdClient />;
}
