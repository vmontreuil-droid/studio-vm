// Herkomst-panelen van /admin/webactiviteit: bezoekers per kanaal (UTM-bron of
// samengevoegde verwijzer) en de tabel met gelabelde links (UTM). Server-veilig,
// zonder databank: de pagina geeft de rijen mee.

import { BarList, ChartCard } from "@/components/charts";
import { profielLinks, UTM_BRON_NAAM } from "@/lib/utm";
import {
  bezoekersPerBron,
  bezoekersPerKanaal,
  campagnes,
  gelabeldeBezoekers,
  socialeBezoekers,
  SOCIALE_KANALEN,
  type PvHerkomst,
} from "./bronnen";

const MAX_RIJEN = 12;

const bezoekerWoord = (n: number) => (n === 1 ? "bezoeker" : "bezoekers");
const opsomming = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} en ${l[l.length - 1]}` : (l[0] ?? ""));

export function HerkomstKaart({ rijen }: { rijen: PvHerkomst[] }) {
  const items = bezoekersPerKanaal(rijen, 8);
  // Zelfde maatstaf als de balken hieronder (UTM-bron, anders verwijzer).
  const sociaal = socialeBezoekers(rijen);
  return (
    <ChartCard
      title="Herkomst — unieke bezoekers"
      action={
        <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-muted" title="Unieke bezoekers via sociale media (gelabelde link of verwijzer)">
          sociale media: <span className="text-foreground">{sociaal}</span>
        </span>
      }
    >
      {items.length ? <BarList items={items} color="#a855f7" /> : <p className="text-sm text-muted">Nog geen bezoek.</p>}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Gelabelde link (UTM) eerst, anders de verwijzer. m./l./lm.facebook.com en de Facebook-app tellen samen als Facebook,
        t.co als X, enzovoort. Sociale media = {opsomming([...SOCIALE_KANALEN])}, via een gelabelde link of als verwijzer.
      </p>
    </ChartCard>
  );
}

export function CampagnesKaart({
  rijen,
  metInhoud,
  periode,
}: {
  rijen: PvHerkomst[];
  /** false zolang migratie 0050 (page_views.utm_content) niet gedraaid is. */
  metInhoud: boolean;
  periode: number;
}) {
  const lijst = campagnes(rijen, metInhoud);
  // Unieke dagcodes per bron (niet de som van de rijen: één bezoeker via
  // twee campagnes van dezelfde bron telt één keer).
  const bronnen = bezoekersPerBron(rijen, 8);
  const gelabeld = gelabeldeBezoekers(rijen);
  const zichtbaar = lijst.slice(0, MAX_RIJEN);

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Gelabelde links (UTM) — {periode} dagen</p>
        <p className="font-mono text-[10px] text-muted">
          via een gelabelde link: <span className="text-foreground">{gelabeld}</span> {bezoekerWoord(gelabeld)}
        </p>
      </div>

      {lijst.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Nog geen bezoek via een gelabelde link in deze periode. Berichten, profielen en deelknoppen voegen utm_source en utm_medium
          toe; de links voor uw profielen staan hieronder.
        </p>
      ) : (
        <div className={`mt-5 grid gap-8 ${bronnen.length > 1 ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]" : ""}`}>
          {/* Eén bron = één balk: dan zegt de tabel het al. */}
          {bronnen.length > 1 && (
            <div>
              <p className="mb-3 text-xs text-muted">Unieke bezoekers per bron</p>
              <BarList items={bronnen} color="var(--accent)" />
            </div>
          )}
          <div className="min-w-0">
            {/* Smal scherm: per combinatie een blokje, de cijfers meteen zichtbaar. */}
            <ul className="-mt-3 divide-y divide-border sm:hidden">
              {zichtbaar.map((r) => (
                <li key={r.sleutel} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate">
                      <span className="font-medium">{r.bron}</span>
                      <span className="font-mono text-xs text-muted"> · {r.medium ?? "—"}</span>
                    </p>
                    <p className="shrink-0 font-mono text-xs text-muted">
                      <span className="text-base font-semibold tabular-nums text-foreground">{r.bezoekers}</span> {bezoekerWoord(r.bezoekers)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-[11px] text-muted">
                    <p className="min-w-0 break-words">
                      {r.campagne ?? "—"}
                      {metInhoud && r.inhoud ? ` · ${r.inhoud.length > 10 ? `${r.inhoud.slice(0, 8)}…` : r.inhoud}` : ""}
                    </p>
                    <p className="shrink-0 tabular-nums">
                      {r.weergaven} weerg. ·{" "}
                      {r.offerte > 0 ? <span className="font-semibold text-accent">{r.offerte} → offerte</span> : "0 → offerte"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b font-mono text-[10px] uppercase tracking-widest text-muted">
                    <th className="py-2 pr-3 text-left font-normal">Bron</th>
                    <th className="py-2 pr-3 text-left font-normal">Medium</th>
                    <th className="py-2 pr-3 text-left font-normal">Campagne</th>
                    {metInhoud && <th className="py-2 pr-3 text-left font-normal">Bericht</th>}
                    <th className="py-2 pl-3 text-right font-normal">Bezoekers</th>
                    <th className="py-2 pl-3 text-right font-normal">Weergaven</th>
                    <th className="py-2 pl-3 text-right font-normal" title="Bezoekers die dezelfde dag ook het offerteformulier openden">
                      → Offerte
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {zichtbaar.map((r) => (
                    <tr key={r.sleutel}>
                      <td className="py-2.5 pr-3 font-medium">{r.bron}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-muted">{r.medium ?? "—"}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-muted">{r.campagne ?? "—"}</td>
                      {metInhoud && (
                        <td className="py-2.5 pr-3 font-mono text-xs text-muted" title={r.inhoud ?? undefined}>
                          {r.inhoud ? (r.inhoud.length > 10 ? `${r.inhoud.slice(0, 8)}…` : r.inhoud) : "—"}
                        </td>
                      )}
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums">{r.bezoekers}</td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-muted">{r.weergaven}</td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                        {r.offerte > 0 ? <span className="font-semibold text-accent">{r.offerte}</span> : <span className="text-muted">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lijst.length > MAX_RIJEN && (
              <p className="mt-2 font-mono text-[10px] text-muted">+ {lijst.length - MAX_RIJEN} kleinere combinaties</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t pt-4 text-xs text-muted">
        {!metInhoud && (
          <p>
            De kolom <span className="font-mono">Bericht</span> (utm_content, welk bericht de klik bracht) verschijnt zodra migratie
            0050 gedraaid is. Tot dan telt alles per bron, medium en campagne.
          </p>
        )}
        <details className="group">
          <summary className="cursor-pointer select-none font-medium text-foreground hover:text-accent">
            Gelabelde links om één keer in uw profielen te plakken
          </summary>
          <ul className="mt-3 divide-y divide-border">
            {profielLinks().map((l) => (
              <li key={l.url} className="grid gap-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
                <span>
                  <span className="font-medium text-foreground">{UTM_BRON_NAAM[l.bron]}</span> · {l.waar}
                </span>
                <span className="break-all font-mono text-[11px] text-foreground">{l.url}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
