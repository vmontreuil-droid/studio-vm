// /admin/social › Kanalen: waar de publisher naartoe post (via Buffer).
//
// Zonder BUFFER_API_KEY of migratie 0050 toont dit de eenmalige stappen voor
// de eigenaar; daarna de gevonden kanalen met per kanaal aan/uit, "enkel NL"
// en (Pinterest) het bord, plus de stand van de publisher en een voorbeeld
// van wat het volgende bericht op elk kanaal krijgt. Server-component:
// enkel formulieren, geen client-JS. Pillen: effen achtergrond, donkere tekst.

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Gauge,
  KeyRound,
  Link2,
  MailWarning,
  PlugZap,
  Radio,
  Send,
} from "lucide-react";
import { testKanalen, zetKanaalInstelling, type KanalenOverzicht, type SocialPost } from "@/app/actions/social";
import {
  KANAAL_REGELS,
  TE_LAAT_UUR,
  beeldUrlVoor,
  doelKanalen,
  leesPublicatie,
  planBericht,
  type KanaalPlan,
  type SocialKanaal,
} from "@/lib/social/publish";
import { BUFFER_SLEUTEL_PAGINA } from "@/lib/social/adapters/buffer";
import { LINK_BUDGET_PER_MAAND } from "@/lib/admin/social-generator";
import { KANAAL_LABEL, KANALEN, type Kanaal } from "@/lib/admin/social-templates";
import { KanaalTegel, Melding, wanneerKort } from "./onderdelen";

const TERUG = "/admin/social#kanalen";

function kort(iso: string | null | undefined): string {
  if (!iso) return "nog nooit";
  return new Date(iso).toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================================================
// Schakelaar per kanaal
// =====================================================================

function Schakelaar({ kanaal, veld, aan, label, uitleg }: { kanaal: string; veld: "aan" | "alleenNl"; aan: boolean; label: string; uitleg: string }) {
  return (
    <form action={zetKanaalInstelling} className="inline-flex">
      <input type="hidden" name="kanaal" value={kanaal} />
      <input type="hidden" name="veld" value={veld} />
      <input type="hidden" name="waarde" value={aan ? "nee" : "ja"} />
      <input type="hidden" name="terug" value={TERUG} />
      <button
        type="submit"
        role="switch"
        aria-checked={aan}
        title={uitleg}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] hover:bg-card-hover"
      >
        <span
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
            aan ? "border-amber-500 bg-amber-400" : "border-border bg-card-hover"
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full shadow-sm transition-transform ${aan ? "translate-x-[18px] bg-stone-950" : "translate-x-[3px] bg-stone-400"}`} />
        </span>
        <span className={aan ? "font-medium text-foreground" : "text-muted"}>{label}</span>
      </button>
    </form>
  );
}

function Chip({ toon, children }: { toon: "rood" | "amber" | "grijs" | "groen" | "blauw"; children: React.ReactNode }) {
  const cls =
    toon === "rood"
      ? "bg-rose-300 text-stone-950"
      : toon === "amber"
        ? "bg-amber-300 text-stone-950"
        : toon === "groen"
          ? "bg-emerald-300 text-stone-950"
          : toon === "blauw"
            ? "bg-sky-300 text-stone-950"
            : "bg-stone-300 text-stone-950";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function KanaalRegel({ k }: { k: SocialKanaal }) {
  const regel = KANAAL_REGELS[k.dienst];
  const naam = k.weergave || k.naam;
  return (
    <li className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-3 ${k.weg || !k.aan ? "opacity-70" : ""}`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <KanaalTegel kanaal={k.dienst} groot />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{KANAAL_LABEL[k.dienst]}</span>
            <span className="min-w-0 truncate text-sm text-muted">{naam}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">{regel.uitleg}</p>
          {(k.weg || k.ontkoppeld || k.vergrendeld || k.gepauzeerd) && (
            <p className="mt-1.5 flex flex-wrap gap-1">
              {k.weg && <Chip toon="grijs">Niet meer in Buffer</Chip>}
              {k.ontkoppeld && <Chip toon="rood">Verbinding verbroken: opnieuw verbinden in Buffer</Chip>}
              {k.vergrendeld && <Chip toon="rood">Vergrendeld: plan te klein</Chip>}
              {k.gepauzeerd && <Chip toon="amber">Wachtrij op pauze in Buffer</Chip>}
            </p>
          )}
          {k.link && (
            <a href={k.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
              Profiel openen
            </a>
          )}
        </div>
      </div>
      {!k.weg && (
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 pl-10 sm:pl-0">
          <Schakelaar kanaal={k.id} veld="aan" aan={k.aan} label={k.aan ? "Aan" : "Uit"} uitleg={k.aan ? "Uitzetten: dit kanaal krijgt niets meer" : "Aanzetten"} />
          {k.dienst !== "google" && (
            <Schakelaar
              kanaal={k.id}
              veld="alleenNl"
              aan={k.alleenNl}
              label="Enkel NL"
              uitleg={k.alleenNl ? "Ook Franstalige berichten toelaten" : "Enkel Nederlandstalige berichten (FR wordt overgeslagen)"}
            />
          )}
          {k.dienst === "pinterest" && k.borden.length > 0 && (
            <form action={zetKanaalInstelling} className="flex items-center gap-1.5">
              <input type="hidden" name="kanaal" value={k.id} />
              <input type="hidden" name="veld" value="bord" />
              <input type="hidden" name="terug" value={TERUG} />
              <label className="sr-only" htmlFor={`bord-${k.id}`}>
                Pinterest-bord
              </label>
              <select
                id={`bord-${k.id}`}
                name="waarde"
                defaultValue={k.bord ?? k.borden[0]?.id}
                className="h-9 max-w-[11rem] rounded-lg border border-border bg-background px-2 text-[13px] text-foreground outline-none focus:border-accent"
              >
                {k.borden.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.naam}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                title="Bord bewaren"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-[13px] font-medium hover:bg-card-hover"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Bord
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

// =====================================================================
// Eenmalige stappen
// =====================================================================

function Stap({ nr, klaar, titel, children }: { nr: number; klaar: boolean; titel: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
          klaar ? "bg-emerald-300 text-stone-950" : "border border-border bg-card-hover text-muted"
        }`}
        aria-label={klaar ? "klaar" : "nog te doen"}
      >
        {klaar ? <Check className="h-4 w-4" strokeWidth={3} /> : nr}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${klaar ? "text-muted line-through decoration-1" : ""}`}>{titel}</p>
        <div className="mt-1 space-y-1.5 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-card-hover px-1 py-0.5 font-mono text-[12px] text-foreground">{children}</code>;
}

function Stappen({ o }: { o: KanalenOverzicht }) {
  const kanalenGevonden = o.kanalen.kanalen.some((k) => !k.weg);
  const getest = o.publisher.sleutel?.ok === true;
  return (
    <ol className="divide-y divide-border">
      <Stap nr={1} klaar={o.migratie} titel="Migratie 0050 draaien">
        <p>
          Supabase → SQL Editor → plak <Code>supabase/migrations/0050_social_automatisch.sql</Code> → Run. Maakt ook de publieke opslag voor de
          beelden aan.
        </p>
      </Stap>
      <Stap nr={2} klaar={o.sleutel} titel="Buffer-account maken">
        <p>
          Op{" "}
          <a href="https://buffer.com/signup" target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
            buffer.com
          </a>
          , met het e-mailadres van de zaak. Het gratis plan volstaat om te beginnen.
        </p>
      </Stap>
      <Stap nr={3} klaar={kanalenGevonden} titel="Kanalen verbinden in Buffer">
        <p>
          <strong className="text-foreground">Gratis plan (3 kanalen):</strong> de Facebookpagina, Instagram (professioneel account, gekoppeld aan de
          pagina) en het Google Bedrijfsprofiel.
        </p>
        <p>
          <strong className="text-foreground">Betaald plan (per kanaal per maand):</strong> YouTube, TikTok, Pinterest, X, Threads en Bluesky. Pas
          toevoegen na een bewuste keuze; ze verschijnen hier dan vanzelf.
        </p>
      </Stap>
      <Stap nr={4} klaar={o.sleutel} titel="API-sleutel maken">
        <p>
          In Buffer: Instellingen → API →{" "}
          <a href={BUFFER_SLEUTEL_PAGINA} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
            nieuwe sleutel
          </a>
          . Kopieer hem meteen; Buffer toont hem maar één keer.
        </p>
      </Stap>
      <Stap nr={5} klaar={o.sleutel} titel="In Vercel plakken en opnieuw deployen">
        <p>
          Vercel → studio-vm → Settings → Environment Variables → <Code>BUFFER_API_KEY</Code> (Production). Optioneel{" "}
          <Code>BUFFER_ORGANIZATION_ID</Code> als het account meer dan één organisatie heeft. Daarna Deployments → Redeploy.
        </p>
      </Stap>
      <Stap nr={6} klaar={getest} titel="Verbinding testen">
        <p>Met de knop Verbinding testen bij Publisher. De kanalen verschijnen dan hier, elk met een schakelaar. Vanaf dan gaat alles vanzelf.</p>
      </Stap>
    </ol>
  );
}

// =====================================================================
// Voorbeeld: wat het volgende bericht per kanaal krijgt
// =====================================================================

/** Alle doelkanalen als "verbonden", om te tonen hoe een bericht uitgaat. */
function virtueleKanalen(diensten: Kanaal[]): SocialKanaal[] {
  return diensten.map((dienst) => ({
    id: `voorbeeld-${dienst}`,
    dienst,
    service: dienst,
    naam: KANAAL_LABEL[dienst] ?? dienst,
    weergave: null,
    soort: null,
    link: null,
    avatar: null,
    ontkoppeld: false,
    vergrendeld: false,
    gepauzeerd: false,
    borden: [{ id: "bord", naam: "bord" }],
    aan: true,
    alleenNl: false,
    bord: "bord",
    gezien: "",
    weg: false,
  }));
}

function Voorbeeld({ post, o }: { post: SocialPost; o: KanalenOverzicht }) {
  const echt = o.kanalen.kanalen.length > 0;
  const kanalen = echt ? o.kanalen.kanalen : virtueleKanalen(doelKanalen(post));
  const plannen: KanaalPlan[] = planBericht(post, kanalen, {
    linkVrij: o.linkGebruikt < LINK_BUDGET_PER_MAAND,
    beeldUrl: beeldUrlVoor(post),
  });
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Volgende publicatie · {wanneerKort(post.scheduled_for)}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{post.title}</p>
      {!echt && <p className="mt-1 text-xs text-muted">Zo gaat het uit zodra de kanalen verbonden zijn:</p>}
      <ul className="mt-2 space-y-1.5">
        {plannen.map((x) => (
          <li key={x.sleutel} className="flex items-start gap-2 text-[13px]">
            <KanaalTegel kanaal={x.dienst} />
            <span className="min-w-0 flex-1">
              <span className="font-medium">{KANAAL_LABEL[x.dienst]}</span>{" "}
              {x.actie === "publiceer" ? (
                <span className="text-muted">· {x.omschrijving}</span>
              ) : (
                <span className="text-muted">· overgeslagen: {x.reden}</span>
              )}
            </span>
            {x.actie === "publiceer" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 [.theme-dark_&]:text-emerald-400" strokeWidth={2.25} aria-label="gaat uit" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={2} aria-label="overgeslagen" />
            )}
          </li>
        ))}
        {!plannen.length && <li className="text-[13px] text-muted">Geen kanaal gekozen voor dit bericht.</li>}
      </ul>
    </div>
  );
}

// =====================================================================
// Laatste publicaties
// =====================================================================

function Laatste({ posts }: { posts: SocialPost[] }) {
  const met = posts
    .map((p) => ({ p, pub: leesPublicatie(p.publicatie) }))
    .filter((x) => Object.keys(x.pub.kanalen).length > 0)
    .sort((a, b) => Date.parse(b.p.posted_at ?? b.p.scheduled_for ?? "") - Date.parse(a.p.posted_at ?? a.p.scheduled_for ?? ""))
    .slice(0, 5);
  if (!met.length) return null;
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Laatste publicaties</p>
      <ul className="mt-2 divide-y divide-border">
        {met.map(({ p, pub }) => (
          <li key={p.id} className="py-2">
            <p className="truncate text-[13px] font-medium">{p.title}</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {Object.entries(pub.kanalen).map(([k, e]) =>
                e.url ? (
                  <a key={k} href={e.url} target="_blank" rel="noreferrer" title={`${KANAAL_LABEL[e.kanaal]}: bekijken`}>
                    <Chip toon="groen">
                      {KANAAL_LABEL[e.kanaal]} <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                    </Chip>
                  </a>
                ) : (
                  <span key={k} title={e.fout ?? e.reden ?? undefined}>
                    <Chip toon={e.status === "mislukt" ? "rood" : e.status === "gepubliceerd" ? "groen" : e.status === "verzonden" ? "blauw" : e.status === "overgeslagen" ? "grijs" : "amber"}>
                      {KANAAL_LABEL[e.kanaal]}
                      {e.status === "mislukt" ? " · mislukt" : e.status === "verzonden" ? " · verzonden" : e.status === "overgeslagen" ? " · –" : e.status === "gepubliceerd" ? "" : " · bezig"}
                    </Chip>
                  </span>
                ),
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =====================================================================
// De sectie
// =====================================================================

function Venster({ label, v, quota }: { label: string; v?: { over: number; quota: number | null }; quota: number }) {
  if (!v) return null;
  const q = v.quota ?? quota;
  const laag = v.over <= Math.max(3, q * 0.1);
  return (
    <span className={laag ? "font-semibold text-rose-700 [.theme-dark_&]:text-rose-300" : ""}>
      {label} {v.over}/{q}
    </span>
  );
}

export function KanalenSectie({
  o,
  volgende,
  posts,
  melding,
}: {
  o: KanalenOverzicht;
  volgende: SocialPost | null;
  posts: SocialPost[];
  melding?: string;
}) {
  const actief = o.kanalen.kanalen.filter((k) => k.aan && !k.weg && !k.ontkoppeld && !k.vergrendeld);
  const zichtbaar = o.kanalen.kanalen;
  const sleutelGeweigerd = o.sleutel && o.publisher.sleutel?.ok === false;
  const klaar = o.sleutel && o.migratie && zichtbaar.length > 0 && !sleutelGeweigerd;
  const pil = !o.sleutel
    ? { toon: "grijs" as const, tekst: "Uit · geen API-sleutel" }
    : !o.migratie
      ? { toon: "amber" as const, tekst: "Uit · migratie 0050 ontbreekt" }
      : sleutelGeweigerd
        ? { toon: "rood" as const, tekst: "Sleutel geweigerd" }
        : !zichtbaar.length
          ? { toon: "amber" as const, tekst: "Nog geen kanalen" }
          : { toon: "groen" as const, tekst: `Actief · ${actief.length} ${actief.length === 1 ? "kanaal" : "kanalen"}` };
  const ontbrekend = KANALEN.filter((d) => !zichtbaar.some((k) => k.dienst === d && !k.weg));
  const v = o.publisher.verzoeken;
  const wachtendeFouten = o.publisher.uitgesteld?.length ?? 0;

  return (
    <section id="kanalen" className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
            <Radio className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Kanalen</h2>
            <p className="text-xs text-muted">Publiceren via Buffer, elk half uur. Geen link in de tekst, nooit dubbel.</p>
          </div>
        </div>
        <Chip toon={pil.toon}>{pil.tekst}</Chip>
      </div>

      {melding && (
        <div className="mt-3">
          <Melding code={melding} />
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Links: kanalen of de eenmalige stappen */}
        <div className="rounded-2xl bg-card p-5 shadow-sm lg:col-span-3">
          {klaar ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Verbonden in Buffer{o.kanalen.organisatie ? ` · ${o.kanalen.organisatie.naam}` : ""}
                </p>
                <span className="font-mono text-[10px] text-muted">bijgewerkt {kort(o.kanalen.bijgewerkt)}</span>
              </div>
              <ul className="mt-1 divide-y divide-border">
                {zichtbaar.map((k) => (
                  <KanaalRegel key={k.id} k={k} />
                ))}
              </ul>
              {ontbrekend.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <p className="text-xs text-muted">Nog niet verbonden (betaald Buffer-plan, per kanaal):</p>
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    {ontbrekend.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-[12px] text-muted">
                        <KanaalTegel kanaal={d} />
                        {KANAAL_LABEL[d]}
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {o.kanalen.ongebruikt.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  Ook in Buffer, maar niet gebruikt: {o.kanalen.ongebruikt.map((x) => x.naam).join(", ")}.
                </p>
              )}
              <details className="mt-3 rounded-xl border border-border">
                <summary className="cursor-pointer list-none px-3 py-2 text-[13px] font-medium text-muted hover:text-foreground">
                  Eenmalige stappen (afgewerkt)
                </summary>
                <div className="border-t border-border px-3">
                  <Stappen o={o} />
                </div>
              </details>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                <KeyRound className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
                Eenmalig instellen · ± 15 minuten
              </p>
              <p className="mt-2 text-sm text-muted">
                Daarna gaan goedgekeurde berichten vanzelf uit op hun tijdstip, op elk kanaal dat u in Buffer verbindt. Tot dan wordt er niets
                verstuurd.
              </p>
              <div className="mt-2">
                <Stappen o={o} />
              </div>
            </>
          )}
        </div>

        {/* Rechts: stand van de publisher, voorbeeld, laatste publicaties */}
        <div className="space-y-3 lg:col-span-2">
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Send className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
              Publisher
            </p>
            {sleutelGeweigerd && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400 bg-rose-200 px-3 py-2 text-[13px] text-rose-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
                <span>
                  Buffer weigerde de sleutel ({o.publisher.sleutel?.fout ?? "onbekend"}). Maak een nieuwe, vervang <strong>BUFFER_API_KEY</strong> in
                  Vercel en deploy opnieuw.
                </span>
              </div>
            )}
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">API-sleutel</dt>
                <dd className="text-right font-medium">
                  {!o.sleutel ? "ontbreekt" : o.publisher.sleutel ? `${o.publisher.sleutel.ok ? "in orde" : "geweigerd"} · ${kort(o.publisher.sleutel.op)}` : "nog niet getest"}
                </dd>
              </div>
              {o.publisher.sleutel?.waarschuwing && <p className="text-xs text-amber-700 [.theme-dark_&]:text-amber-300">{o.publisher.sleutel.waarschuwing}</p>}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Laatste run</dt>
                <dd className="text-right">{o.publisher.laatsteRun ? `${kort(o.publisher.laatsteRun.op)} · ${o.publisher.laatsteRun.tekst}` : "nog nooit"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="flex shrink-0 items-center gap-1 text-muted" title="Facebook beperkt links tot ± 2 per maand (berichten én reacties)">
                  <Link2 className="h-3 w-3" strokeWidth={2.5} />
                  Linkberichten
                </dt>
                <dd className="text-right">
                  {o.linkGebruikt}/{LINK_BUDGET_PER_MAAND} op Facebook deze maand
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Beelden</dt>
                <dd className="text-right">
                  {o.bucket ? "vaste kopie in opslag" : o.bucket === false ? "via de site (opslag na migratie 0050)" : "onbekend"}
                </dd>
              </div>
              {v && (v.kwartier || v.dag || v.maand) && (
                <div className="flex justify-between gap-3">
                  <dt className="flex items-center gap-1 text-muted">
                    <Gauge className="h-3 w-3" strokeWidth={2.5} />
                    Verzoeken over
                  </dt>
                  <dd className="flex flex-wrap justify-end gap-x-2 text-right font-mono text-[12px]">
                    <Venster label="15 min" v={v.kwartier} quota={100} />
                    <Venster label="24 u" v={v.dag} quota={250} />
                    <Venster label="30 d" v={v.maand} quota={3000} />
                  </dd>
                </div>
              )}
              {wachtendeFouten > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-muted">
                  <MailWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                  {wachtendeFouten} {wachtendeFouten === 1 ? "fout wacht" : "fouten wachten"} op de volgende meldingsmail (hoogstens één per dag).
                </p>
              )}
            </dl>
            <form action={testKanalen} className="mt-4">
              <input type="hidden" name="terug" value={TERUG} />
              <button
                type="submit"
                disabled={!o.sleutel}
                title={o.sleutel ? "Sleutel nakijken en kanalen ophalen" : "Eerst BUFFER_API_KEY in Vercel zetten en opnieuw deployen"}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-stone-950 shadow-sm hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none"
              >
                <PlugZap className="h-4 w-4" strokeWidth={2.25} />
                Verbinding testen
              </button>
              <p className="mt-2 text-xs text-muted">
                Leest enkel: haalt de kanalen op, verstuurt niets. Wekelijks gebeurt dit vanzelf; bij een probleem krijgt u een mail.
              </p>
            </form>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">
              Een bericht dat meer dan {TE_LAAT_UUR} uur te laat zou uitgaan (bv. omdat de publisher uit stond), wordt overgeslagen. Opnieuw
              goedkeuren stuurt het alsnog.
            </p>
          </div>

          {volgende && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <Voorbeeld post={volgende} o={o} />
            </div>
          )}

          <Laatste posts={posts} />
        </div>
      </div>
    </section>
  );
}
