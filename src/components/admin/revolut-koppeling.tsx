import { CheckCircle2, Landmark, RefreshCw, TriangleAlert, Unplug } from "lucide-react";
import { REDIRECT_URI, revolutStaat } from "@/lib/revolut";
import { revolutClientId, revolutOntkoppel, revolutOphalen, revolutToestemming } from "@/app/actions/revolut";

// Beheer → Bank: stand en opzet van de Revolut Business-koppeling.

const MELDING: Record<string, { tekst: string; goed?: boolean }> = {
  gekoppeld: { tekst: "Revolut is gekoppeld en de betalingen van de laatste 30 dagen zijn opgehaald.", goed: true },
  "client-id": { tekst: "Client ID bewaard.", goed: true },
  "client-id-fout": { tekst: "Dat lijkt geen geldige Client ID." },
  "niet-ingesteld": { tekst: "Eerst de privésleutel (Vercel) en de Client ID instellen." },
  "niet-gekoppeld": { tekst: "Revolut is nog niet gekoppeld." },
  geweigerd: { tekst: "Revolut gaf geen toestemming (geannuleerd?). Probeer opnieuw." },
  aanmelden: { tekst: "Meld je eerst aan op het beheer en geef dan opnieuw toestemming." },
  ontkoppeld: { tekst: "Revolut is ontkoppeld.", goed: true },
  fout: { tekst: "Er ging iets mis met Revolut. Zie de foutmelding hieronder." },
};

const knop = "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-card-hover";
const tijd = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("nl-BE", { timeZone: "Europe/Brussels", dateStyle: "medium", timeStyle: "short" }) : "—";

export async function RevolutKoppeling({ melding, nieuw, gekoppeld }: { melding?: string; nieuw?: string; gekoppeld?: string }) {
  const s = await revolutStaat();
  const m = melding === "opgehaald"
    ? { tekst: `Opgehaald: ${Number(nieuw) || 0} nieuwe betaling(en), ${Number(gekoppeld) || 0} factuur/facturen op betaald gezet.`, goed: true }
    : melding
      ? MELDING[melding]
      : null;

  return (
    <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <Landmark className="h-4 w-4 text-accent" /> Revolut Business
        </h2>
        {s.gekoppeld ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
            <CheckCircle2 className="h-3.5 w-3.5" /> Gekoppeld
          </span>
        ) : (
          <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
            Niet gekoppeld
          </span>
        )}
      </div>

      {m && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 ${
            m.goed ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-amber-400 bg-amber-200 text-amber-950"
          }`}
        >
          {m.tekst}
        </p>
      )}

      {s.gekoppeld ? (
        <>
          <p className="mt-2 text-muted">
            Elke ochtend vóór de herinneringen haalt de site de inkomende betalingen op en zet ze betaalde facturen
            vanzelf op betaald. Laatst opgehaald: <b className="text-foreground">{tijd(s.status?.laatsteOphaling ?? null)}</b>
            {s.status ? ` · ${s.status.nieuw} nieuw · ${s.status.gekoppeld} gekoppeld` : ""}.
          </p>
          {s.status?.fout && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-red-900">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {s.status.fout} <span className="text-xs">({tijd(s.status.foutOp)})</span>
              </span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={revolutOphalen}>
              <button type="submit" className={knop}>
                <RefreshCw className="h-4 w-4" /> Nu ophalen
              </button>
            </form>
            <form action={revolutToestemming}>
              <button type="submit" className={knop}>
                Opnieuw toestemming geven
              </button>
            </form>
            <form action={revolutOntkoppel}>
              <button type="submit" className={knop}>
                <Unplug className="h-4 w-4" /> Ontkoppelen
              </button>
            </form>
          </div>
        </>
      ) : (
        <ol className="mt-3 list-decimal space-y-3 pl-5">
          <li>
            <b>Sleutel</b>{" "}
            {s.sleutel ? (
              <span className="text-emerald-700 dark:text-emerald-400">— staat in Vercel ✓</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">— REVOLUT_PRIVATE_KEY ontbreekt nog in Vercel</span>
            )}
          </li>
          <li>
            In Revolut Business: <b>Instellingen → API&apos;s → Business API → certificaat toevoegen</b>. Zet als
            OAuth-doorverwijzing:
            <code className="mt-1 block w-full overflow-x-auto rounded bg-card px-2 py-1 font-mono text-xs">{REDIRECT_URI}</code>
            {s.publiekCert ? (
              <>
                <span className="mt-2 block">en plak dit publieke certificaat (alles, ook de BEGIN- en END-regel):</span>
                <textarea
                  readOnly
                  rows={6}
                  value={s.publiekCert}
                  className="mt-1 block w-full rounded-lg border bg-card px-2 py-1 font-mono text-[11px]"
                />
              </>
            ) : (
              <span className="mt-2 block text-amber-700 dark:text-amber-400">Het publieke certificaat is nog niet aangemaakt.</span>
            )}
          </li>
          <li>
            Plak de <b>Client ID</b> die Revolut toont:
            <form action={revolutClientId} className="mt-2 flex flex-wrap gap-2">
              <input
                name="client_id"
                defaultValue={s.clientId ?? ""}
                placeholder="Client ID"
                className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-xs"
              />
              <button type="submit" className={knop}>
                Bewaren
              </button>
            </form>
          </li>
          <li>
            <form action={revolutToestemming}>
              <button
                type="submit"
                disabled={!s.sleutel || !s.clientId}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Toestemming geven bij Revolut
              </button>
            </form>
            <p className="mt-1 text-xs text-muted">Enkel lezen: de site kan geen geld verplaatsen.</p>
          </li>
        </ol>
      )}
    </section>
  );
}
