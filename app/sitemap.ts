import type { MetadataRoute } from "next";
import { MOCK_PRODUCTS, MOCK_VENDORS } from "@/src/modules/customer-ui/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ruxs.in";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/app`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/app/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vendor/onboard`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const productPages: MetadataRoute.Sitemap = MOCK_PRODUCTS.map((p) => ({
    url: `${baseUrl}/app/product/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const vendorPages: MetadataRoute.Sitemap = MOCK_VENDORS.map((v) => ({
    url: `${baseUrl}/app/vendor/${v.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...staticPages, ...productPages, ...vendorPages];
}
