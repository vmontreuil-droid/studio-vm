import type { MetadataRoute } from "next";
import { KENNIS } from "@/lib/kennis";
import { LOCALES } from "@/lib/i18n/config";

const BASE = "https://studio-vm.be";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paths = [
    "",
    "/3d-modellen",
    "/realisaties",
    "/tarieven",
    "/offerte",
    "/kennis",
    "/over",
    "/privacy",
    "/cookies",
    "/voorwaarden",
  ];
  const belangrijk = new Set(["", "/offerte", "/3d-modellen", "/realisaties", "/tarieven"]);

  const paginas = paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified: now,
      changeFrequency: (belangrijk.has(path) ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : belangrijk.has(path) ? 0.9 : 0.5,
    })),
  );

  const kennis = KENNIS.flatMap((a) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/kennis/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [...paginas, ...kennis];
}
