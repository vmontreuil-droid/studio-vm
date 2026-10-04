import { ogmCijfers } from "@/lib/facturatie/nummers";
// Tolerante CSV-parser voor Belgische bankafschriften. Banken
// verschillen sterk (delimiter ; of , — kolomnamen NL/FR/EN), dus
// we detecteren delimiter en kolommen op trefwoord i.p.v. vaste index.

export type ParsedTx = {
  bookedAt: string; // ISO yyyy-mm-dd
  amountCents: number; // + inkomend / - uitgaand
  counterparty: string | null;
  communication: string | null;
};

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === delim && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toISO(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function toCents(raw: string): number | null {
  let s = raw.replace(/\s/g, "").replace(/[€]/g, "");
  if (!s) return null;
  // 1.234,56 (BE) of 1,234.56 (EN): laatste scheidingsteken = decimaal.
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

const COL = {
  date: /datum|date|valuta|boeking|uitvoering/i,
  amount: /bedrag|amount|montant|mutatie/i,
  debit: /debet|debit|af|uitgaven/i,
  credit: /credit|bij|inkomsten/i,
  comm: /mededeling|communication|omschrijving|description|détail|libell|reference|referentie|référence|referenz/i,
  party: /tegenpartij|naam|begunstigde|counterparty|contrepartie|payee|payer|betaler/i,
  // Revolut e.a.: enkel voltooide transacties tellen (niet PENDING/REVERTED/DECLINED).
  state: /^(state|status|staat)$/i,
};
// Exacte kolomnaam gaat voor (Revolut Business heeft "Orig amount",
// "Amount" en "Total amount": "Amount" is het ontvangen bedrag).
const EXACT = {
  amount: /^(bedrag|amount|montant)$/i,
};
const VOLTOOID = /^(completed|voltooid|terminé|abgeschlossen|uitgevoerd|executed|booked)$/i;

export function parseBankCsv(text: string): ParsedTx[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];
  const lines = clean.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const delim =
    (lines[0].match(/;/g)?.length ?? 0) >=
    (lines[0].match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const header = splitLine(lines[0], delim).map((h) => h.toLowerCase());
  const find = (re: RegExp) => header.findIndex((h) => re.test(h));

  const iDate = find(COL.date);
  const iAmountExact = find(EXACT.amount);
  const iAmount = iAmountExact >= 0 ? iAmountExact : find(COL.amount);
  const iDebit = find(COL.debit);
  const iCredit = find(COL.credit);
  // Alle mededeling-achtige kolommen samen (Revolut: "Reference" én
  // "Description"): de gestructureerde mededeling kan in elk ervan staan.
  const iComms = header.map((h, i) => (COL.comm.test(h) ? i : -1)).filter((i) => i >= 0);
  const iParty = find(COL.party);
  const iState = find(COL.state);
  if (iDate < 0 || (iAmount < 0 && iDebit < 0 && iCredit < 0)) return [];

  const rows: ParsedTx[] = [];
  for (let r = 1; r < lines.length; r++) {
    const f = splitLine(lines[r], delim);
    if (iState >= 0 && f[iState] && !VOLTOOID.test(f[iState])) continue;
    const iso = toISO(f[iDate] ?? "");
    if (!iso) continue;

    let cents: number | null = null;
    if (iAmount >= 0) cents = toCents(f[iAmount] ?? "");
    if (cents == null && (iDebit >= 0 || iCredit >= 0)) {
      const deb = iDebit >= 0 ? toCents(f[iDebit] ?? "") : null;
      const cre = iCredit >= 0 ? toCents(f[iCredit] ?? "") : null;
      if (cre) cents = Math.abs(cre);
      else if (deb) cents = -Math.abs(deb);
    }
    if (cents == null) continue;

    rows.push({
      bookedAt: iso,
      amountCents: cents,
      counterparty: iParty >= 0 ? f[iParty] || null : null,
      communication: [...new Set(iComms.map((i) => f[i]).filter(Boolean))].join(" · ") || null,
    });
  }
  return rows;
}

export function fingerprint(t: ParsedTx): string {
  return [
    t.bookedAt,
    t.amountCents,
    (t.communication ?? "").replace(/\s+/g, "").slice(0, 40),
    (t.counterparty ?? "").replace(/\s+/g, "").slice(0, 30),
  ]
    .join("|")
    .toLowerCase();
}

// 12-cijferige kern van een Belgische gestructureerde mededeling, enkel als
// de controlecijfers kloppen. Zoekt eerst de vorm +++123/4567/89012+++ (ook
// met *** of zonder tekens), daarna elke reeks van 12 cijfers.
export function structuredDigits(s: string | null): string | null {
  if (!s) return null;
  for (const m of s.matchAll(/(\d{3})\s*\/?\s*(\d{4})\s*\/?\s*(\d{5})/g)) {
    const kandidaat = ogmCijfers(m[1] + m[2] + m[3]);
    if (kandidaat) return kandidaat;
  }
  const d = s.replace(/\D/g, "");
  for (let i = 0; i + 12 <= d.length; i++) {
    const kandidaat = ogmCijfers(d.slice(i, i + 12));
    if (kandidaat) return kandidaat;
  }
  return null;
}
