"use client";

// Antwoordvak onder een ticket in het klantportaal (met bijlagen), en de knop
// waarmee de klant zijn ticket zelf sluit. Na een geslaagde actie ververst de
// server de pagina (herlaadTicket), zodat het nieuwe bericht meteen in het
// gesprek staat.

import { useId, useRef, useState, useTransition } from "react";
import { AlertCircle, Check, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { MAX_BERICHT, type GeuploadBestand, type TicketFout } from "@/lib/tickets";
import { FOUT_TEKST } from "@/lib/tickets-teksten";
import { uploadBestanden } from "@/lib/tickets-upload";
import { BestandenKiezer } from "@/components/tickets/bestanden-kiezer";
import { antwoordTicket, bijlagePlekkenKlant, sluitTicketKlant } from "@/app/actions/tickets-klant";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const T: Record<
  Locale,
  {
    label: string;
    plaats: string;
    heropent: string;
    verstuur: string;
    bezig: string;
    ok: string;
    tekens: (n: number, max: number) => string;
    sluit: string;
    sluitBevestig: string;
  }
> = {
  nl: {
    label: "Uw antwoord",
    plaats: "Typ hier uw antwoord…",
    heropent: "Dit ticket is gesloten. Met uw antwoord gaat het opnieuw open.",
    verstuur: "Antwoord versturen",
    bezig: "Bezig met versturen…",
    ok: "Uw antwoord is verstuurd.",
    tekens: (n, m) => `${n} / ${m} tekens`,
    sluit: "Opgelost — ticket sluiten",
    sluitBevestig: "Wilt u dit ticket sluiten? U kunt het later nog heropenen door te antwoorden.",
  },
  fr: {
    label: "Votre réponse",
    plaats: "Saisissez votre réponse ici…",
    heropent: "Ce ticket est fermé. Votre réponse le rouvrira.",
    verstuur: "Envoyer la réponse",
    bezig: "Envoi en cours…",
    ok: "Votre réponse a été envoyée.",
    tekens: (n, m) => `${n} / ${m} caractères`,
    sluit: "Problème résolu — fermer",
    sluitBevestig: "Voulez-vous fermer ce ticket ? Vous pourrez le rouvrir plus tard en y répondant.",
  },
  en: {
    label: "Your reply",
    plaats: "Type your reply here…",
    heropent: "This ticket is closed. Your reply will reopen it.",
    verstuur: "Send reply",
    bezig: "Sending…",
    ok: "Your reply has been sent.",
    tekens: (n, m) => `${n} / ${m} characters`,
    sluit: "Resolved — close ticket",
    sluitBevestig: "Would you like to close this ticket? You can reopen it later by replying.",
  },
  de: {
    label: "Ihre Antwort",
    plaats: "Geben Sie hier Ihre Antwort ein…",
    heropent: "Dieses Ticket ist geschlossen. Mit Ihrer Antwort wird es wieder geöffnet.",
    verstuur: "Antwort senden",
    bezig: "Wird gesendet…",
    ok: "Ihre Antwort wurde gesendet.",
    tekens: (n, m) => `${n} / ${m} Zeichen`,
    sluit: "Gelöst — Ticket schließen",
    sluitBevestig: "Möchten Sie dieses Ticket schließen? Sie können es später durch eine Antwort wieder öffnen.",
  },
  es: {
    label: "Su respuesta",
    plaats: "Escriba aquí su respuesta…",
    heropent: "Este ticket está cerrado. Su respuesta lo volverá a abrir.",
    verstuur: "Enviar respuesta",
    bezig: "Enviando…",
    ok: "Su respuesta se ha enviado.",
    tekens: (n, m) => `${n} / ${m} caracteres`,
    sluit: "Resuelto — cerrar ticket",
    sluitBevestig: "¿Desea cerrar este ticket? Podrá volver a abrirlo más tarde respondiendo.",
  },
};

export function KlantAntwoord({
  locale,
  ticketId,
  heropent,
  bijlagenAan,
}: {
  locale: Locale;
  ticketId: string;
  heropent: boolean;
  bijlagenAan: boolean;
}) {
  const t = T[locale];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tekstId = `antwoord-${id}`;
  const tellerId = `antwoord-teller-${id}`;
  const [body, setBody] = useState("");
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [voortgang, setVoortgang] = useState<number | null>(null);
  const [fout, setFout] = useState<TicketFout | null>(null);
  const [ok, setOk] = useState(false);
  const [bezig, start] = useTransition();
  const loopt = useRef(false);
  // Al opgeladen bestanden (bij een fout na het opladen niet opnieuw opladen).
  const geupload = useRef<{ voor: File[]; items: GeuploadBestand[] } | null>(null);
  const veld = useRef<HTMLTextAreaElement>(null);

  function verstuur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loopt.current) return;
    setOk(false);
    if (!body.trim()) {
      setFout("leeg");
      veld.current?.focus();
      return;
    }
    loopt.current = true;
    setFout(null);
    start(async () => {
      try {
        let items: GeuploadBestand[] = [];
        if (bestanden.length > 0) {
          if (geupload.current?.voor === bestanden) {
            items = geupload.current.items;
          } else {
            const p = await bijlagePlekkenKlant(bestanden.map((f) => ({ naam: f.name, grootte: f.size })));
            if (!p.ok) {
              setFout(p.fout);
              return;
            }
            setVoortgang(0);
            items = await uploadBestanden(p.plekken, bestanden, (f) => setVoortgang(f));
            geupload.current = { voor: bestanden, items };
          }
        }
        const fd = new FormData();
        fd.set("ticket_id", ticketId);
        fd.set("body", body);
        fd.set("bijlagen", JSON.stringify(items));
        const r = await antwoordTicket(fd);
        if (!r.ok) {
          setFout(r.fout);
          return;
        }
        setBody("");
        setBestanden([]);
        geupload.current = null;
        setOk(true);
      } catch {
        setFout("opslag");
      } finally {
        setVoortgang(null);
        loopt.current = false;
      }
    });
  }

  return (
    <form onSubmit={verstuur} noValidate className="space-y-4" aria-busy={bezig}>
      {heropent && (
        <p className="flex items-start gap-2 rounded-xl border border-accent/40 bg-accent/5 p-3 text-sm">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
          <span>{t.heropent}</span>
        </p>
      )}
      <div>
        <label htmlFor={tekstId} className="block text-sm font-medium">
          {t.label}
        </label>
        <textarea
          ref={veld}
          id={tekstId}
          name="body"
          required
          rows={5}
          maxLength={MAX_BERICHT}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (ok) setOk(false);
          }}
          disabled={bezig}
          placeholder={t.plaats}
          aria-describedby={tellerId}
          aria-invalid={fout === "leeg" || fout === "te_lang" ? true : undefined}
          className={`mt-1.5 block w-full rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-accent disabled:opacity-70 ${FOCUS}`}
        />
        <p id={tellerId} className="mt-1 text-right font-mono text-xs text-muted">
          {t.tekens(body.length, MAX_BERICHT)}
        </p>
      </div>

      {bijlagenAan && (
        <BestandenKiezer
          locale={locale}
          bestanden={bestanden}
          onChange={(f) => {
            setBestanden(f);
            if (ok) setOk(false);
          }}
          disabled={bezig}
          voortgang={voortgang}
          id={`antwoord-bijlagen-${id}`}
        />
      )}

      {fout && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-400 bg-red-200 p-3 text-sm text-red-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{FOUT_TEKST[fout][locale]}</span>
        </p>
      )}
      {ok && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500 bg-emerald-300 p-3 text-sm text-emerald-950">
          <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span>{t.ok}</span>
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={bezig}
          aria-busy={bezig}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60 ${FOCUS}`}
        >
          {bezig ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
          {bezig ? t.bezig : t.verstuur}
        </button>
      </div>
    </form>
  );
}

export function SluitTicketKnop({ locale, ticketId }: { locale: Locale; ticketId: string }) {
  const t = T[locale];
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState<TicketFout | null>(null);

  function sluit() {
    if (bezig) return;
    if (!window.confirm(t.sluitBevestig)) return;
    setFout(null);
    start(async () => {
      try {
        const r = await sluitTicketKlant(ticketId);
        if (!r.ok) setFout(r.fout);
      } catch {
        setFout("opslag");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={sluit}
        disabled={bezig}
        aria-busy={bezig}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60 ${FOCUS}`}
      >
        {bezig ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
        {t.sluit}
      </button>
      {fout && (
        <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-red-400 bg-red-200 p-3 text-sm text-red-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{FOUT_TEKST[fout][locale]}</span>
        </p>
      )}
    </div>
  );
}
