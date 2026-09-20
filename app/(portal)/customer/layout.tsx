import type { ReactNode } from "react";
import CustomerPortalNav from "@/components/portal/CustomerPortalNav";

export default function CustomerPortalLayout({ children }: { children: ReactNode }) {
  return <CustomerPortalNav>{children}</CustomerPortalNav>;
}
