import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Platform control center · RUXS",
  description: "Internal RUXS platform control center for vendors, households, fulfillment, disputes and audit operations.",
  alternates: { canonical: "https://ruxs.in/admin" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Platform control center · RUXS",
    description: "Internal platform administration and vendor oversight.",
    url: "https://ruxs.in/admin",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Platform admin · RUXS",
    description: "Internal platform administration and vendor oversight.",
  },
};

export default function Page() {
  return <AdminClient />;
}
