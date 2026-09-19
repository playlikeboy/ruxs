import type { Metadata } from "next";
import OnboardClient from "./OnboardClient";

export const metadata: Metadata = {
  title: "Household setup · RUXS",
  description: "Set up household details and delivery preferences before starting recurring services.",
  alternates: { canonical: "https://ruxs.in/onboard" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Household setup · RUXS",
    description: "Set up household details and delivery preferences before starting recurring services.",
    url: "https://ruxs.in/onboard",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Household setup · RUXS",
    description: "Set up household details and delivery preferences before starting recurring services.",
  },
};

export default function Page() {
  return <OnboardClient />;
}
