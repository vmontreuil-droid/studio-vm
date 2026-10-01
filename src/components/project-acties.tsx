"use client";

import { useState, useTransition } from "react";
import { Download, Lock, Loader2, Send, Check } from "lucide-react";
import { downloadLevering, downloadPlan, vraagRevisie } from "@/app/actions/projecten-klant";
import type { Locale } from "@/lib/i18n/config";

const T = {
  nl: { slot: "Beschikbaar na betaling", fout: "Downloaden lukte niet. Probeer opnieuw.", niet_betaald: "Beschikbaar zodra de factuur betaald is.", plaatsh: "Wat moet er aangepast worden? Gaat het om een planwijziging?", verstuur: "Revisie aanvragen", ok: "Uw vraag is verstuurd. U vindt ze terug bij Tickets." },
  fr: { slot: "Disponible après paiement", fout: "Le téléchargement a échoué. Réessayez.", niet_betaald: "Disponible dès que la facture est payée.", plaatsh: "Que faut-il adapter ? S'agit-il d'une modification des plans ?", verstuur: "Demander une révision", ok: "Votre demande est envoyée. Vous la retrouvez sous Tickets." },
  en: { slot: "Available after payment", fout: "Download failed. Please try again.", niet_betaald: "Available once the invoice is paid.", plaatsh: "What needs to change? Is it a change to the plans?", verstuur: "Request a revision", ok: "Your request has been sent. You'll find it under Tickets." },
  de: { slot: "Verfügbar nach Zahlung", fout: "Der Download ist fehlgeschlagen. Bitte versuchen Sie es erneut.", niet_betaald: "Verfügbar, sobald die Rechnung bezahlt ist.", plaatsh: "Was muss angepasst werden? Handelt es sich um eine Planänderung?", verstuur: "Revision anfordern", ok: "Ihre Anfrage wurde gesendet. Sie finden sie unter Tickets." },
  es: { slot: "Disponible tras el pago", fout: "La descarga ha fallado. Inténtelo de nuevo.", niet_betaald: "Disponible en cuanto se pague la factura.", plaatsh: "¿Qué hay que modificar? ¿Se trata de un cambio en los planos?", verstuur: "Solicitar una revisión", ok: "Su solicitud ha sido enviada. La encontrará en Tickets." },
};

function useDownload(locale: Locale) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  async function start(fn: () => ReturnType<typeof downloadLevering>) {
    setBezig(true);
    setFout(null);
    const r = await fn();
    setBezig(false);
    if (r.ok) window.location.href = r.url;
    else setFout(r.fout === "niet_betaald" ? T[locale].niet_betaald : T[locale].fout);
  }
  return { bezig, fout, start };
}

export function LeveringKnop({ id, naam, systeem, grootte, betaald, locale }: { id: string; naam: string; systeem: string; grootte: string; betaald: boolean; locale: Locale }) {
  const { bezig, fout, start } = useDownload(locale);
  return (
    <div>
      <button
        type="button"
        disabled={!betaald || bezig}
        onClick={() => start(() => downloadLevering(id))}
        className="flex w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-left text-sm transition-colors enabled:hover:border-accent disabled:opacity-70"
      >
        <span className="min-w-0">
          <span className="block font-medium">{systeem}</span>
          <span className="block truncate font-mono text-xs text-muted">
            {naam}
            {grootte ? ` · ${grootte}` : ""}
          </span>
        </span>
        {bezig ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
        ) : betaald ? (
          <Download className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
        ) : (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            {T[locale].slot}
          </span>
        )}
      </button>
      {fout && <p className="mt-1 text-xs text-red-500">{fout}</p>}
    </div>
  );
}

export function PlanKnop({ projectId, pad, naam, grootte, locale }: { projectId: string; pad: string; naam: string; grootte: string; locale: Locale }) {
  const { bezig, fout, start } = useDownload(locale);
  return (
    <li>
      <button
        type="button"
        disabled={bezig}
        onClick={() => start(() => downloadPlan(projectId, pad))}
        className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-accent"
      >
        <span className="truncate">{naam}</span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted">
          {grootte}
          {bezig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={2} />}
        </span>
      </button>
      {fout && <p className="text-xs text-red-500">{fout}</p>}
    </li>
  );
}

export function RevisieFormulier({ projectId, locale }: { projectId: string; locale: Locale }) {
  const t = T[locale];
  const [ok, setOk] = useState(false);
  const [bezig, start] = useTransition();
  if (ok)
    return (
      <p className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
        {t.ok}
      </p>
    );
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await vraagRevisie(fd);
          if (r.ok) setOk(true);
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="project" value={projectId} />
      <textarea
        name="tekst"
        required
        rows={4}
        placeholder={t.plaatsh}
        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={bezig}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2} />}
        {t.verstuur}
      </button>
    </form>
  );
}
