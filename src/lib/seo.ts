import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/lib/i18n/config";

// Het eindadres van de site: studio-vm.be stuurt door naar www, dus
// canonieke en hreflang-adressen wijzen rechtstreeks naar www.
export const SITE = "https://www.studio-vm.be";

/**
 * Canoniek adres + hreflang-varianten voor een pagina die in alle talen
 * bestaat. `pad` zonder taal, met voorloop-slash (of "" voor de startpagina).
 */
export function talen(locale: Locale, pad: string): NonNullable<Metadata["alternates"]> {
  const p = pad === "/" ? "" : pad;
  return {
    canonical: `${SITE}/${locale}${p}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${p}`])),
      "x-default": `${SITE}/nl${p}`,
    },
  };
}
