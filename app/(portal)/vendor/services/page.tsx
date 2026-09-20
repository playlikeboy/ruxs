import type { Metadata } from "next";
import VendorServicesClient from "./VendorServicesClient";

export const metadata: Metadata = {
  title: "Vendor services · RUXS",
  description: "Configure recurring services, pricing and operational cutoffs.",
  alternates: { canonical: "https://ruxs.in/vendor/services" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VendorServicesClient />;
}
