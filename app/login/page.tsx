import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign in · RUXS",
  description: "Sign in to manage recurring household services, vendor operations or delivery work.",
  alternates: { canonical: "https://ruxs.in/login" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign in · RUXS",
    description: "Sign in to manage recurring household services, vendor operations or delivery work.",
    url: "https://ruxs.in/login",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in · RUXS",
    description: "Sign in to manage recurring household services, vendor operations or delivery work.",
  },
};

export default function Page() {
  return <LoginClient />;
}
