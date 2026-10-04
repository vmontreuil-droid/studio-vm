"use client";

// Antwoordvak op /admin/tickets/[id]: tekst + bijlagen, met 'Ticket sluiten
// na dit antwoord' en 'Klant mailen'. Bijlagen gaan rechtstreeks naar de
// privé-opslag (eenmalige upload-links), daarna bewaart antwoordStudio het
// bericht en registreert de bestanden.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { antwoordStudio, bijlagePlekkenStudio } from "@/app/actions/tickets-admin";
import { BestandenKiezer } from "@/components/tickets/bestanden-kiezer";
import { uploadBestanden } from "@/lib/tickets-upload";
import { MAX_BERICHT_STUDIO, type GeuploadBestand, type TicketFout } from "@/lib/tickets";
import { FOUT_TEKST } from "@/lib/tickets-teksten";

const VELD =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

type Melding = { soort: "ok" | "let-op" | "fout"; tekst: string };

const fout = (f: TicketFout | undefined) => (f ? FOUT_TEKST[f].nl : FOUT_TEKST.opslag.nl);

export function TicketAntwoord({
  ticketId,
  bijlagen,
  gesloten,
}: {
  ticketId: string;
  /** Bijlagen mogelijk (migratie 0049 gedraaid). */
  bijlagen: boolean;
  gesloten: boolean;
}) {
  const router = useRouter();
  const [tekst, setTekst] = useState("");
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [sluiten, setSluiten] = useState(false);
  const [mailen, setMailen] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [voortgang, setVoortgang] = useState<number | null>(null);
  const [melding, setMelding] = useState<Melding | null>(null);
  const [, startTransition] = useTransition();

  async function verstuur() {
    if (bezig) return;
    const body = tekst.trim();
    if (!body) {
      setMelding({ soort: "fout", tekst: "Typ eerst een antwoord." });
      return;
    }
    setBezig(true);
    setMelding(null);
    // Waar ging het mis? Tijdens het opladen is er zeker nog niets verstuurd;
    // valt antwoordStudio zelf weg (netwerk, nieuwe uitrol), dan kan het
    // bericht al bewaard en de klant al gemaild zijn.
    let fase: "opladen" | "versturen" = "opladen";
    try {
      let geupload: GeuploadBestand[] = [];
      if (bijlagen && bestanden.length > 0) {
        const plekken = await bijlagePlekkenStudio(
          ticketId,
          bestanden.map((f) => ({ naam: f.name, grootte: f.size })),
        );
        if (!plekken.ok) {
          setMelding({ soort: "fout", tekst: fout(plekken.fout) });
          return;
        }
        setVoortgang(0);
        geupload = await uploadBestanden(plekken.plekken, bestanden, (f) => setVoortgang(f));
      }

      const fd = new FormData();
      fd.set("ticket_id", ticketId);
      fd.set("body", body);
      fd.set("bijlagen", JSON.stringify(geupload));
      if (sluiten) fd.set("sluiten", "1");
      if (mailen) fd.set("mail", "1");
      fase = "versturen";
      const r = await antwoordStudio(fd);
      if (!r.ok) {
        setMelding({ soort: "fout", tekst: fout(r.fout) });
        return;
      }

      const extra = sluiten ? " · ticket gesloten" : "";
      if (r.fout) {
        setMelding({ soort: "let-op", tekst: `Verstuurd${extra}, maar niet alle bijlagen zijn bewaard: ${fout(r.fout)}` });
      } else if (mailen && !r.mail) {
        setMelding({ soort: "let-op", tekst: `Verstuurd${extra}, maar de mail ging niet weg (enkel gelogd).` });
      } else {
        setMelding({ soort: "ok", tekst: `Verstuurd${mailen ? " · klant gemaild" : " · zonder mail"}${extra}` });
      }
      setTekst("");
      setBestanden([]);
      setSluiten(false);
      setMailen(true);
      startTransition(() => router.refresh());
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      if (fase === "opladen") {
        setMelding({ soort: "fout", tekst: `Opladen mislukt — er is niets verstuurd. ${detail}`.trim() });
      } else {
        // Tekst blijft staan; het gesprek wordt herladen zodat u ziet of het antwoord er al staat.
        setMelding({
          soort: "fout",
          tekst: `Onbekend of het antwoord bewaard is — de pagina wordt herladen, controleer het gesprek vóór u opnieuw verstuurt. ${detail}`.trim(),
        });
        startTransition(() => router.refresh());
      }
    } finally {
      setBezig(false);
      setVoortgang(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verstuur();
      }}
      className="space-y-4"
      aria-busy={bezig}
    >
      <div>
        <label htmlFor={`antwoord-${ticketId}`} className="block text-sm font-medium">
          Antwoord aan klant
        </label>
        <textarea
          id={`antwoord-${ticketId}`}
          name="body"
          rows={6}
          maxLength={MAX_BERICHT_STUDIO}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void verstuur();
            }
          }}
          disabled={bezig}
          aria-describedby={`antwoord-${ticketId}-uitleg`}
          className={VELD}
        />
        <p id={`antwoord-${ticketId}-uitleg`} className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-muted">
          <span>
            {gesloten ? "Dit ticket is gesloten — antwoorden heropent het. " : ""}
            De klant ziet het antwoord in het portaal; de mail bevat de volledige tekst. Ctrl+Enter verstuurt.
          </span>
          <span className="font-mono">
            {tekst.length}/{MAX_BERICHT_STUDIO}
          </span>
        </p>
      </div>

      {bijlagen ? (
        <BestandenKiezer locale="nl" bestanden={bestanden} onChange={setBestanden} disabled={bezig} voortgang={voortgang} />
      ) : (
        <p className="text-xs text-muted">Bijlagen kunnen pas na migratie 0049.</p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="inline-flex min-h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sluiten}
            onChange={(e) => setSluiten(e.target.checked)}
            disabled={bezig}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Ticket sluiten na dit antwoord
        </label>
        <label className="inline-flex min-h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mailen}
            onChange={(e) => setMailen(e.target.checked)}
            disabled={bezig}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Klant mailen
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={bezig || !tekst.trim()}
          aria-busy={bezig}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
        >
          {bezig ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
          {bezig ? (voortgang != null ? "Opladen…" : "Versturen…") : sluiten ? "Antwoorden en sluiten" : "Antwoorden"}
        </button>

        <p role="status" aria-live="polite" className="min-w-0 text-sm">
          {/* Solide vlak met donkere tekst: leesbaar in licht en donker thema. */}
          {melding?.soort === "ok" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-1.5 font-medium text-stone-950">
              <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {melding.tekst}
            </span>
          )}
          {melding?.soort === "let-op" && (
            <span className="inline-flex items-start gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 font-medium text-stone-950">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {melding.tekst}
            </span>
          )}
        </p>
      </div>
      {melding?.soort === "fout" && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-400 px-3 py-2 text-sm font-medium text-stone-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{melding.tekst}</span>
        </p>
      )}
    </form>
  );
}
