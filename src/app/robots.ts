import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/cart", "/account", "/order-confirmation", "/track-order"],
    },
    sitemap: "https://sneakndrip.ph/sitemap.xml",
  };
}
