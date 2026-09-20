import type { Metadata } from "next";
import OnboardClient from "./OnboardClient";

export const metadata: Metadata = {
  title: "Household setup · RUXS",
  description: "Set up your household profile and doorstep delivery preferences.",
  alternates: { canonical: "https://ruxs.in/customer/onboard" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OnboardClient />;
}
