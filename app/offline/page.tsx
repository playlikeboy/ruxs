import type { Metadata } from "next";
import OfflinePage from "./OfflinePage";

export const metadata: Metadata = {
  title: "Offline mode · RUXS",
  description: "Offline shell for RUXS. Live actions require an active connection.",
  alternates: { canonical: "https://ruxs.in/offline" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Offline mode · RUXS",
    description: "Offline shell for RUXS. Live actions require an active connection.",
    url: "https://ruxs.in/offline",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offline mode · RUXS",
    description: "Offline shell for RUXS. Live actions require an active connection.",
  },
};

export default function Page() {
  return <OfflinePage />;
}
