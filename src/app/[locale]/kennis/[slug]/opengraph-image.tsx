import { isValidLocale, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import { KENNIS } from "@/lib/kennis";
import { maakMerkkaart } from "@/lib/social/merkkaart";
import { paginaKaart } from "@/lib/social/paginakaart";

// Deelkaart per kennisartikel: het kopbeeld van het artikel met de titel, als
// JPEG. De pagina zelf verwijst naar /beeld/og/<taal>/kennis/<slug>.jpg (zelfde
// kaart); dit adres blijft werken voor links die al gedeeld zijn.
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const alt = "Studio VM";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => KENNIS.map((a) => ({ locale, slug: a.slug })));
}

export default async function OG({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const kaart = paginaKaart(l, `kennis/${slug}`) ?? paginaKaart(l, "kennis")!;
  const beeld = await maakMerkkaart(kaart, "og");
  return new Response(new Uint8Array(beeld.data), { headers: { "content-type": beeld.contentType } });
}
