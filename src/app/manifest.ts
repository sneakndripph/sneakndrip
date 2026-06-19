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
      { src: "/sneakndrip-logo.png", sizes: "any", type: "image/png" },
    ],
  };
}
