import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/for/", "/in/", "/privacy", "/terms"],
        disallow: ["/app", "/c/", "/admin", "/merchant-panel", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
