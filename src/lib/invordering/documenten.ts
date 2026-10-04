import "server-only";
import { BEDRIJF } from "@/lib/bedrijf";
import { getCompanySettings } from "@/lib/admin/settings";
import { BANK } from "@/lib/bank";
import { btwLabel, btwVermelding } from "@/lib/facturatie/btw";
import { factuurVoorwaarden } from "@/lib/facturatie/voorwaarden";
import { portalEmailHtml, siteLink } from "@/lib/email";
import type { MailBijlage } from "@/lib/monitor";
import { Pdf } from "./pdf";
import type { Deurwaarder, Dossier, Gebeurtenis } from "./dossier";
import { ARR_NAAM, DOSSIER, FACTUUR_L, briefTaal, datum, euro, tijd, type BriefTaal, type DossierTeksten } from "./teksten";

// De drie pdf's voor de deurwaarder en de mail die ze meeneemt:
//   1. begeleidende brief (taal van de deurwaarder)
//   2. kopie van de factuur (taal van de klant, zoals ze verstuurd werd)
//   3. bewijsdossier: partijen, tijdlijn, offerte en aanvaarding, oplevering,
//      herinneringen met hun volledige tekst, voorwaarden

const HOOFD = `${BEDRIJF.naam} · ${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.gemeente} · ${BEDRIJF.btw} · ${BEDRIJF.email} · ${BEDRIJF.telefoon}`;
const ONDERNEMINGSNR = BEDRIJF.btw.replace(/^BE\s?/, "");

function gebeurtenis(g: Gebeurtenis, T: DossierTeksten): string {
  const w = g.w;
  switch (g.soort) {
    case "offerte":
      return T.offerteAanvaard(String(w.nummer ?? ""));
    case "levering":
      return T.opgeleverd(String(w.bestand ?? ""));
    case "factuur":
      return T.factuurUitgereikt(String(w.nummer ?? ""));
    case "factuurmail":
      return T.factuurVerstuurd(String(w.aan ?? ""));
    case "herinnering":
      return Number(w.niveau) >= 3 ? T.herinneringLaatste : T.herinnering(Number(w.niveau) || 1);
    case "download":
      return T.gedownload(String(w.bestand ?? ""));
    case "betaling":
      return T.betaald(String(w.via ?? ""));
    default:
      return "";
  }
}

const opDag = (g: Gebeurtenis, taal: BriefTaal) => (g.soort === "factuur" ? datum(g.op, taal) : tijd(g.op, taal));

function vorderingRegels(d: Dossier, T: DossierTeksten, taal: BriefTaal): [string, string][] {
  const v = { nummer: d.factuur.nummer, vervaldag: datum(d.factuur.vervaldag, taal), dagen: d.vordering.dagen, pct: `${String(d.vordering.pct ?? 0).replace(".", ",")} %` };
  const rijen: [string, string][] = [[T.hoofdsom(v), euro(d.vordering.hoofdsomCent, taal)]];
  if (d.zakelijk) {
    rijen.push([T.interest(v), euro(d.vordering.interestCent, taal)]);
    rijen.push([T.forfait, euro(d.vordering.forfaitCent, taal)]);
  }
  rijen.push([T.totaal, euro(d.vordering.totaalCent, taal)]);
  return rijen;
}

export function taalVoor(dw: Deurwaarder | null, d: Dossier): BriefTaal {
  if (dw?.taal) return dw.taal;
  // Zonder deurwaarder: Frans voor een Franstalige klant, anders Nederlands.
  return briefTaal(d.klant.taal);
}

// ── 1. Begeleidende brief ───────────────────────────────────────────────

export async function briefPdf(d: Dossier, dw: Deurwaarder): Promise<Uint8Array> {
  const taal = taalVoor(dw, d);
  const T = DOSSIER[taal];
  const s = await getCompanySettings();
  const iban = s.iban || BANK.iban;
  const pdf = await Pdf.nieuw(T.betreft(d.factuur.nummer, d.klant.naam), `${BEDRIJF.naam} · ${d.factuur.nummer}`);
  pdf.briefhoofd(`${HOOFD}\n${T.identiteit(BEDRIJF.houder, ONDERNEMINGSNR)}`);

  pdf.label(T.aan);
  pdf.alinea([dw.naam, dw.kantoor, dw.adres, dw.email].filter(Boolean).join("\n"), { grootte: 9.5 });
  pdf.alinea(T.plaatsDatum(datum(d.vordering.berekendOp, taal)));
  pdf.ruimte(4);
  pdf.alinea(T.betreft(d.factuur.nummer, d.klant.naam), { vet: true });
  pdf.alinea(T.referentie(d.factuur.nummer), { grootte: 9, kleur: "grijs" });

  pdf.alinea(T.aanhef);
  const arr = d.arrondissement ?? dw.arrondissement ?? null;
  const klant = [d.klant.naam, d.klant.btw ? `(${d.klant.btw})` : "", d.klant.adres ? `, ${d.klant.adres.replace(/\s*\n\s*/g, ", ")}` : ""].join(" ").replace(/ ,/g, ",").trim();
  pdf.alinea(T.inleiding(klant, arr ? ARR_NAAM[taal][arr] ?? arr : null));
  pdf.alinea(d.zakelijk ? T.zakelijk : T.particulier);

  pdf.label(T.overzicht(datum(d.vordering.berekendOp, taal)));
  pdf.bedragen(vorderingRegels(d, T, taal));
  if (d.zakelijk) pdf.alinea(T.interestLoopt, { grootte: 9, kleur: "grijs" });

  pdf.label(T.verloopKop);
  pdf.regels(d.tijdlijn.map((g) => [datum(g.op, taal), gebeurtenis(g, T)] as [string, string]), { labelBreedte: 115, grootte: 9 });
  pdf.alinea(T.geenBetaling);

  pdf.label(T.bijlagenKop);
  pdf.alinea(`1. ${T.bijlageFactuur(d.factuur.nummer)}\n2. ${T.bijlageBewijs}`, { grootte: 9.5 });
  pdf.ruimte(4);
  pdf.alinea(T.betaling(iban, d.factuur.ogm), { grootte: 9.5 });
  pdf.alinea(T.contact(BEDRIJF.email, BEDRIJF.telefoon), { grootte: 9.5 });
  pdf.ruimte(8);
  pdf.alinea(T.groet);
  pdf.alinea(BEDRIJF.naam, { vet: true });
  return pdf.bytes();
}

// ── 2. Kopie van de factuur ─────────────────────────────────────────────

export async function factuurPdf(d: Dossier): Promise<Uint8Array> {
  const taal = d.klant.taal;
  const L = FACTUUR_L[taal];
  const s = await getCompanySettings();
  const f = d.factuur;
  const pdf = await Pdf.nieuw(`${L.titel} ${f.nummer}`, `${L.kopie} · ${f.nummer}`);
  pdf.briefhoofd(HOOFD);

  pdf.kop(`${L.titel} ${f.nummer}`, 17);
  pdf.alinea(`${L.uitgereikt} ${datum(f.uitgereikt, taal)} · ${L.kopie}`, { grootte: 9, kleur: "grijs" });

  pdf.label(L.van);
  pdf.alinea(
    [
      `${s.company_name || BEDRIJF.naam}${s.bank_holder ? ` — ${s.bank_holder}` : ""}`,
      `${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.gemeente}`,
      s.vat_number || BEDRIJF.btw,
      `IBAN ${s.iban || BANK.iban}`,
    ].join("\n"),
    { grootte: 9.5 },
  );
  pdf.label(L.voor);
  pdf.alinea(
    [d.klant.naam, d.klant.adres, d.klant.btw ? `BTW ${d.klant.btw}` : null, d.klant.email].filter(Boolean).join("\n"),
    { grootte: 9.5 },
  );

  if (f.omschrijving) {
    pdf.ruimte(4);
    pdf.alinea(f.omschrijving, { vet: true, grootte: 11 });
  }
  pdf.ruimte(4);
  if (f.metBtw) {
    pdf.bedragen([
      [L.excl, euro(f.exclCent, taal)],
      [btwLabel(f.regime, taal), euro(f.btwCent, taal)],
      [L.incl, euro(f.totaalCent, taal)],
    ]);
    const vermelding = btwVermelding(f.regime, taal);
    if (vermelding) pdf.alinea(`${vermelding}${d.klant.btw ? ` · ${d.klant.btw}` : ""}`, { grootte: 8.5, kleur: "grijs" });
  } else {
    pdf.bedragen([[L.incl, euro(f.totaalCent, taal)]]);
  }

  pdf.label(L.betaling);
  pdf.regels(
    [
      [L.voor_, datum(f.vervaldag, taal)],
      [L.begunstigde, s.bank_holder || BANK.holder],
      ["IBAN", `${s.iban || BANK.iban}${(s.bic || BANK.bic) ? ` · BIC ${s.bic || BANK.bic}` : ""}`],
      [L.mededeling, f.ogm],
    ],
    { labelBreedte: 160 },
  );

  voorwaarden(pdf, d);
  return pdf.bytes();
}

function voorwaarden(pdf: Pdf, d: Dossier, kop?: string, uitleg?: string): void {
  const v = factuurVoorwaarden(d.klant.taal, d.factuur.soort === "andere" ? "website" : "uurwerk");
  pdf.label(kop ?? v.titel);
  if (uitleg) pdf.alinea(uitleg, { grootte: 8.5, kleur: "grijs" });
  for (const p of v.punten) pdf.alinea(`${p.kop}: ${p.tekst}`, { grootte: 8 });
  pdf.alinea(v.volledig, { grootte: 8, kleur: "grijs" });
}

// ── 3. Bewijsdossier ────────────────────────────────────────────────────

export async function bewijsPdf(d: Dossier, taal: BriefTaal): Promise<Uint8Array> {
  const T = DOSSIER[taal];
  const pdf = await Pdf.nieuw(T.bewijsTitel(d.factuur.nummer), `${BEDRIJF.naam} · ${T.bewijsTitel(d.factuur.nummer)}`);
  pdf.briefhoofd(HOOFD);
  pdf.kop(T.bewijsTitel(d.factuur.nummer));

  pdf.label(T.partijen);
  pdf.regels([
    [T.schuldeiser, `${BEDRIJF.naam} (${BEDRIJF.houder}), ${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.gemeente} · ${BEDRIJF.btw} · ${BEDRIJF.email}`],
    [T.schuldenaar, [d.klant.naam, d.klant.adres?.replace(/\s*\n\s*/g, ", "), d.klant.btw, d.klant.email, d.klant.telefoon].filter(Boolean).join(" · ")],
  ]);

  pdf.label(T.overzicht(datum(d.vordering.berekendOp, taal)));
  pdf.bedragen(vorderingRegels(d, T, taal));

  pdf.label(T.tijdlijnKop);
  pdf.regels(d.tijdlijn.map((g) => [opDag(g, taal), gebeurtenis(g, T)] as [string, string]), { labelBreedte: 150, grootte: 9 });

  if (d.offerte) {
    const o = d.offerte;
    pdf.label(T.offerteKop);
    const rijen: [string, string][] = [
      [T.offerteNr, o.nummer || "—"],
      [T.onderwerp, o.titel || "—"],
    ];
    if (o.bedragCent != null) rijen.push([T.bedrag, euro(o.bedragCent, taal)]);
    rijen.push([T.aanvaardOp, o.aanvaardOp ? tijd(o.aanvaardOp, taal) : "—"]);
    if (o.ip) rijen.push([T.ipAdres, o.ip]);
    if (o.browser) rijen.push([T.browser, o.browser]);
    pdf.regels(rijen);
    if (o.regels.length) pdf.bedragen(o.regels.map((r) => [r.label, r.cent == null ? "" : euro(r.cent, taal)] as [string, string]), false);
  }

  if (d.project) {
    pdf.label(T.projectKop);
    const rijen: [string, string][] = [[T.onderwerp, d.project.titel]];
    if (d.project.gewerkteUren != null) rijen.push([T.gewerkteUren, String(d.project.gewerkteUren).replace(".", ",")]);
    for (const l of d.leveringen) rijen.push([tijd(l.op, taal), `${l.naam} (${l.systeem}, v${l.versie})`]);
    pdf.regels(rijen);
  }

  pdf.label(T.factuurKop);
  pdf.regels([
    [T.factuurKop, d.factuur.nummer],
    [T.uitgereiktOp, datum(d.factuur.uitgereikt, taal)],
    [T.vervaldag, datum(d.factuur.vervaldag, taal)],
    [T.bedrag, euro(d.factuur.totaalCent, taal)],
    [T.mededeling, d.factuur.ogm],
  ]);

  if (d.herinneringen.length) {
    pdf.nieuweBladzijde();
    pdf.kop(T.herinneringenKop);
    pdf.alinea(T.herinneringenUitleg, { grootte: 9, kleur: "grijs" });
    for (const h of d.herinneringen) {
      pdf.label(h.niveau >= 3 ? T.herinneringLaatste : T.herinnering(h.niveau || 1));
      const rijen: [string, string][] = [[T.verstuurdOp, tijd(h.op, taal)]];
      if (h.aan) rijen.push([T.verstuurdAan, h.aan]);
      if (h.onderwerp) rijen.push([T.onderwerp, h.onderwerp]);
      if (h.resendId) rijen.push([T.resendId, h.resendId]);
      pdf.regels(rijen, { grootte: 9 });
      pdf.alinea(h.tekst ?? T.geenTekst, { grootte: 8.5, inspring: 8, kleur: h.tekst ? "zwart" : "grijs" });
      pdf.lijn();
    }
  }

  voorwaarden(pdf, d, T.voorwaardenKop, T.voorwaardenUitleg);
  return pdf.bytes();
}

// ── Mail aan de deurwaarder ─────────────────────────────────────────────

const naam = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, "-");
const BESTAND: Record<BriefTaal, { brief: string; bewijs: string }> = {
  nl: { brief: "Brief", bewijs: "Bewijsdossier" },
  fr: { brief: "Lettre", bewijs: "Dossier-de-preuves" },
  de: { brief: "Begleitschreiben", bewijs: "Beweisakte" },
};

export async function dossierBijlagen(d: Dossier, dw: Deurwaarder): Promise<MailBijlage[]> {
  const taal = taalVoor(dw, d);
  const nr = naam(d.factuur.nummer);
  const [brief, factuur, bewijs] = await Promise.all([briefPdf(d, dw), factuurPdf(d), bewijsPdf(d, taal)]);
  const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
  return [
    { filename: `1-${BESTAND[taal].brief}-${nr}.pdf`, content: b64(brief) },
    { filename: `2-${naam(FACTUUR_L[d.klant.taal].titel)}-${nr}.pdf`, content: b64(factuur) },
    { filename: `3-${BESTAND[taal].bewijs}-${nr}.pdf`, content: b64(bewijs) },
  ];
}

export function deurwaarderMail(d: Dossier, dw: Deurwaarder): { subject: string; html: string; replyTo: string } {
  const taal = taalVoor(dw, d);
  const T = DOSSIER[taal];
  const href = d.factuur.publicToken ? siteLink(`/${d.klant.taal}/factuur/${d.factuur.publicToken}`) : siteLink(`/${taal}`);
  return {
    subject: T.mailOnderwerp(d.factuur.nummer, d.klant.naam),
    html: portalEmailHtml({
      locale: taal,
      eyebrow: BEDRIJF.naam,
      title: T.mailTitel,
      bodyLines: [...T.mailRegels(esc(d.klant.naam), esc(d.factuur.nummer), euro(d.vordering.totaalCent, taal)), T.mailBijlagen],
      ctaLabel: T.mailKnop,
      ctaHref: href,
      footnote: `${T.mailVoet}<br>${BEDRIJF.naam} · ${BEDRIJF.email} · ${BEDRIJF.telefoon}`,
    }),
    replyTo: BEDRIJF.email,
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
