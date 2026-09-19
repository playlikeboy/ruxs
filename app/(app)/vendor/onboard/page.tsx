import type { Metadata } from "next";
import VendorOnboardClient from "./VendorOnboardClient";

export const metadata: Metadata = {
  title: "For local vendors · RUXS",
  description: "Bring recurring household operations into one place with service setup, customer coordination and clearer daily demand.",
  alternates: { canonical: "https://ruxs.in/vendor/onboard" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "For local vendors · RUXS",
    description: "Bring recurring household operations into one place with service setup, customer coordination and clearer daily demand.",
    url: "https://ruxs.in/vendor/onboard",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "For local vendors · RUXS",
    description: "Bring recurring household operations into one place with service setup, customer coordination and clearer daily demand.",
  },
};

export default function Page() {
  return <VendorOnboardClient />;
}
