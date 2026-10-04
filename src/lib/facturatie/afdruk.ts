// Afdrukregels voor elke factuurweergave (document, portaal, beheer) — één
// bron. Doel: factuur + voorwaarden op één A4-blad, altijd in lichte kleuren.
//
//   • Lichte kleuren: ook wie de site in donker bekijkt, krijgt een witte
//     factuur (geen zwarte vlakken, geen onleesbare tekst).
//   • Enkel #print-area wordt afgedrukt; al de rest wordt echt weggelaten
//     (display:none via :has), zodat verborgen header/footer/zijbalk geen lege
//     bladzijden meer veroorzaken. Zonder :has-ondersteuning blijft de oude
//     verberg-regel als terugval.
//   • Elke factuur (.doc) op een nieuw blad; compacte maten.
export const FACTUUR_AFDRUK_CSS = `@page { size: A4; margin: 14mm 14mm; }
@media print {
  html, html.theme-dark, html.theme-light {
    --background: #ffffff !important;
    --foreground: #1c1917 !important;
    --muted: #57534e !important;
    --muted-foreground: #78716c !important;
    --accent: #b45309 !important;
    --border: #e7e5e4 !important;
    --card: #ffffff !important;
    --card-hover: #f5f5f4 !important;
    color-scheme: light !important;
  }
  html { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { background: #fff !important; color: #1c1917 !important; }
  body * { visibility: hidden !important; }
  body *:not(:has(#print-area)):not(#print-area):not(#print-area *) { display: none !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; }
  .no-print { display: none !important; }
  .doc { border: none !important; box-shadow: none !important; padding: 0 !important; background: #fff !important; }
  .doc + .doc { break-before: page; page-break-before: always; }
  .doc .text-6xl, .doc .text-7xl { font-size: 34pt !important; line-height: 1 !important; }
  .doc h2 { font-size: 12pt !important; margin-top: 10px !important; }
  .doc .mt-6, .doc .mt-7 { margin-top: 10px !important; }
  .doc .pb-6 { padding-bottom: 10px !important; }
  .doc .p-4, .doc .p-5 { padding: 8px 10px !important; }
  .doc .text-sm { font-size: 9pt !important; }
}`;
