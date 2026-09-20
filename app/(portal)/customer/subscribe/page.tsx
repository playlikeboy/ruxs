import type { Metadata } from "next";
import SubscribeClient from "./SubscribeClient";

export const metadata: Metadata = {
  title: "Recurring services · RUXS",
  description: "Choose and manage recurring household services from your RUXS customer workspace.",
  alternates: { canonical: "https://ruxs.in/customer/subscribe" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SubscribeClient />;
}
