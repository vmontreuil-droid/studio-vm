import type { MetadataRoute } from "next";
import { KENNIS } from "@/lib/kennis";
import { ARCHIEF, archiefPad } from "@/lib/archief";
import { LOCALES } from "@/lib/i18n/config";
import { canoniek, taalVarianten } from "@/lib/seo";
import { ARCHIEF_BIJGEWERKT, PAGINA_BIJGEWERKT, kennisDatum } from "@/lib/bijgewerkt";

// Elke pagina bestaat in alle talen; elke vermelding verwijst ook naar
// haar anderstalige versies (hreflang, x-default = Engels), zodat
// zoekmachines ze koppelen. lastmod komt uit lib/bijgewerkt: een vaste datum
// die enkel verandert wanneer de inhoud echt wijzigt.

const PADEN = [
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
] as const satisfies readonly (keyof typeof PAGINA_BIJGEWERKT)[];

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = PADEN.flatMap((pad) =>
    LOCALES.map((locale) => ({
      url: canoniek(locale, pad),
      lastModified: PAGINA_BIJGEWERKT[pad],
      alternates: { languages: taalVarianten(pad) },
    })),
  );

  const kennis = KENNIS.flatMap((a) => {
    const pad = `/kennis/${a.slug}`;
    return LOCALES.map((locale) => ({
      url: canoniek(locale, pad),
      lastModified: kennisDatum(a.slug).bijgewerkt,
      alternates: { languages: taalVarianten(pad) },
    }));
  });

  const projecten = ARCHIEF.flatMap((p) => {
    const pad = archiefPad(p.code);
    return LOCALES.map((locale) => ({
      url: canoniek(locale, pad),
      lastModified: ARCHIEF_BIJGEWERKT,
      alternates: { languages: taalVarianten(pad) },
    }));
  });

  return [...paginas, ...kennis, ...projecten];
}
