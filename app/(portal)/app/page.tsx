import type { Metadata } from "next";
import AppClient from "./AppClient";

export const metadata: Metadata = {
  title: "RUXS App · Daily Household Subscriptions, Food & Local Services",
  description:
    "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry, and live delivery tracking.",
  alternates: {
    canonical: "https://ruxs.in/app",
  },
  openGraph: {
    title: "RUXS App · Daily Household Subscriptions, Food & Local Services",
    description:
      "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry, and live delivery tracking.",
    url: "https://ruxs.in/app",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS App · Daily Household Subscriptions & Food Delivery",
    description:
      "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry, and live delivery tracking.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AppPage() {
  return <AppClient />;
}
