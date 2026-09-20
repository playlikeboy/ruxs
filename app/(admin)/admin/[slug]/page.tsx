import type { Metadata } from "next";
import AdminVendorDetailClient from "./AdminVendorDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Vendor Management · ${slug} · RUXS Admin`,
    description: `Platform admin cockpit for inspecting vendor operations, credentials, and service catalog for ${slug}.`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <AdminVendorDetailClient slug={slug} />;
}
