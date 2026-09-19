import type { Metadata } from "next";
import HouseholdClient from "./HouseholdClient";

export const metadata: Metadata = {
  title: "Household management · RUXS",
  description: "Manage a shared household and member permissions.",
  alternates: { canonical: "https://ruxs.in/household" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Household management · RUXS",
    description: "Manage a shared household and member permissions.",
    url: "https://ruxs.in/household",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Household management · RUXS",
    description: "Manage a shared household and member permissions.",
  },
};

export default function Page() {
  return <HouseholdClient />;
}
