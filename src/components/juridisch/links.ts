import { localePath, type Locale } from "@/lib/i18n/config";

// De juridische teksten bestaan twee keer als pagina: publiek (/voorwaarden,
// /privacy, /cookies) en in het klantenportaal (/portail/dashboard/...).
// Verwijzingen tussen die teksten volgen de plek waar de lezer zit, zodat een
// klant in het portaal niet naar de publieke site springt.

export type JuridischPad = "/voorwaarden" | "/privacy" | "/cookies";
export type JuridischeLinks = Record<JuridischPad, string>;
export type JuridischePlek = "site" | "portaal";

/** Basispad van de juridische pagina's in het klantenportaal. */
export const PORTAAL_JURIDISCH = "/portail/dashboard";

export function juridischeLinks(locale: Locale, plek: JuridischePlek = "site"): JuridischeLinks {
  const basis = plek === "portaal" ? PORTAAL_JURIDISCH : "";
  return {
    "/voorwaarden": localePath(locale, `${basis}/voorwaarden`),
    "/privacy": localePath(locale, `${basis}/privacy`),
    "/cookies": localePath(locale, `${basis}/cookies`),
  };
}
