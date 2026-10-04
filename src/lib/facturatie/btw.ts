import "server-only";
import { checkVies } from "@/lib/vies";
import type { Locale } from "@/lib/i18n/config";

// Welke btw op een offerte of factuur? Alle regels op één plek, zodat een
// factuur meteen juist is (achteraf corrigeren kan enkel met een creditnota).
//
//   • Belgische klant                          → 21 %, binnenland
//   • EU-klant met geldig btw-nummer (VIES)    → 0 %, btw verlegd (art. 196)
//   • Bedrijf buiten de EU (CH, GB, NO, …)     → 0 %, dienst buiten de EU
//   • Al de rest (geen of ongeldig nummer,
//     VIES onbereikbaar)                       → 21 %, met een waarschuwing
//
// Studio VM levert enkel aan bedrijven (B2B). Een klant zonder btw-nummer
// behandelen we veilig als binnenland; de admin ziet dan een waarschuwing.

export type BtwRegime = "binnenland" | "verlegd" | "buiten-eu";

export type BtwControle = {
  nummer: string;
  land: string;
  geldig: boolean | null;
  naam: string | null;
  adres: string | null;
  bron: "VIES" | "formaat";
  op: string;
};

export type BtwBesluit = {
  regime: BtwRegime;
  /** Percentage dat op de factuur komt. */
  tarief: 21 | 0;
  /** Voor de bestaande kolom vat_reverse: true = 0 % (verlegd of buiten de EU). */
  nulTarief: boolean;
  controle: BtwControle | null;
  /** Iets om na te kijken (getoond in de admin), of null. */
  waarschuwing: string | null;
};

const EU = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
]);

// Landen buiten de EU waarvoor een bedrijfsnummer herkenbaar is.
const BUITEN_EU: Record<string, RegExp> = {
  CH: /^CHE\d{9}(MWST|TVA|IVA)?$/,
  GB: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
  NO: /^NO\d{9}(MVA)?$/,
};

function schoon(nummer: string): string {
  return nummer.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function landVan(nummer: string): string | null {
  if (nummer.startsWith("CHE")) return "CH";
  const m = nummer.match(/^([A-Z]{2})/);
  if (!m) return null;
  return m[1] === "GR" ? "EL" : m[1];
}

function besluit(regime: BtwRegime, controle: BtwControle | null, waarschuwing: string | null = null): BtwBesluit {
  const nul = regime !== "binnenland";
  return { regime, tarief: nul ? 0 : 21, nulTarief: nul, controle, waarschuwing };
}

/** Bepaal het btw-regime uit het btw-nummer van de klant (met VIES-controle voor de EU). */
export async function bepaalBtw(btwNummer: string | null | undefined): Promise<BtwBesluit> {
  const nummer = schoon(String(btwNummer ?? ""));
  const op = new Date().toISOString();
  if (!nummer) return besluit("binnenland", null, "Geen btw-nummer: Belgische btw (21 %) aangerekend.");

  const land = landVan(nummer);
  if (!land) return besluit("binnenland", null, `Btw-nummer ${nummer} niet herkend: Belgische btw (21 %) aangerekend.`);

  if (land in BUITEN_EU) {
    const vormOk = BUITEN_EU[land].test(nummer);
    const controle: BtwControle = { nummer, land, geldig: vormOk, naam: null, adres: null, bron: "formaat", op };
    return vormOk
      ? besluit("buiten-eu", controle)
      : besluit("binnenland", controle, `Nummer ${nummer} heeft geen geldig formaat voor ${land}: controleer het.`);
  }

  if (!EU.has(land)) return besluit("binnenland", null, `Land ${land} onbekend: Belgische btw (21 %) aangerekend.`);

  const v = await checkVies(nummer);
  const controle: BtwControle = {
    nummer, land,
    geldig: v?.valid ?? null,
    naam: v?.name ?? null,
    adres: v?.address ?? null,
    bron: "VIES",
    op,
  };
  if (land === "BE") {
    return besluit("binnenland", controle, v?.valid === false ? `Belgisch btw-nummer ${nummer} is volgens VIES ongeldig.` : null);
  }
  if (v?.valid === true) return besluit("verlegd", controle);
  if (v?.valid === false) {
    return besluit("binnenland", controle, `Btw-nummer ${nummer} is volgens VIES ongeldig: Belgische btw (21 %) aangerekend.`);
  }
  return besluit("binnenland", controle, `VIES was niet bereikbaar voor ${nummer}: 21 % aangerekend — controleer opnieuw vóór het versturen.`);
}

/** Regime afleiden voor oude rijen zonder btw_regime (enkel vat_reverse bekend). */
export function regimeVan(rij: { btw_regime?: string | null; vat_reverse?: boolean | null }): BtwRegime {
  if (rij.btw_regime === "verlegd" || rij.btw_regime === "buiten-eu" || rij.btw_regime === "binnenland") return rij.btw_regime;
  return rij.vat_reverse ? "verlegd" : "binnenland";
}

/** Kort label voor de btw-regel van het totaal. */
export function btwLabel(regime: BtwRegime, taal: Locale): string {
  return LABEL[regime][taal];
}

const LABEL: Record<BtwRegime, Record<Locale, string>> = {
  binnenland: { nl: "Btw 21%", fr: "TVA 21%", en: "VAT 21%", de: "MwSt. 21%", es: "IVA 21%" },
  verlegd: {
    nl: "Btw 0% — verlegd",
    fr: "TVA 0 % — autoliquidation",
    en: "VAT 0% — reverse charge",
    de: "MwSt. 0 % — Reverse Charge",
    es: "IVA 0 % — inversión del sujeto pasivo",
  },
  "buiten-eu": {
    nl: "Btw 0% — buiten de EU",
    fr: "TVA 0 % — hors UE",
    en: "VAT 0% — outside the EU",
    de: "MwSt. 0 % — außerhalb der EU",
    es: "IVA 0 % — fuera de la UE",
  },
};

/** Wettelijke vermelding op de factuur bij 0 % (null bij binnenland). */
export function btwVermelding(regime: BtwRegime, taal: Locale): string | null {
  if (regime === "verlegd") return VERLEGD[taal];
  if (regime === "buiten-eu") return BUITEN[taal];
  return null;
}

const VERLEGD: Record<Locale, string> = {
  nl: "Btw verlegd — art. 196 Richtlijn 2006/112/EG",
  fr: "Autoliquidation — art. 196 de la directive 2006/112/CE",
  en: "Reverse charge — Art. 196 Council Directive 2006/112/EC",
  de: "Steuerschuldnerschaft des Leistungsempfängers — Art. 196 Richtlinie 2006/112/EG",
  es: "Inversión del sujeto pasivo — art. 196 Directiva 2006/112/CE",
};

const BUITEN: Record<Locale, string> = {
  nl: "Btw niet van toepassing — dienst buiten de EU (art. 21, § 2 W.Btw.)",
  fr: "TVA non applicable — service hors UE (art. 21, § 2 C.TVA)",
  en: "VAT not applicable — service supplied outside the EU (Art. 21 § 2 Belgian VAT Code)",
  de: "Keine belgische MwSt. — Leistung außerhalb der EU (Art. 21 § 2 belg. MwStGB)",
  es: "IVA no aplicable — servicio prestado fuera de la UE (art. 21, § 2 Código del IVA belga)",
};
