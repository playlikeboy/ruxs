import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUXS — Daily Operating System",
    short_name: "RUXS",
    description: "The daily operating system for neighbourhood tiffin services and 20L water suppliers.",
    start_url: "/app",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#FAFAF7",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
