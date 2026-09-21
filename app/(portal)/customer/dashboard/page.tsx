import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Household overview · RUXS",
  description: "Manage recurring services, today's delivery, your digital Khata and invoices.",
  alternates: { canonical: "https://ruxs.in/app" },
  robots: { index: false, follow: true },
};

export default function Page() {
  redirect("/app");
}
