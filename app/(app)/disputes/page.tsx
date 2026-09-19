import type { Metadata } from "next";
import DisputesClient from "./DisputesClient";

export const metadata: Metadata = {
  title: "Disputes · RUXS",
  description: "Review and resolve recurring-service delivery and billing disputes.",
  alternates: { canonical: "https://ruxs.in/disputes" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Disputes · RUXS",
    description: "Review and resolve recurring-service delivery and billing disputes.",
    url: "https://ruxs.in/disputes",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Disputes · RUXS",
    description: "Review and resolve recurring-service delivery and billing disputes.",
  },
};

export default function Page() {
  return <DisputesClient />;
}
