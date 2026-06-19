import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sneak N' Drip",
    short_name: "SND",
    description: "100% Authentic Sneakers Philippines — On Hand & Pre-Order",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F0EF",
    theme_color: "#0D0D0D",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
