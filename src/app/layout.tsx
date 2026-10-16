import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in"),
  title: {
    default: "RUXs — Everyday Essentials From Your Neighbourhood",
    template: "%s | RUXs",
  },
  description:
    "Discover neighbourhood tiffin subscriptions, daily meals and 20L water-can delivery, with a separate workspace for local merchants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-bg text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
