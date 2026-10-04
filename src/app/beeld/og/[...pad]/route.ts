// Deelbeeld (og:image) per pagina en taal, als JPEG 1200×630 (< 300 KB).
//
//   /beeld/og/nl.jpg                       startpagina
//   /beeld/og/nl/realisaties.jpg           vaste pagina's
//   /beeld/og/nl/kennis/<slug>.jpg         kennisartikel
//
// Alles wordt bij de build gemaakt (generateStaticParams); een onbekend adres
// geeft 404. De ?v= in de metadata verandert mee met de inhoud, de route zelf
// negeert hem. Buiten /api/: robots.txt blokkeert /api/ voor crawlers.

import { merkkaartAntwoord } from "@/lib/social/merkkaart";
import { alleOgPaden, paginaKaart, sleutelUitPad } from "@/lib/social/paginakaart";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return alleOgPaden();
}

export async function GET(_req: Request, { params }: { params: Promise<{ pad: string[] }> }) {
  const { pad } = await params;
  const s = sleutelUitPad(pad);
  const kaart = s ? paginaKaart(s.l, s.sleutel) : null;
  if (!s || !kaart) return new Response("Niet gevonden", { status: 404 });
  return merkkaartAntwoord(kaart, "og", {
    // Het adres draagt een inhoudshash: lang bewaren mag.
    cacheControl: "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
  });
}
