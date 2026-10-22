import type { MetadataRoute } from "next";

const appIcon = {
  src: "/brand/ruxs-app-icon.svg",
  sizes: "512x512",
  type: "image/svg+xml",
  purpose: "any",
} as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "RUXs — Neighbourhood Services",
    short_name: "RUXs",
    description: "Explore meals, water, dairy, kids' learning, gifts, local specialists and everyday services near you.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
    background_color: "#FAFAF7",
    theme_color: "#FFF3E9",
    orientation: "portrait",
    lang: "en-IN",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle", "utilities", "education", "health", "fitness"],
    prefer_related_applications: false,
    shortcuts: [
      { name: "Kids Zone & STEM", short_name: "Kids", url: "/app/kids", description: "Explore classes, camps, robotics and learning kits", icons: [appIcon] },
      { name: "Explore Services", short_name: "Explore", url: "/app", description: "Browse local meals, water, dairy, stores and specialists", icons: [appIcon] },
      { name: "Today's Deliveries & Plans", short_name: "Plans", url: "/app/plans", description: "Manage active subscriptions and supported daily changes", icons: [appIcon] },
      { name: "My Orders", short_name: "Orders", url: "/app/orders", description: "Review active and past orders", icons: [appIcon] },
      { name: "Account & Address", short_name: "Account", url: "/app/account", description: "Update your delivery address and location", icons: [appIcon] },
    ],
    icons: [appIcon, { ...appIcon, purpose: "maskable" }],
  };
}
