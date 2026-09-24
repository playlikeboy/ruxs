import type { Metadata } from "next";
import TrackingPageClient from "./TrackingPageClient";

export const metadata: Metadata = {
  title: "Delivery Tracking | RUXS",
  description: "Track the latest RUXS household fulfillment and delivery status.",
  alternates: { canonical: "https://ruxs.in/app/tracking" },
  robots: { index: false, follow: true },
};

export default function TrackingPage() {
  return <TrackingPageClient />;
}
