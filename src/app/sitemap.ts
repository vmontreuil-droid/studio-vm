import type { MetadataRoute } from "next";
import { KENNIS } from "@/lib/kennis";
import { LOCALES } from "@/lib/i18n/config";
import { SITE } from "@/lib/seo";

// Elke pagina bestaat in alle talen; elke vermelding verwijst ook naar
// haar anderstalige versies (hreflang), zodat zoekmachines ze koppelen.
function varianten(pad: string) {
  return {
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${pad}`])),
      "x-default": `${SITE}/nl${pad}`,
    },
  };
}

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
      url: `${SITE}/${locale}${path}`,
      lastModified: now,
      changeFrequency: (belangrijk.has(path) ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : belangrijk.has(path) ? 0.9 : 0.5,
      alternates: varianten(path),
    })),
  );

  const kennis = KENNIS.flatMap((a) =>
    LOCALES.map((locale) => ({
      url: `${SITE}/${locale}/kennis/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: varianten(`/kennis/${a.slug}`),
    })),
  );

  return [...paginas, ...kennis];
}
