import type { Metadata } from "next";
import DeliveryClient from "./DeliveryClient";

export const metadata: Metadata = {
  title: "Delivery run sheet · RUXS",
  description: "Driver operations and recurring-service delivery workflows.",
  alternates: { canonical: "https://ruxs.in/delivery" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Delivery run sheet · RUXS",
    description: "Driver operations and recurring-service delivery workflows.",
    url: "https://ruxs.in/delivery",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Delivery run sheet · RUXS",
    description: "Driver operations and recurring-service delivery workflows.",
  },
};

export default function Page() {
  return <DeliveryClient />;
}
