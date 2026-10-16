import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUXs — Daily Operating System",
    short_name: "RUXs",
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
