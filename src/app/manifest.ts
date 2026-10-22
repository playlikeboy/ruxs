import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "RUXs — Neighbourhood Services",
    short_name: "RUXs",
    description:
      "Explore meals, water, dairy, kids' learning, gifts, local specialists and everyday services near you.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
    background_color: "#FAFAF7",
    theme_color: "#FAFAF7",
    orientation: "portrait",
    lang: "en-IN",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle", "utilities", "education", "health", "fitness"],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Kids Zone & STEM",
        short_name: "Kids",
        url: "/app/kids",
        description: "Explore classes, camps, robotics and learning kits",
        icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Explore Services",
        short_name: "Explore",
        url: "/app",
        description: "Browse local meals, water, dairy, stores and specialists",
        icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Today's Deliveries & Plans",
        short_name: "Plans",
        url: "/app/plans",
        description: "Manage active subscriptions and supported daily changes",
        icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        url: "/app/orders",
        description: "Review active and past orders",
        icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Account & Address",
        short_name: "Account",
        url: "/app/account",
        description: "Update your delivery address and location",
        icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
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
