import type { Metadata } from "next";
import LocationPageClient from "./LocationPageClient";

export const metadata: Metadata = {
  title: "Delivery Location | RUXS",
  description: "View the household delivery location currently associated with your RUXS account.",
  alternates: { canonical: "https://ruxs.in/app/location" },
  robots: { index: false, follow: true },
};

export default function LocationPage() {
  return <LocationPageClient />;
}
