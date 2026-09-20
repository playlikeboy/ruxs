import type { Metadata } from "next";
import VendorOnboardClient from "./VendorOnboardClient";

export const metadata: Metadata = {
  title: "Invite households · RUXS",
  description: "Create a vendor workspace and generate a direct household invite link.",
  alternates: { canonical: "https://ruxs.in/vendor/onboard" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VendorOnboardClient />;
}
