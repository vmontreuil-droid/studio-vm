import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Gavel, Pause, Play, RefreshCw, Send, TriangleAlert, X } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ARRONDISSEMENTEN, LANDEN_PARTNER, type Arrondissement, type LandPartner } from "@/lib/invordering/arrondissement";
import { arrondissementNaam, deurwaarders, isDeurwaarder, laadDossier } from "@/lib/invordering/dossier";
import { euro, tijd, datum } from "@/lib/invordering/teksten";
import { InvorderingStatus } from "@/components/admin/invordering-status";
import {
  bewaarNotitie,
  herbereken,
  kiesDeurwaarder,
  verstuurNaarDeurwaarder,
  zetInvorderingStatus,
} from "@/app/actions/invordering";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invorderingsdossier" };

type Rij = {
  id: string;
  created_at: string;
  invoice_id: string;
  status: string;
  arrondissement: string | null;
  deurwaarder: unknown;
  verstuurd_op: string | null;
  notitie: string | null;
};

const MELDING: Record<string, { tekst: string; goed?: boolean }> = {
  "verstuurd-ok": { tekst: "Verstuurd naar de deurwaarder, met een kopie naar info@studio-vm.be.", goed: true },
  klaargezet: { tekst: "Dossier klaargezet.", goed: true },
  bestaat: { tekst: "Voor die factuur bestond al een dossier." },
  deurwaarder: { tekst: "Deurwaarder bewaard.", goed: true },
  herberekend: { tekst: "Bedragen bijgewerkt tot vandaag.", goed: true },
  notitie: { tekst: "Notitie bewaard.", goed: true },
  gepauzeerd: { tekst: "Dossier gepauzeerd.", goed: true },
  klaar: { tekst: "Dossier hervat.", goed: true },
  afgesloten: { tekst: "Dossier afgesloten.", goed: true },
  bevestig: { tekst: "Vink eerst aan dat je het dossier nagekeken hebt." },
  "geen-deurwaarder": { tekst: "Kies eerst een deurwaarder." },
  onvolledig: { tekst: "Naam en een geldig e-mailadres zijn verplicht." },
  geblokkeerd: { tekst: "Niet verstuurd: er is een blokkerende waarschuwing (betaald, creditnota of onbekend bedrag)." },
  "al-verstuurd": { tekst: "Dit dossier is al verstuurd." },
  "niet-klaar": { tekst: "Enkel een dossier dat klaarstaat kan verstuurd worden (hervat het eerst)." },
  "mail-fout": { tekst: "De mail kon niet verstuurd worden. Er is niets vertrokken; probeer opnieuw." },
  fout: { tekst: "Er ging iets mis. Probeer opnieuw." },
};

const knop = "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-card-hover";
const veld = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

export default async function InvorderingDossier({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ melding?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const [{ id }, { melding }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await getSupabaseAdmin()
    .from("invorderingen")
    .select("id, created_at, invoice_id, status, arrondissement, deurwaarder, verstuurd_op, notitie")
    .eq("id", id)
    .maybeSingle();
  const r = data as Rij | null;
  if (!r) notFound();
  const [d, dws] = await Promise.all([laadDossier(r.invoice_id), deurwaarders()]);
  if (!d) notFound();

  const dw = isDeurwaarder(r.deurwaarder) ? r.deurwaarder : null;
  const blokkeert = d.waarschuwingen.some((w) => w.blokkeert);
  const open = r.status === "klaar" || r.status === "gepauzeerd";
  const m = melding ? MELDING[melding] : null;
  const pdf = (soort: string) => `/admin/invordering/${r.id}/pdf?soort=${soort}`;
  const v = d.vordering;

  return (
    <>
      <Link href="/admin/invordering" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Invordering
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dossier {d.factuur.nummer}</h1>
        <InvorderingStatus status={r.status} />
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {d.klant.naam} · klaargezet {datum(r.created_at, "nl")}
        {r.verstuurd_op ? ` · verstuurd ${tijd(r.verstuurd_op, "nl")}` : ""}
      </p>

      {m && (
        <p
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            m.goed ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-amber-400 bg-amber-200 text-amber-950"
          }`}
        >
          {m.tekst}
        </p>
      )}

      {d.waarschuwingen.length > 0 && (
        <ul className="mt-4 space-y-2">
          {d.waarschuwingen.map((w) => (
            <li
              key={w.code + w.tekst}
              className={`flex items-start gap-2 rounded-xl border px-4 py-2 text-sm ${
                w.blokkeert ? "border-red-300 bg-red-100 text-red-900" : "border-amber-400 bg-amber-200 text-amber-950"
              }`}
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {w.tekst}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Vordering */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-medium">Vordering</h2>
              <span className="text-xs text-muted">berekend tot {datum(v.berekendOp, "nl")}</span>
            </div>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Hoofdsom (vervallen {datum(d.factuur.vervaldag, "nl")})</dt>
                <dd className="font-mono tabular-nums">{euro(v.hoofdsomCent, "nl")}</dd>
              </div>
              {d.zakelijk && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">
                      Verwijlinterest ({v.dagen} dagen{v.pct != null ? `, ${String(v.pct).replace(".", ",")} %` : ""})
                    </dt>
                    <dd className="font-mono tabular-nums">{euro(v.interestCent, "nl")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Forfaitaire vergoeding</dt>
                    <dd className="font-mono tabular-nums">{euro(v.forfaitCent, "nl")}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
                <dt>Totaal</dt>
                <dd className="font-mono tabular-nums">{euro(v.totaalCent, "nl")}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">
              Bij versturen worden de bedragen automatisch tot die dag bijgewerkt.
            </p>
          </section>

          {/* Klant */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="font-medium">Klant</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-[auto_1fr]">
              <dt className="text-muted">Naam</dt>
              <dd>{d.klant.naam}</dd>
              <dt className="text-muted">Adres</dt>
              <dd className="whitespace-pre-line">{d.klant.adres ?? "—"}</dd>
              <dt className="text-muted">Btw</dt>
              <dd>{d.klant.btw ?? "— (particulier)"}</dd>
              <dt className="text-muted">E-mail</dt>
              <dd>{d.klant.email}</dd>
              <dt className="text-muted">{d.buitenland ? "Land" : "Arrondissement"}</dt>
              <dd>
                {d.buitenland
                  ? `${d.land}${d.gebied ? ` — vaste partner: ${arrondissementNaam(d.gebied)}` : " — geen vaste partner"}`
                  : arrondissementNaam(d.arrondissement) ?? "onbekend"}
              </dd>
            </dl>
          </section>

          {/* Tijdlijn */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="font-medium">Verloop</h2>
            <ol className="mt-3 space-y-2">
              {d.tijdlijn.map((g, i) => (
                <li key={`${g.op}-${i}`} className="flex flex-wrap gap-x-3">
                  <span className="w-40 shrink-0 tabular-nums text-muted">
                    {g.soort === "factuur" ? datum(g.op, "nl") : tijd(g.op, "nl")}
                  </span>
                  <span className="min-w-0 flex-1">
                    {g.soort === "offerte" && (
                      <>
                        Offerte {String(g.w.nummer)} aanvaard
                        {g.w.ip ? <span className="text-muted"> · IP {String(g.w.ip)}</span> : null}
                      </>
                    )}
                    {g.soort === "levering" && <>Opgeleverd: {String(g.w.bestand)}</>}
                    {g.soort === "factuur" && <>Factuur {String(g.w.nummer)} uitgereikt</>}
                    {g.soort === "factuurmail" && <>Factuur gemaild naar {String(g.w.aan)}</>}
                    {g.soort === "herinnering" && (
                      <>{Number(g.w.niveau) >= 3 ? "Laatste herinnering (ingebrekestelling)" : `Herinnering ${String(g.w.niveau)}`}</>
                    )}
                    {g.soort === "download" && <>Gedownload: {String(g.w.bestand)}</>}
                    {g.soort === "betaling" && (
                      <>
                        Betaling ontvangen
                        {g.w.via ? <span className="text-muted"> · {g.w.via === "mollie" ? "online (Mollie)" : g.w.via === "bank" ? "overschrijving" : "manueel op betaald gezet"}</span> : null}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* Notitie */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="font-medium">Notitie (enkel voor jou)</h2>
            <form action={bewaarNotitie} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <textarea name="notitie" rows={3} maxLength={2000} defaultValue={r.notitie ?? ""} className={veld} />
              <button type="submit" className={knop}>
                Notitie bewaren
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-4">
          {/* Documenten */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="font-medium">Wat de deurwaarder krijgt</h2>
            <ul className="mt-3 space-y-2">
              {[
                ["brief", "Begeleidende brief"],
                ["factuur", `Factuur ${d.factuur.nummer}`],
                ["bewijs", "Bewijsdossier"],
              ].map(([soort, label]) => (
                <li key={soort}>
                  <a href={pdf(soort)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-accent hover:underline">
                    <FileText className="h-4 w-4" />
                    {label} (pdf)
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Kopie van de mail gaat naar info@studio-vm.be.</p>
            {d.buitenland && (
              <div className="mt-4 border-t pt-3">
                <a href={pdf("betalingsbevel")} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-accent hover:underline">
                  <FileText className="h-4 w-4" />
                  Europees betalingsbevel voorbereiden (pdf)
                </a>
                <p className="mt-1 text-xs text-muted">
                  Voor jezelf, als de invordering in het buitenland niet lukt: de gegevens per vak van het officiële
                  formulier A, om over te nemen op e-justice.europa.eu.
                </p>
              </div>
            )}
          </section>

          {/* Deurwaarder */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="flex items-center gap-2 font-medium">
              <Gavel className="h-4 w-4 text-accent" /> Deurwaarder
            </h2>
            {dw ? (
              <p className="mt-2">
                <b>{dw.naam}</b>
                {dw.kantoor ? <span className="block text-muted">{dw.kantoor}</span> : null}
                {dw.adres ? <span className="block whitespace-pre-line text-muted">{dw.adres}</span> : null}
                <span className="block text-muted">{dw.email}</span>
                <span className="block text-xs text-muted">Brief in het {dw.taal === "fr" ? "Frans" : dw.taal === "de" ? "Duits" : "Nederlands"}</span>
              </p>
            ) : (
              <p className="mt-2 text-amber-700 dark:text-amber-400">Nog geen deurwaarder gekozen.</p>
            )}

            {open && (
              <>
                <form action={kiesDeurwaarder} className="mt-4 space-y-2">
                  <input type="hidden" name="id" value={r.id} />
                  <label className="block text-xs text-muted">Uit je lijst</label>
                  <select name="arrondissement" defaultValue={d.gebied ?? ""} className={veld}>
                    <option value="" disabled>
                      Kies een arrondissement of land
                    </option>
                    <optgroup label="België">
                      {(Object.keys(ARRONDISSEMENTEN) as Arrondissement[]).map((a) => (
                        <option key={a} value={a} disabled={!dws.has(a)}>
                          {ARRONDISSEMENTEN[a].naam}
                          {dws.has(a) ? ` — ${dws.get(a)!.naam}` : " (niet ingesteld)"}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Buitenland">
                      {(Object.keys(LANDEN_PARTNER) as LandPartner[]).map((l) => (
                        <option key={l} value={l} disabled={!dws.has(l)}>
                          {LANDEN_PARTNER[l].naam}
                          {dws.has(l) ? ` — ${dws.get(l)!.naam}` : " (niet ingesteld)"}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <button type="submit" className={knop}>
                    Deze deurwaarder nemen
                  </button>
                </form>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted">Andere deurwaarder invullen</summary>
                  <form action={kiesDeurwaarder} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input name="naam" placeholder="Naam" required className={veld} />
                    <input name="kantoor" placeholder="Kantoor" className={veld} />
                    <input name="email" type="email" placeholder="E-mail" required className={veld} />
                    <textarea name="adres" placeholder="Adres" rows={2} className={veld} />
                    <select name="taal" defaultValue="nl" className={veld}>
                      <option value="nl">Brief in het Nederlands</option>
                      <option value="fr">Brief in het Frans</option>
                      <option value="de">Brief in het Duits</option>
                    </select>
                    <button type="submit" className={knop}>
                      Bewaren
                    </button>
                  </form>
                </details>
                <p className="mt-3 text-xs text-muted">
                  Vaste deurwaarder per arrondissement instellen:{" "}
                  <Link href="/admin/deurwaarders" className="text-accent hover:underline">
                    Deurwaarders
                  </Link>
                </p>
              </>
            )}
          </section>

          {/* Acties */}
          <section className="rounded-xl border bg-background p-5 text-sm shadow-sm">
            <h2 className="font-medium">Acties</h2>
            {r.status === "klaar" && (
              <form action={verstuurNaarDeurwaarder} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="bevestig" value="ja" required className="mt-0.5" />
                  <span>Ik heb het dossier en de pdf&apos;s nagekeken; de factuur is niet betwist.</span>
                </label>
                <button
                  type="submit"
                  disabled={!dw || blokkeert}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  Versturen naar deurwaarder
                </button>
              </form>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {open && (
                <form action={herbereken}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className={knop}>
                    <RefreshCw className="h-4 w-4" /> Herberekenen
                  </button>
                </form>
              )}
              {r.status === "klaar" && (
                <form action={zetInvorderingStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="gepauzeerd" />
                  <button type="submit" className={knop}>
                    <Pause className="h-4 w-4" /> Pauzeren
                  </button>
                </form>
              )}
              {r.status === "gepauzeerd" && (
                <form action={zetInvorderingStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="klaar" />
                  <button type="submit" className={knop}>
                    <Play className="h-4 w-4" /> Hervatten
                  </button>
                </form>
              )}
              {r.status !== "afgesloten" && (
                <form action={zetInvorderingStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="afgesloten" />
                  <button type="submit" className={knop}>
                    <X className="h-4 w-4" /> Afsluiten
                  </button>
                </form>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Afsluiten = niet (meer) invorderen, bv. na een afspraak met de klant. Wordt de factuur betaald, dan sluit
              het dossier vanzelf.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
