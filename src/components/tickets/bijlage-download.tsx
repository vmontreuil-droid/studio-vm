"use client";

// Downloadknop voor een ticketbijlage in het klantportaal: vraagt pas bij een
// klik een tijdelijke link (10 min) aan de server, na een eigendomscontrole.

import { useState } from "react";
import { AlertCircle, Download, Loader2, Paperclip } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { bestandGrootte } from "@/lib/tickets";
import { FOUT_TEKST } from "@/lib/tickets-teksten";
import { bijlageLinkKlant } from "@/app/actions/tickets-klant";

const T: Record<Locale, { download: (naam: string) => string }> = {
  nl: { download: (n) => `${n} downloaden` },
  fr: { download: (n) => `Télécharger ${n}` },
  en: { download: (n) => `Download ${n}` },
  de: { download: (n) => `${n} herunterladen` },
  es: { download: (n) => `Descargar ${n}` },
};

export function BijlageDownload({
  locale,
  id,
  naam,
  grootte,
}: {
  locale: Locale;
  id: string;
  naam: string;
  grootte?: number | null;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const maat = bestandGrootte(grootte, locale);

  async function start() {
    if (bezig) return;
    setBezig(true);
    setFout(null);
    try {
      const r = await bijlageLinkKlant(id);
      if (r.ok) {
        window.location.href = r.url;
      } else {
        setFout(FOUT_TEKST[r.fout][locale]);
      }
    } catch {
      setFout(FOUT_TEKST.opslag[locale]);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={start}
        disabled={bezig}
        aria-busy={bezig}
        aria-label={T[locale].download(naam)}
        title={naam}
        className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-left text-xs transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70"
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="min-w-0 truncate font-medium">{naam}</span>
        {maat && <span className="shrink-0 font-mono text-muted">{maat}</span>}
        {bezig ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        )}
      </button>
      {fout && (
        <p role="alert" className="mt-1 flex items-start gap-1.5 rounded-lg border border-red-400 bg-red-200 px-2 py-1 text-xs text-red-950">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{fout}</span>
        </p>
      )}
    </div>
  );
}
