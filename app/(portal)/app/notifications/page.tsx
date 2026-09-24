import type { Metadata } from "next";
import NotificationsPageClient from "./NotificationsPageClient";

export const metadata: Metadata = {
  title: "Notifications | RUXS",
  description: "View order, routine and account notifications for your RUXS household.",
  alternates: { canonical: "https://ruxs.in/app/notifications" },
  robots: { index: false, follow: true },
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
