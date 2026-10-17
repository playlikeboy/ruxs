import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/pricing", "/for/", "/in/", "/privacy", "/terms", "/app/category/", "/app/store/"],
        disallow: [
          "/app/account",
          "/app/cart",
          "/app/orders",
          "/app/plans",
          "/app/bookings",
          "/c/",
          "/merchant-panel",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
