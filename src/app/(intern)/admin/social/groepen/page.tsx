import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, Plus, Trash2, Users } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { huidigeWeek, parseWeek, verschuifWeek } from "@/lib/admin/social-generator";
import {
  GROEP_RUST_DAGEN,
  GROEP_TALEN,
  dagenTotVrij,
  groepspostenVanWeek,
  leesGroepen,
  type GroepTaal,
  type Groepspost,
} from "@/lib/social/groepen";
import { markeerGroepGepost, verwijderGroep, voegGroepToe } from "@/app/actions/social";
import { CopyButton } from "../copy-button";
import { VoorbeeldBeeld } from "../voorbeeld-beeld";
import { Melding, Pil } from "../onderdelen";

export const dynamic = "force-dynamic";

const TAAL_NAAM: Record<GroepTaal, string> = { nl: "Nederlandstalige groepen", fr: "Franstalige groepen" };
const SOORT: Record<string, string> = { tip: "Tip", realisatie: "Realisatie", vraag: "Vraag", carrousel: "Carrousel" };

// Supabase-opslag geeft met ?download= een bestand terug in plaats van een
// pagina; beelden van de eigen site downloadt het download-attribuut.
function downloadUrl(url: string, naam: string): string {
  return url.includes("/storage/v1/object/public/") ? `${url}${url.includes("?") ? "&" : "?"}download=${naam}` : url;
}

function datum(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", weekday: "short", day: "numeric", month: "short" });
}

function vandaag(iso: string | null): boolean {
  if (!iso) return false;
  const f = (d: Date) => d.toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" });
  return f(new Date(iso)) === f(new Date());
}

export default async function Groepen({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; nl?: string; fr?: string; melding?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const deze = huidigeWeek();
  const week = sp.week && parseWeek(sp.week) ? sp.week : deze;
  const [posten, groepen] = await Promise.all([groepspostenVanWeek(week), leesGroepen()]);
  const gekozen: Record<GroepTaal, Groepspost | undefined> = {
    nl: posten.nl.find((p) => p.postId === sp.nl) ?? posten.nl[0],
    fr: posten.fr.find((p) => p.postId === sp.fr) ?? posten.fr[0],
  };
  const hier = (extra: Partial<Record<"week" | "nl" | "fr", string>>) => {
    const q = new URLSearchParams({ week });
    if (gekozen.nl) q.set("nl", gekozen.nl.postId);
    if (gekozen.fr) q.set("fr", gekozen.fr.postId);
    for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
    return `/admin/social/groepen?${q.toString()}`;
  };
  const terug = hier({});
  const nr = Number(week.slice(-2));

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/social" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Social media
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groepspost van de week</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            Facebook laat geen automatisch posten in groepen toe. Kopieer de tekst, plak hem met het beeld in de groep en zet
            de link als eerste reactie. Hoogstens eens per {GROEP_RUST_DAGEN} dagen per groep, en reageer tussendoor op vragen
            van anderen: daar komen de klanten vandaan.
          </p>
        </div>
        <nav aria-label="Week kiezen" className="flex items-center gap-1.5">
          <Link
            href={`/admin/social/groepen?week=${verschuifWeek(week, -1)}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-card-hover"
            aria-label="Vorige week"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <span className="px-2 text-sm font-medium">Week {nr}</span>
          <Link
            href={`/admin/social/groepen?week=${verschuifWeek(week, 1)}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-card-hover"
            aria-label="Volgende week"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </nav>
      </div>

      <div className="mt-4">
        <Melding code={sp.melding} />
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {GROEP_TALEN.map((taal) => {
          const g = gekozen[taal];
          return (
            <section key={taal} className="rounded-2xl bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{TAAL_NAAM[taal]}</h2>
              {posten[taal].length === 0 ? (
                <p className="mt-3 text-sm text-muted">Deze week geen {taal === "nl" ? "Nederlandstalig" : "Franstalig"} bericht op de pagina.</p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {posten[taal].map((p) => (
                      <Link
                        key={p.postId}
                        href={hier({ [taal]: p.postId })}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          p.postId === g?.postId ? "border-accent bg-accent/10 font-medium text-accent" : "text-muted hover:bg-card-hover"
                        }`}
                      >
                        {datum(p.datum)} · {SOORT[p.soort] ?? p.soort}
                      </Link>
                    ))}
                  </div>
                  {g && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="font-medium">{g.titel}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {g.status === "gepubliceerd" ? "Al op de pagina verschenen" : "Verschijnt nog op de pagina"} ·{" "}
                          {g.beelden.length} {g.beelden.length === 1 ? "beeld" : "beelden"}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {g.beelden.map((b, i) => (
                          <a
                            key={b.url}
                            href={downloadUrl(b.url, b.naam)}
                            download={b.naam}
                            target="_blank"
                            rel="noopener"
                            className="group relative block"
                            title="Beeld downloaden"
                          >
                            <VoorbeeldBeeld bronnen={[b.url]} alt={`${g.titel} – beeld ${i + 1}`} ratio="4 / 5" className="w-full" />
                            <span className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-md bg-stone-950/80 text-white opacity-90 group-hover:opacity-100">
                              <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </span>
                          </a>
                        ))}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">1 · Tekst voor de groep</p>
                          <CopyButton text={g.tekst} label="Kopieer tekst" variant="solid" />
                        </div>
                        <p className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm leading-relaxed">
                          {g.tekst}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">2 · Eerste reactie (de link)</p>
                          <CopyButton text={g.reactie} label="Kopieer reactie" />
                        </div>
                        <p className="mt-2 break-all rounded-lg border border-border bg-background p-3 text-sm">{g.reactie}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>

      <section className="mt-5 rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-accent" strokeWidth={2.25} />
          Mijn groepen
        </h2>
        {groepen.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nog geen groepen. Zoek op Facebook op bv. grondwerken, machinisten, wegenbouw, GPS graafmachine, terrassement,
            travaux publics of conducteur d&apos;engins, en kies groepen met recente posts.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {groepen
              .slice()
              .sort((a, b) => dagenTotVrij(a) - dagenTotVrij(b) || a.naam.localeCompare(b.naam))
              .map((gr) => {
                const wacht = dagenTotVrij(gr);
                const net = vandaag(gr.laatst);
                return (
                  <li key={gr.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium">
                        {gr.url ? (
                          <a href={gr.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
                            {gr.naam}
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                          </a>
                        ) : (
                          gr.naam
                        )}
                        <Pil>{gr.taal.toUpperCase()}</Pil>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {gr.laatst ? `Laatst gepost: ${datum(gr.laatst)}` : "Nog niet gepost"}
                      </p>
                    </div>
                    {wacht === 0 ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">Mag nu</span>
                    ) : (
                      <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                        Nog {wacht} {wacht === 1 ? "dag" : "dagen"}
                      </span>
                    )}
                    <form action={markeerGroepGepost}>
                      <input type="hidden" name="id" value={gr.id} />
                      <input type="hidden" name="terug" value={terug} />
                      {net && <input type="hidden" name="terugzetten" value="1" />}
                      <button
                        type="submit"
                        disabled={wacht > 0 && !net}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {net ? "Ongedaan maken" : "Gepost"}
                      </button>
                    </form>
                    <form action={verwijderGroep}>
                      <input type="hidden" name="id" value={gr.id} />
                      <input type="hidden" name="terug" value={terug} />
                      <button type="submit" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-card-hover hover:text-red-600" aria-label={`${gr.naam} verwijderen`}>
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </form>
                  </li>
                );
              })}
          </ul>
        )}

        <form action={voegGroepToe} className="mt-4 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_1.4fr_auto_auto]">
          <input type="hidden" name="terug" value={terug} />
          <input name="naam" required maxLength={120} placeholder="Naam van de groep" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <input name="url" maxLength={300} placeholder="https://www.facebook.com/groups/…" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <select name="taal" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="nl">
            <option value="nl">NL</option>
            <option value="fr">FR</option>
          </select>
          <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background hover:opacity-90">
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Toevoegen
          </button>
        </form>
      </section>
    </div>
  );
}
