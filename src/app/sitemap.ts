import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";
  const now = new Date();

  const publicRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/for/tiffin-services", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/for/water-suppliers", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/in/bengaluru", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return publicRoutes.map((route) => ({
    url: baseUrl + route.path,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
