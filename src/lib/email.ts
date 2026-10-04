// Eén gedeelde, lichte e-mailhuisstijl voor álle transactionele
// studio-vm-mails (portaal, login, offerte, factuur, tickets…). Geen donkere
// achtergrond — witte kaart op #f4f4f5 met het vm.-wordmerk.
//
// Puur: geen server- of databankafhankelijkheid (enkel env via config), dus
// ook bruikbaar in voorbeeldscripts en de mail-preview van de admin.

import { siteUrl } from "@/lib/supabase/config";
import { FUNCTIE } from "@/lib/bedrijf";

const ACCENT = "#e08214";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

type Taal = "nl" | "fr" | "en" | "de" | "es";
const taalVan = (l?: string | null): Taal =>
  l === "fr" || l === "en" || l === "de" || l === "es" ? l : "nl";

const INTL: Record<Taal, string> = {
  nl: "nl-BE",
  fr: "fr-BE",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
};

/**
 * Basisadres voor links in mails: altijd de canonieke www-host in productie
 * (studio-vm.be zonder www stuurt door; in een mail willen we geen omweg).
 * Een ander adres in NEXT_PUBLIC_SITE_URL (bv. localhost) blijft behouden.
 */
export const MAIL_SITE: string = (() => {
  try {
    const u = new URL(siteUrl || "https://www.studio-vm.be");
    if (u.hostname === "studio-vm.be") u.hostname = "www.studio-vm.be";
    return u.origin;
  } catch {
    return "https://www.studio-vm.be";
  }
})();

/** Volledige link naar een pad op de site ("/nl/offerte" → https://www.studio-vm.be/nl/offerte). */
export function siteLink(pad: string): string {
  return `${MAIL_SITE}${pad.startsWith("/") ? pad : `/${pad}`}`;
}

/**
 * Link naar een plek in het klantenportaal, via de aanmeldpagina met ?next=:
 * wie al aangemeld is, landt meteen op `doel`; wie niet aangemeld is, meldt
 * zich aan en komt daarna op `doel` (de dashboard-layout zelf onthoudt dat niet).
 * `doel` is relatief aan /<taal>/portail/dashboard ("" = overzicht).
 */
export function portaalLink(taal: string, doel = ""): string {
  const t = taalVan(taal);
  const pad = `/${t}/portail/dashboard${doel && !doel.startsWith("/") ? `/${doel}` : doel}`;
  return `${MAIL_SITE}/${t}/portail?next=${encodeURIComponent(pad)}`;
}

/** € 1.234,50 — altijd met twee decimalen, in de notatie van de taal. */
export function mailBedrag(cent: number, taal?: string): string {
  return new Intl.NumberFormat(INTL[taalVan(taal)], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cent ?? 0) / 100);
}

/** 2026-10-17 → "17 oktober 2026" / "17 octobre 2026" / … (tekst die geen datum is, blijft staan). */
export function mailDatum(iso: string | null | undefined, taal?: string): string {
  const s = String(iso ?? "");
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
  if (!s || Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(INTL[taalVan(taal)], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

export type PortalEmailOpts = {
  locale?: string;
  eyebrow: string;
  title: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
  /** Extra HTML-blok tussen body en knop (bv. de offerte-preview). */
  extraHtml?: string;
};

export function portalEmailHtml(o: PortalEmailOpts): string {
  const year = new Date().getFullYear();
  const taal = taalVan(o.locale);
  const body = o.bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px;font:400 16px/1.7 ${FONT};color:#44403c">${l}</p>`,
    )
    .join("");
  // Breedte: 100% tot max. 600px (zo past de kaart op een gsm zonder
  // zijwaarts scrollen); Outlook (Word-engine) kent geen max-width en krijgt
  // via de mso-tabel een vaste 600px.
  return `<!DOCTYPE html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>@media (max-width:520px){.svm-buiten{padding:20px 10px !important}.svm-kaart{padding:30px 22px !important}.svm-blok{padding:18px 16px !important}}</style></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td class="svm-buiten" align="center" style="padding:48px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse">
  <tr><td class="svm-kaart" style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);padding:48px 44px">
    <p style="margin:0 0 32px;padding:0;font-family:${FONT};font-size:64px;line-height:64px;font-weight:800;letter-spacing:-4px;color:#1c1917;mso-line-height-rule:exactly">vm<span style="color:${ACCENT}">.</span></p>
    <p style="margin:0 0 10px;font:700 12px/1 ${MONO};letter-spacing:.18em;text-transform:uppercase;color:${ACCENT}">${o.eyebrow}</p>
    <h1 style="margin:0 0 22px;font:700 25px/1.35 ${FONT};color:#1c1917">${o.title}</h1>
    ${body}
    ${o.extraHtml ?? ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0;border-collapse:collapse"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td bgcolor="${ACCENT}" style="background:${ACCENT};border-radius:9px"><a href="${o.ctaHref}" style="display:inline-block;padding:16px 34px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none">${o.ctaLabel} &nbsp;&rarr;</a></td></tr></table></td></tr></table>
    ${
      o.footnote
        ? `<p style="margin:28px 0 0;padding-top:24px;border-top:1px solid #f0eeec;font:400 13px/1.65 ${FONT};color:#78716c">${o.footnote}</p>`
        : ""
    }
  </td></tr>
  <tr><td style="padding:24px 4px 0;text-align:center;font:400 11px/1.6 ${FONT};color:#a8a29e">&copy; ${year} Studio VM &middot; ${FUNCTIE[taal]} &middot; <a href="${MAIL_SITE}/${taal}" style="color:#a8a29e;text-decoration:none">studio-vm.be</a></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

// ── Kaarten in de mail (offerte, betaalde factuur) ──────────────────────

const KAART: Record<
  Taal,
  {
    offerte: string;
    factuur: string;
    watKrijgt: string;
    subtotaal: string;
    korting: string;
    naKorting: string;
    btw: string;
    btwVerlegd: string;
    totaalIncl: string;
    totaal: string;
    geldigTot: string;
    betaald: string;
    op: string;
    betaaldBedrag: string;
    perMaand: string;
    vastleg: string;
    gratisMaanden: string;
    promo: (datum: string, gratis: boolean) => string;
  }
> = {
  nl: {
    offerte: "Offerte",
    factuur: "Factuur",
    watKrijgt: "Wat u krijgt",
    subtotaal: "Subtotaal (excl. btw)",
    korting: "Korting",
    naKorting: "Na korting (excl. btw)",
    btw: "Btw (21%)",
    btwVerlegd: "Btw (0% &mdash; verlegd)",
    totaalIncl: "Totaal (incl. btw)",
    totaal: "Totaal",
    geldigTot: "Geldig tot",
    betaald: "BETAALD",
    op: "op",
    betaaldBedrag: "Betaald bedrag",
    perMaand: "/maand",
    vastleg: "Vastlegkorting &mdash; directe ondertekening (&minus;7%)",
    gratisMaanden: "Eerste 2 maanden support gratis",
    promo: (d, g) =>
      `&#9889; Beslist u v&oacute;&oacute;r ${d}, dan behoudt u <strong>7% korting</strong>${g ? " &eacute;n <strong>de eerste 2 maanden support gratis</strong>" : ""}. Daarna vervalt dit aanbod automatisch.`,
  },
  fr: {
    offerte: "Devis",
    factuur: "Facture",
    watKrijgt: "Ce que vous recevez",
    subtotaal: "Sous-total (HTVA)",
    korting: "Remise",
    naKorting: "Apr&egrave;s remise (HTVA)",
    btw: "TVA (21 %)",
    btwVerlegd: "TVA (0 % &mdash; autoliquidation)",
    totaalIncl: "Total (TVAC)",
    totaal: "Total",
    geldigTot: "Valable jusqu&rsquo;au",
    betaald: "PAY&Eacute;E",
    op: "le",
    betaaldBedrag: "Montant pay&eacute;",
    perMaand: "/mois",
    vastleg: "Remise de verrouillage &mdash; signature imm&eacute;diate (&minus;7 %)",
    gratisMaanden: "2 premiers mois de support offerts",
    promo: (d, g) =>
      `&#9889; Si vous d&eacute;cidez avant le ${d}, vous conservez <strong>7 % de remise</strong>${g ? " et <strong>les 2 premiers mois de support offerts</strong>" : ""}. Ensuite, cette offre expire automatiquement.`,
  },
  en: {
    offerte: "Quote",
    factuur: "Invoice",
    watKrijgt: "What you get",
    subtotaal: "Subtotal (excl. VAT)",
    korting: "Discount",
    naKorting: "After discount (excl. VAT)",
    btw: "VAT (21%)",
    btwVerlegd: "VAT (0% &mdash; reverse charge)",
    totaalIncl: "Total (incl. VAT)",
    totaal: "Total",
    geldigTot: "Valid until",
    betaald: "PAID",
    op: "on",
    betaaldBedrag: "Amount paid",
    perMaand: "/month",
    vastleg: "Lock-in discount &mdash; immediate signature (&minus;7%)",
    gratisMaanden: "First 2 months of support free",
    promo: (d, g) =>
      `&#9889; Decide before ${d} and you keep a <strong>7% discount</strong>${g ? " and <strong>the first 2 months of support free</strong>" : ""}. After that, this offer expires automatically.`,
  },
  de: {
    offerte: "Angebot",
    factuur: "Rechnung",
    watKrijgt: "Was Sie erhalten",
    subtotaal: "Zwischensumme (exkl. MwSt.)",
    korting: "Rabatt",
    naKorting: "Nach Rabatt (exkl. MwSt.)",
    btw: "MwSt. (21 %)",
    btwVerlegd: "MwSt. (0 % &mdash; Reverse-Charge)",
    totaalIncl: "Gesamt (inkl. MwSt.)",
    totaal: "Gesamt",
    geldigTot: "G&uuml;ltig bis",
    betaald: "BEZAHLT",
    op: "am",
    betaaldBedrag: "Bezahlter Betrag",
    perMaand: "/Monat",
    vastleg: "Festlegungsrabatt &mdash; sofortige Unterzeichnung (&minus;7 %)",
    gratisMaanden: "Die ersten 2 Monate Support kostenlos",
    promo: (d, g) =>
      `&#9889; Wenn Sie sich vor dem ${d} entscheiden, behalten Sie <strong>7 % Rabatt</strong>${g ? " und <strong>die ersten 2 Monate Support kostenlos</strong>" : ""}. Danach verf&auml;llt dieses Angebot automatisch.`,
  },
  es: {
    offerte: "Presupuesto",
    factuur: "Factura",
    watKrijgt: "Lo que recibe",
    subtotaal: "Subtotal (IVA no incluido)",
    korting: "Descuento",
    naKorting: "Tras el descuento (IVA no incluido)",
    btw: "IVA (21 %)",
    btwVerlegd: "IVA (0 % &mdash; inversi&oacute;n del sujeto pasivo)",
    totaalIncl: "Total (IVA incluido)",
    totaal: "Total",
    geldigTot: "V&aacute;lido hasta el",
    betaald: "PAGADA",
    op: "el",
    betaaldBedrag: "Importe pagado",
    perMaand: "/mes",
    vastleg: "Descuento por firma inmediata (&minus;7 %)",
    gratisMaanden: "Primeros 2 meses de soporte gratis",
    promo: (d, g) =>
      `&#9889; Si decide antes del ${d}, mantiene un <strong>7 % de descuento</strong>${g ? " y <strong>los 2 primeros meses de soporte gratis</strong>" : ""}. Despu&eacute;s, esta oferta caduca autom&aacute;ticamente.`,
  },
};

export type OfferPreview = {
  /** Taal van de labels (nl/fr/en/de/es). */
  locale?: string;
  offerNo?: string | null;
  greeting?: string;
  /** Netto na korting (excl. btw) — basis voor btw + totaal. */
  amountExclCents: number | null;
  vatReverse?: boolean;
  /** Al leesbaar geformatteerd (bv. mailDatum()). */
  validUntil?: string | null;
  /** Korte lijst "wat zit erin" — labels van de offerte-lijnen (HTML-veilig). */
  includes: string[];
  /** Maandelijks abonnement, indien van toepassing (enkel oude websiteoffertes). */
  subLabel?: string | null;
  subMonthlyCents?: number;
  /** Korting op de offerte (positief bedrag in cent). */
  discountCents?: number;
  /** Oude websiteoffertes: vastlegkorting bij directe ondertekening (groene banner). */
  lockin?: boolean;
  freeMonthsCents?: number;
};

// "De eerste 10 cm van de offerte" als nette kaart in de mail:
// nummer, wat erin zit, en de bedragen met btw. Rustig, professioneel.
export function offerPreviewHtml(p: OfferPreview): string {
  const taal = taalVan(p.locale);
  const K = KAART[taal];
  const eur = (c: number) => mailBedrag(c, taal);
  const amount = p.amountExclCents ?? 0;
  const vat = p.vatReverse ? 0 : Math.round(amount * 0.21);
  const incl = amount + vat;
  const vatLabel = p.vatReverse ? K.btwVerlegd : K.btw;
  const totaalLabel = p.vatReverse ? K.totaal : K.totaalIncl;

  const includeRows = p.includes
    .slice(0, 6)
    .map(
      (l) =>
        `<tr><td valign="top" style="padding:0 12px 9px 0;font:700 14px/1.5 ${FONT};color:${ACCENT}">&#10003;</td><td valign="top" style="padding:0 0 9px;font:400 14px/1.55 ${FONT};color:#44403c">${l}</td></tr>`,
    )
    .join("");

  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:7px 0;font:${
      strong ? "700" : "400"
    } 14px/1.4 ${FONT};color:${
      strong ? "#1c1917" : "#78716c"
    }">${label}</td><td align="right" style="padding:7px 0;font:${
      strong ? "700" : "400"
    } 14px/1.4 ${MONO};color:${
      strong ? "#1c1917" : "#44403c"
    };white-space:nowrap">${value}</td></tr>`;

  const subRow =
    p.subLabel && p.subMonthlyCents
      ? `<tr><td style="padding:7px 0;font:400 14px/1.4 ${FONT};color:#b45309">${p.subLabel}</td><td align="right" style="padding:7px 0;font:400 14px/1.4 ${MONO};color:#b45309;white-space:nowrap">${eur(
          p.subMonthlyCents,
        )}${K.perMaand}</td></tr>`
      : "";

  const greenRow = (label: string, value: string) =>
    `<tr><td bgcolor="#dcfce7" style="background:#dcfce7;padding:9px 12px;font:700 14px/1.4 ${FONT};color:#166534;border-radius:6px 0 0 6px">${label}</td><td bgcolor="#dcfce7" align="right" style="background:#dcfce7;padding:9px 12px;font:700 14px/1.4 ${MONO};color:#166534;border-radius:0 6px 6px 0;white-space:nowrap">${value}</td></tr><tr><td colspan="2" style="height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>`;

  const disc = p.discountCents ?? 0;
  const free = p.freeMonthsCents ?? 0;
  const gross = amount + disc;

  const promo =
    p.lockin && disc > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:separate"><tr><td bgcolor="#dcfce7" style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:14px 18px;font:600 14px/1.5 ${FONT};color:#166534">${K.promo(
          p.validUntil ?? "—",
          free > 0,
        )}</td></tr></table>`
      : "";

  const totalsRows =
    disc > 0
      ? `${row(K.subtotaal, eur(gross))}
        ${p.lockin ? greenRow(K.vastleg, "&minus; " + eur(disc)) : row(K.korting, "&minus; " + eur(disc))}
        ${row(K.naKorting, eur(amount))}
        ${row(vatLabel, eur(vat))}
        ${row(totaalLabel, eur(incl), true)}
        ${subRow}
        ${p.lockin && free > 0 ? greenRow(K.gratisMaanden, "&minus; " + eur(free)) : ""}`
      : `${row(K.subtotaal, eur(amount))}
        ${row(vatLabel, eur(vat))}
        ${row(totaalLabel, eur(incl), true)}
        ${subRow}`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate">
    <tr><td class="svm-blok" style="padding:26px 28px">
      ${
        p.offerNo
          ? `<p style="margin:0 0 16px;font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#a8a29e">${K.offerte} ${p.offerNo}</p>`
          : ""
      }
      ${
        includeRows
          ? `<p style="margin:0 0 12px;font:700 12px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#78716c">${K.watKrijgt}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${includeRows}</table>
      <div style="height:18px;line-height:18px;font-size:0">&nbsp;</div>`
          : ""
      }
      ${promo}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7e5e4;border-collapse:collapse">
        ${totalsRows}
      </table>
      ${
        p.validUntil
          ? `<p style="margin:16px 0 0;font:400 13px/1.5 ${FONT};color:#78716c">${K.geldigTot} <strong style="color:#44403c">${p.validUntil}</strong></p>`
          : ""
      }
    </td></tr>
  </table>`;
}

export type InvoicePaidPreview = {
  number: string;
  /** HTML-veilig (esc). */
  description?: string | null;
  amountExclCents: number;
  vatReverse?: boolean;
  /**
   * false = oude websitefactuur: amount_cents is het betaalde bedrag zelf,
   * zonder btw-opsplitsing. Standaard true (3D-project- en revisiefacturen).
   */
  metBtw?: boolean;
  paidAt?: string | null;
  locale?: string;
};

// Betaalde-factuur-kaart in de mail: nummer, omschrijving, bedragen
// met btw én een duidelijke groene BETAALD-stempel + datum.
export function invoicePaidPreviewHtml(p: InvoicePaidPreview): string {
  const taal = taalVan(p.locale);
  const K = KAART[taal];
  const eur = (c: number) => mailBedrag(c, taal);
  const amount = p.amountExclCents;
  const metBtw = p.metBtw !== false;
  const vat = metBtw && !p.vatReverse ? Math.round(amount * 0.21) : 0;
  const incl = amount + vat;
  const vatLabel = p.vatReverse ? K.btwVerlegd : K.btw;
  const totaalLabel = p.vatReverse ? K.totaal : K.totaalIncl;
  const dateStr = p.paidAt
    ? new Date(p.paidAt).toLocaleDateString(INTL[taal], {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Brussels",
      })
    : "";
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:7px 0;font:${strong ? "700" : "400"} 14px/1.4 ${FONT};color:${
      strong ? "#1c1917" : "#78716c"
    }">${label}</td><td align="right" style="padding:7px 0;font:${
      strong ? "700" : "400"
    } 14px/1.4 ${MONO};color:${strong ? "#1c1917" : "#44403c"};white-space:nowrap">${value}</td></tr>`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate">
    <tr><td class="svm-blok" style="padding:26px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
        <td style="font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#a8a29e">${K.factuur} ${p.number}</td>
        <td align="right"><span style="display:inline-block;background:#16a34a;color:#ffffff;font:700 12px/1 ${FONT};letter-spacing:.08em;text-transform:uppercase;padding:8px 14px;border-radius:6px">&#10003; ${K.betaald}${
          dateStr ? ` ${K.op} ${dateStr}` : ""
        }</span></td>
      </tr></table>
      ${
        p.description
          ? `<p style="margin:16px 0 0;font:600 15px/1.5 ${FONT};color:#1c1917">${p.description}</p>`
          : ""
      }
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #e7e5e4;border-collapse:collapse">
        ${
          metBtw
            ? `${row(K.subtotaal, eur(amount))}
        ${row(vatLabel, eur(vat))}
        ${row(totaalLabel, eur(incl), true)}`
            : row(K.betaaldBedrag, eur(amount), true)
        }
      </table>
    </td></tr>
  </table>`;
}
