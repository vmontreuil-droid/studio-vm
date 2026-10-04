// Verwijlinterest bij laattijdige betaling tussen bedrijven (België).
//
// Wet van 2 augustus 2002 betreffende de bestrijding van de betalingsachterstand
// bij handelstransacties:
//   • art. 5  — vanaf de dag na de vervaldag loopt van rechtswege en zonder
//               ingebrekestelling interest aan de rentevoet van art. 5, 2e lid
//               (ECB-referentierente + 8 procentpunten), per semester
//               bekendgemaakt in het Belgisch Staatsblad;
//   • art. 6  — daarbovenop een forfaitaire vergoeding van € 40 per factuur.
//
// RENTEVOETEN bijwerken op 1 januari en 1 juli (bron: FOD Financiën /
// Staatsblad; bv. https://www.lawbase.be/tools/wettelijke-interest).
// Ontbreekt het lopende semester, dan geeft rentevoetOp() null en noemt de
// herinnering geen percentage: liever geen cijfer dan een verkeerd.

export const FORFAIT_CENT = 4000;

type Semester = { vanaf: string; pct: number };

/** Rentevoet handelstransacties per semester (startdatum, %/jaar). */
export const RENTEVOETEN: readonly Semester[] = [
  { vanaf: "2024-01-01", pct: 12.5 },
  { vanaf: "2024-07-01", pct: 12.5 },
  { vanaf: "2025-01-01", pct: 11.5 },
  { vanaf: "2025-07-01", pct: 10.5 },
  { vanaf: "2026-01-01", pct: 10.5 },
  { vanaf: "2026-07-01", pct: 10.5 },
];

const DAG = 86_400_000;

function utcDag(iso: string): number {
  const [j, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(j, m - 1, d);
}

function semesterStart(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() < 6 ? "01" : "07"}-01`;
}

/** Rentevoet die geldt op een dag (YYYY-MM-DD), of null als dat semester nog niet in de tabel staat. */
export function rentevoetOp(iso: string): number | null {
  const start = semesterStart(utcDag(iso));
  return RENTEVOETEN.find((s) => s.vanaf === start)?.pct ?? null;
}

export type Verwijlinterest = {
  /** Aantal dagen te laat (vanaf de dag na de vervaldag, t.e.m. vandaag). */
  dagen: number;
  /** Interest in eurocent, per semester berekend aan de geldende rentevoet. */
  interestCent: number;
  /** Rentevoet van vandaag (%/jaar). */
  pctNu: number;
  forfaitCent: number;
};

/**
 * Verwijlinterest op een openstaand bedrag, van de dag na de vervaldag tot en
 * met `tot`. Enkelvoudige interest per dag (bedrag × % × dagen / 365), per
 * semester aan de rentevoet van dat semester. Null als er geen achterstand is
 * of als een betrokken semester nog niet in de tabel staat.
 */
export function verwijlinterest(bedragCent: number, vervaldag: string, tot: string): Verwijlinterest | null {
  const eerste = utcDag(vervaldag) + DAG;
  const laatste = utcDag(tot);
  if (!(bedragCent > 0) || laatste < eerste) return null;
  const pctNu = rentevoetOp(tot);
  if (pctNu === null) return null;

  let interest = 0;
  let dag = eerste;
  while (dag <= laatste) {
    const pct = rentevoetOp(new Date(dag).toISOString());
    if (pct === null) return null;
    // Tot het einde van dit semester of tot `tot`.
    const d = new Date(dag);
    const volgendSemester = Date.UTC(d.getUTCFullYear() + (d.getUTCMonth() < 6 ? 0 : 1), d.getUTCMonth() < 6 ? 6 : 0, 1);
    const eind = Math.min(volgendSemester - DAG, laatste);
    const dagen = Math.round((eind - dag) / DAG) + 1;
    interest += (bedragCent * pct * dagen) / (100 * 365);
    dag = eind + DAG;
  }
  return {
    dagen: Math.round((laatste - eerste) / DAG) + 1,
    interestCent: Math.round(interest),
    pctNu,
    forfaitCent: FORFAIT_CENT,
  };
}
