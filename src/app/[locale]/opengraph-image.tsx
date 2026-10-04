import { isValidLocale, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import { maakMerkkaart } from "@/lib/social/merkkaart";
import { paginaKaart } from "@/lib/social/paginakaart";

// Merkkaart van de startpagina (render + kop + prijs), als JPEG.
// Pagina's verwijzen via paginaMeta() naar /beeld/og/…; dit adres blijft
// voor schema.ts (LocalBusiness.image) en voor pagina's zonder eigen beeld.
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
// Pagina's zetten hun eigen, vertaalde alt via paginaMeta().
export const alt = "Studio VM — 3D-modellen voor machinesturing";

// Eén kaart per taal, bij de build gemaakt.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function OG({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const beeld = await maakMerkkaart(paginaKaart(l, "home")!, "og");
  return new Response(new Uint8Array(beeld.data), { headers: { "content-type": beeld.contentType } });
}
