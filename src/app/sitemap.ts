import type { MetadataRoute } from "next";
import { projectSlugs } from "@/lib/projects";
import { postSlugs } from "@/lib/posts";
import { capabilitySlugs } from "@/lib/capabilities";
import { LOCALES } from "@/lib/i18n/config";

const BASE = "https://studio-vm.be";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paths = [
    "",
    "/over",
    "/pers",
    "/changelog",
    "/scan",
    "/roi",
    "/diensten",
    "/aanpak",
    "/vergelijking",
    "/woordenboek",
    "/mogelijkheden",
    "/offerte",
    "/pricing",
    "/faq",
    "/journal",
    "/shop",
    "/portail",
    "/support",
    "/builder",
    "/status",
    "/now",
    "/uses",
    "/privacy",
    "/cookies",
    "/voorwaarden",
  ];

  const localePages = paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  );

  const projectRoutes = projectSlugs.flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/werk/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  const postRoutes = postSlugs.flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/journal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  );

  const capabilityRoutes = capabilitySlugs.flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/mogelijkheden/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [
    ...localePages,
    ...projectRoutes,
    ...postRoutes,
    ...capabilityRoutes,
  ];
}
