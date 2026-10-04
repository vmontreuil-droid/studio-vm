import type { Locale } from "@/lib/i18n/config";
import { factuurVoorwaarden, type VoorwaardenSoort } from "@/lib/facturatie/voorwaarden";

// Voorwaarden onderaan elke factuur (document, portaal, beheer). Compact en
// in drie kolommen bij het afdrukken, zodat factuur + voorwaarden op één
// A4-blad passen; het blok splitst nooit over twee bladzijden.
export function FactuurVoorwaarden({ taal, soort }: { taal: Locale; soort: VoorwaardenSoort }) {
  const v = factuurVoorwaarden(taal, soort);
  return (
    <section className="factuur-voorwaarden mt-6 break-inside-avoid rounded-xl border bg-background p-4 shadow-sm print:mt-4 print:p-3 print:shadow-none">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">{v.titel}</p>
      <dl className="grid gap-x-5 gap-y-1.5 text-[11px] leading-snug text-muted sm:grid-cols-2 print:grid-cols-3 print:gap-x-4 print:gap-y-1 print:text-[7pt] print:leading-[1.3]">
        {v.punten.map((p) => (
          <div key={p.kop}>
            <dt className="inline font-semibold text-foreground">{p.kop}. </dt>
            <dd className="inline">{p.tekst}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[10px] text-muted print:mt-1.5 print:text-[7pt]">{v.volledig}</p>
      <p className="mt-3 border-t pt-3 text-center text-xs text-foreground print:mt-2 print:pt-2 print:text-[8pt]">{v.slot}</p>
    </section>
  );
}
