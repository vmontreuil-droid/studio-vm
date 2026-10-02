import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Portaal- en factuurpagina's bewust NIET geblokkeerd: Google moet
      // ze kunnen ophalen om hun noindex (X-Robots-Tag) te zien.
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
