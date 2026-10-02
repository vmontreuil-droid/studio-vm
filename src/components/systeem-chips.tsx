import { SYSTEMEN_LABEL, type Systeem } from "@/lib/realisaties";
import type { Locale } from "@/lib/i18n/config";

// Kleine merk-chips (Trimble, Topcon, ...) bij een realisatie. Enkel <span>'s,
// zodat ze ook binnen een <button> geldig zijn. Schermlezers horen
// "Machinebesturing: Trimble, Topcon". Geen hooks: bruikbaar in de galerij
// en in de viewer van de uitgelichte projecten.
export function SysteemChips({ systemen, locale, className = "" }: { systemen: Systeem[]; locale: Locale; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      <span className="sr-only">{SYSTEMEN_LABEL[locale]}: </span>
      {systemen.map((s, i) => (
        <span key={s} className="inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          {s}
          {i < systemen.length - 1 && <span className="sr-only">, </span>}
        </span>
      ))}
    </span>
  );
}
