import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { posts } from "@/lib/posts";
import { LOCALES } from "@/lib/i18n/config";

const BASE = "https://studio-vm.be";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paths = [
    "",
    "/diensten",
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

  const projectRoutes = projects.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/werk/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  const postRoutes = posts.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/journal/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  );

  return [...localePages, ...projectRoutes, ...postRoutes];
}
