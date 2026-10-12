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
    default: "RUXS · Tiffin & Water Delivery Management",
    template: "%s · RUXS",
  },
  description:
    "RUXS locks tomorrow's count at your cutoff, gives your driver a clean run sheet, and keeps a khata every household can see.",
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
