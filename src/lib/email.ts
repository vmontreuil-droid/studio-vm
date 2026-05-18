// Eén gedeelde, lichte e-mailhuisstijl voor álle transactionele
// studio-vm-mails (portaal, login, offerte, scan…). Geen donkere
// achtergrond — witte kaart op #f4f4f5 met het vm.-wordmerk.

const ACCENT = "#e08214";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const body = o.bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px;font:400 16px/1.7 ${FONT};color:#44403c">${l}</p>`,
    )
    .join("");
  return `<!DOCTYPE html><html lang="${o.locale ?? "nl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td align="center" style="padding:48px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse">
  <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);padding:48px 44px">
    <p style="margin:0 0 34px;font:800 46px/1 ${FONT};letter-spacing:-3px;color:#1c1917">vm<span style="color:${ACCENT}">.</span></p>
    <p style="margin:0 0 10px;font:700 12px/1 ${MONO};letter-spacing:.18em;text-transform:uppercase;color:${ACCENT}">${o.eyebrow}</p>
    <h1 style="margin:0 0 22px;font:700 25px/1.35 ${FONT};color:#1c1917">${o.title}</h1>
    ${body}
    ${o.extraHtml ?? ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;border-collapse:separate"><tr><td bgcolor="${ACCENT}" style="background:${ACCENT};border-radius:9px"><a href="${o.ctaHref}" style="display:inline-block;padding:16px 34px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none">${o.ctaLabel} &nbsp;&rarr;</a></td></tr></table>
    ${
      o.footnote
        ? `<p style="margin:28px 0 0;padding-top:24px;border-top:1px solid #f0eeec;font:400 13px/1.65 ${FONT};color:#78716c">${o.footnote}</p>`
        : ""
    }
  </td></tr>
  <tr><td style="padding:24px 4px 0;text-align:center;font:400 11px/1.6 ${FONT};color:#a8a29e">&copy; ${year} Studio VM &middot; <a href="https://studio-vm.be" style="color:#a8a29e;text-decoration:none">studio-vm.be</a></td></tr>
</table></td></tr></table></body></html>`;
}

export type OfferPreview = {
  offerNo?: string | null;
  greeting?: string;
  amountExclCents: number | null;
  vatReverse?: boolean;
  validUntil?: string | null;
  /** Korte lijst "wat zit erin" — labels van de offerte-lijnen. */
  includes: string[];
  /** Maandelijks abonnement, indien van toepassing. */
  subLabel?: string | null;
  subMonthlyCents?: number;
};

// "De eerste 10 cm van de offerte" als nette kaart in de mail:
// nummer, wat erin zit, en de bedragen met btw. Rustig, professioneel.
export function offerPreviewHtml(p: OfferPreview): string {
  const amount = p.amountExclCents ?? 0;
  const vat = p.vatReverse ? 0 : Math.round(amount * 0.21);
  const incl = amount + vat;
  const vatLabel = p.vatReverse
    ? "Btw (0% &mdash; verlegd)"
    : "Btw (21%)";

  const includeRows = p.includes
    .slice(0, 6)
    .map(
      (l) =>
        `<tr><td valign="top" style="padding:0 12px 9px 0;font:700 14px/1.5 ${FONT};color:${ACCENT}">&#10003;</td><td valign="top" style="padding:0 0 9px;font:400 14px/1.55 ${FONT};color:#44403c">${l}</td></tr>`,
    )
    .join("");

  const row = (
    label: string,
    value: string,
    strong = false,
  ) =>
    `<tr><td style="padding:7px 0;font:${
      strong ? "700" : "400"
    } 14px/1.4 ${FONT};color:${
      strong ? "#1c1917" : "#78716c"
    }">${label}</td><td align="right" style="padding:7px 0;font:${
      strong ? "700" : "400"
    } 14px/1.4 ${MONO};color:${
      strong ? "#1c1917" : "#44403c"
    }">${value}</td></tr>`;

  const subRow =
    p.subLabel && p.subMonthlyCents
      ? `<tr><td style="padding:7px 0;font:400 14px/1.4 ${FONT};color:#b45309">${p.subLabel}</td><td align="right" style="padding:7px 0;font:400 14px/1.4 ${MONO};color:#b45309">${eur(
          p.subMonthlyCents,
        )}/mnd</td></tr>`
      : "";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate">
    <tr><td style="padding:26px 28px">
      ${
        p.offerNo
          ? `<p style="margin:0 0 16px;font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#a8a29e">Offerte ${p.offerNo}</p>`
          : ""
      }
      <p style="margin:0 0 12px;font:700 12px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#78716c">Wat je krijgt</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${includeRows}</table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid #e7e5e4;border-collapse:collapse">
        ${row("Eenmalig (excl. btw)", eur(amount))}
        ${row(vatLabel, eur(vat))}
        ${row("Totaal (incl. btw)", eur(incl), true)}
        ${subRow}
      </table>
      ${
        p.validUntil
          ? `<p style="margin:16px 0 0;font:400 13px/1.5 ${FONT};color:#78716c">Geldig tot <strong style="color:#44403c">${p.validUntil}</strong></p>`
          : ""
      }
    </td></tr>
  </table>`;
}
