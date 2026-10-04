// Documentnummers en Belgische gestructureerde mededeling — puur rekenwerk,
// zonder databank (mag ook in de browser). De databank (migratie 0051) deelt
// de nummers uit; deze functies lezen, tonen en controleren ze, met exact
// dezelfde formule als de databankfunctie ogm_voor().
//
//   FAC-2026-001  →  +++202/6000/00192+++
//   10 cijfers = jaar × 1 000 000 + volgnummer, plus 2 controlecijfers
//   (rest bij deling door 97; rest 0 wordt 97). Begint nooit met 000.

export type DocumentSoort = "FAC" | "CN" | "OFF";

export type Documentnummer = { soort: DocumentSoort; jaar: number; volgnummer: number };

const VORM = /^(FAC|CN|OFF)-(\d{4})-(\d{1,6})$/;

/** "FAC-2026-001" → { soort, jaar, volgnummer }; null voor elk ander formaat (bv. DEMO-FAC-001). */
export function leesDocumentnummer(nummer: string | null | undefined): Documentnummer | null {
  const m = String(nummer ?? "").trim().match(VORM);
  if (!m) return null;
  const volgnummer = Number(m[3]);
  if (!Number.isSafeInteger(volgnummer) || volgnummer < 1) return null;
  return { soort: m[1] as DocumentSoort, jaar: Number(m[2]), volgnummer };
}

/** { FAC, 2026, 1 } → "FAC-2026-001" (vanaf 1000 zonder voorloopnullen). */
export function maakDocumentnummer(soort: DocumentSoort, jaar: number, volgnummer: number): string {
  const n = volgnummer < 1000 ? String(volgnummer).padStart(3, "0") : String(volgnummer);
  return `${soort}-${jaar}-${n}`;
}

// De basis blijft onder 3 × 10^9: ruim binnen de veilige gehele getallen.
function controlegetal(basis: number): number {
  const rest = basis % 97;
  return rest === 0 ? 97 : rest;
}

function opmaak(twaalf: string): string {
  return `+++${twaalf.slice(0, 3)}/${twaalf.slice(3, 7)}/${twaalf.slice(7)}+++`;
}

/** Gestructureerde mededeling voor jaar + volgnummer (zelfde als SQL ogm_voor). */
export function ogmVoor(jaar: number, volgnummer: number): string {
  if (!Number.isInteger(volgnummer) || volgnummer < 1 || volgnummer > 999_999) {
    throw new RangeError(`volgnummer ${volgnummer} valt buiten 1..999999`);
  }
  const basis = jaar * 1_000_000 + volgnummer;
  const tien = basis.toString().padStart(10, "0");
  return opmaak(tien + String(controlegetal(basis)).padStart(2, "0"));
}

/**
 * Mededeling van een factuur: de opgeslagen waarde als die er is, anders
 * berekend uit het nummer. Voor een nummer in een ander formaat (oude of
 * DEMO-facturen) blijft de vroegere berekening gelden, zodat een al
 * uitgestuurde overschrijving nog altijd herkend wordt.
 */
export function ogmVoorFactuur(nummer: string, opgeslagen?: string | null): string {
  if (opgeslagen && isGeldigeOgm(opgeslagen)) return opgeslagen;
  const d = leesDocumentnummer(nummer);
  if (d && d.soort === "FAC") return ogmVoor(d.jaar, d.volgnummer);
  return oudeOgm(nummer);
}

/** Vroegere berekening (cijfers van het nummer, links aangevuld met nullen). */
function oudeOgm(nummer: string): string {
  const tien = (nummer.replace(/\D/g, "") || "0").slice(-10).padStart(10, "0");
  return opmaak(tien + String(controlegetal(Number(tien))).padStart(2, "0"));
}

/** De 12 cijfers uit een mededeling, of null als het er geen geldige is. */
export function ogmCijfers(tekst: string | null | undefined): string | null {
  const cijfers = String(tekst ?? "").replace(/\D/g, "");
  if (cijfers.length !== 12) return null;
  return controlegetal(Number(cijfers.slice(0, 10))) === Number(cijfers.slice(10)) ? cijfers : null;
}

export function isGeldigeOgm(tekst: string | null | undefined): boolean {
  return ogmCijfers(tekst) !== null;
}
