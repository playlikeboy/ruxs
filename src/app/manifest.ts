import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "RUXs — Daily Household OS",
    short_name: "RUXs",
    description: "Daily tiffin, water, milk, mehndi artists & neighbourhood services delivered to your door.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
    background_color: "#FAFAF7",
    theme_color: "#FAFAF7",
    orientation: "portrait",
    lang: "en-IN",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle", "utilities"],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Explore Stores",
        short_name: "Explore",
        url: "/app",
        description: "Browse nearby kitchens, dairy, water suppliers and services",
        icons: [{ src: "/icon", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Today's Deliveries & Plans",
        short_name: "Plans",
        url: "/app/plans",
        description: "Manage your active subscriptions, today's meals and skips",
        icons: [{ src: "/icon", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        url: "/app/orders",
        description: "Track your past and active orders",
        icons: [{ src: "/icon", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Account & Address",
        short_name: "Account",
        url: "/app/account",
        description: "Update delivery address, GPS pin, and notifications",
        icons: [{ src: "/icon", sizes: "96x96", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
