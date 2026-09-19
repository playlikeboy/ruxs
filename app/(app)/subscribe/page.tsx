import type { Metadata } from "next";
import SubscribeClient from "./SubscribeClient";

export const metadata: Metadata = {
  title: "Start a recurring service · RUXS",
  description: "Set up recurring household deliveries such as meals, water or milk with a default cadence you can pause or change.",
  alternates: { canonical: "https://ruxs.in/subscribe" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Start a recurring service · RUXS",
    description: "Set up recurring household deliveries such as meals, water or milk with a default cadence you can pause or change.",
    url: "https://ruxs.in/subscribe",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start a recurring service · RUXS",
    description: "Set up recurring household deliveries such as meals, water or milk with a default cadence you can pause or change.",
  },
};

export default function Page() {
  return <SubscribeClient />;
}
