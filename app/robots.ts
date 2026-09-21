import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/app", "/subscribe", "/vendor/onboard"],
      disallow: [
        "/api/",
        "/admin/",
        "/customer/",
        "/delivery/",
        "/disputes/",
        "/household/",
        "/login",
        "/onboard",
        "/vendor/dashboard",
        "/vendor/services",
      ],
    },
    sitemap: "https://ruxs.in/sitemap.xml",
  };
}
