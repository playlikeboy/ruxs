import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Platform admin · RUXS",
  description: "Internal platform administration and vendor oversight.",
  alternates: { canonical: "https://ruxs.in/admin" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Platform admin · RUXS",
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
