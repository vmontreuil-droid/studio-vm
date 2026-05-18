// Eén gedeelde, lichte e-mailhuisstijl voor álle transactionele
// studio-vm-mails (portaal, login, offerte, scan…). Geen donkere
// achtergrond — witte kaart op #f4f4f5 met het vm.-wordmerk.

const ACCENT = "#e08214";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type PortalEmailOpts = {
  locale?: string;
  eyebrow: string;
  title: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
  /** Extra HTML-blok tussen body en knop (bv. een scorewidget). */
  extraHtml?: string;
};

export function portalEmailHtml(o: PortalEmailOpts): string {
  const year = new Date().getFullYear();
  const body = o.bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 14px;font:400 15px/1.65 ${FONT};color:#44403c">${l}</p>`,
    )
    .join("");
  return `<!DOCTYPE html><html lang="${o.locale ?? "nl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;border-collapse:collapse">
  <tr><td style="background:#ffffff;border:1px solid #e7e5e4;box-shadow:0 1px 3px rgba(0,0,0,0.06);padding:40px 38px">
    <p style="margin:0 0 26px;font:800 56px/1 ${FONT};letter-spacing:-4px;color:#1c1917">vm<span style="color:${ACCENT}">.</span></p>
    <p style="margin:0 0 6px;font:700 13px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:${ACCENT}">${o.eyebrow}</p>
    <h1 style="margin:8px 0 16px;font:700 22px/1.3 ${FONT};color:#1c1917">${o.title}</h1>
    ${body}
    ${o.extraHtml ?? ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:separate"><tr><td bgcolor="${ACCENT}" style="background:${ACCENT}"><a href="${o.ctaHref}" style="display:inline-block;padding:14px 30px;font:700 14px/1 ${FONT};color:#ffffff;text-decoration:none">${o.ctaLabel} &nbsp;&rarr;</a></td></tr></table>
    ${
      o.footnote
        ? `<p style="margin:24px 0 0;font:400 13px/1.6 ${FONT};color:#78716c">${o.footnote}</p>`
        : ""
    }
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.6 ${FONT};color:#57534e">&copy; ${year} Studio VM &middot; studio-vm.be</td></tr>
</table></td></tr></table></body></html>`;
}
