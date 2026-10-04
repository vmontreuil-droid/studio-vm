import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { maakMerkkaart } from "@/lib/social/merkkaart";
import { ogBeeld, paginaKaart } from "@/lib/social/paginakaart";

// Merkkaart van /offerte, als JPEG. Dit bestand wint van de ogBeeld in
// offerte/layout.tsx (bestandsmetadata gaat voor). Daarom zelf:
//  - een vertaalde alt (die van de kaart, zoals op de andere pagina's);
//  - de inhoudshash als id in het adres: /nl/offerte/opengraph-image/<hash>.
//    Verandert de kaart (tekst, prijs, ontwerpversie), dan verandert het
//    adres en halen Facebook en WhatsApp het nieuwe beeld op. Een oude hash
//    geeft 404; de talen komen uit generateStaticParams van [locale]/layout.
// Zelfde kaart als /beeld/og/<taal>/offerte.jpg.

const size = { width: 1200, height: 630 };

function taal(locale: string): Locale {
  return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  const { locale } = await Promise.resolve(params);
  const { url, alt } = ogBeeld(taal(locale), "offerte");
  const v = new URL(url, "https://www.studio-vm.be").searchParams.get("v") ?? "1";
  return [{ id: v, alt, size, contentType: "image/jpeg" }];
}

export default async function OG({ params }: { params: Promise<{ locale: string }>; id: Promise<string> }) {
  const { locale } = await params;
  const beeld = await maakMerkkaart(paginaKaart(taal(locale), "offerte")!, "og");
  return new Response(new Uint8Array(beeld.data), { headers: { "content-type": beeld.contentType } });
}
