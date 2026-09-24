import type { Metadata } from "next";
import KhataPageClient from "./KhataPageClient";

export const metadata: Metadata = {
  title: "Digital Khata | RUXS",
  description: "View customer balances, ledger entries and billing statements for RUXS household services.",
  alternates: { canonical: "https://ruxs.in/app/khata" },
  robots: { index: false, follow: true },
};

export default function KhataPage() {
  return <KhataPageClient />;
}
