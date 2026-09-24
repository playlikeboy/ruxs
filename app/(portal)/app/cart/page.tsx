import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "Cart | RUXS",
  description: "Review selected household services before checkout.",
  alternates: { canonical: "https://ruxs.in/app/cart" },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartPageClient />;
}
