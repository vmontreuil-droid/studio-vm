"use client";

// Werfkaart (admin, /admin/kaart): alle projecten op één grote kaart.
//
// - Links het filterpaneel (inklapbaar; op gsm/tablet een schuiflade), in het
//   midden de kaart, rechts de resultaten (onder de kaart als het smaller is).
// - De filters staan in het adres (?status=…&land=…): deelbaar, als bladwijzer
//   te bewaren en de terugknop werkt. Onzin in het adres valt stil weg.
// - Lijst ↔ kaart: over een rij → die pin licht op; over een pin of een open
//   popup → de rij licht op. Klik op een rij → de kaart vliegt erheen en opent
//   het kaartje.
// - Filteren gebeurt hier in de browser (vlot tot een paar duizend projecten);
//   de logica en de tellingen staan in @/lib/werfkaart.
// - Stijlen: sectie "Werfkaart" onderaan src/app/globals.css.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  CircleDollarSign,
  Download,
  FilterX,
  List,
  MapPinOff,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Scan,
  SearchX,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import type { KaartFocus, OndergrondSoort } from "@/components/werven-kaart-binnen";
import { CATEGORIE_LABEL, STATUS_LABEL } from "@/lib/projecten";
import { werfGroep, type WerfPunt } from "@/lib/werf-punten";
import {
  GEEN_FILTERS,
  SORTERINGEN,
  SORTERING_LABEL,
  aantalActief,
  adresVan,
  filterPillen,
  filterRijen,
  leesFilters,
  optiesVan,
  schrijfFilters,
  sorteer,
  voorbereid,
  werfkaartCsv,
  zonderFacet,
  type Facet,
  type Filters,
  type KaartProject,
  type Rij,
  type Sortering,
} from "@/lib/werfkaart";
import { FilterPaneel, ZoekVeld } from "@/components/admin/werfkaart-filters";

const KaartBinnen = dynamic(() => import("@/components/werven-kaart-binnen"), {
  ssr: false,
  loading: () => <div aria-hidden className="werven-kaart-skelet h-full rounded-2xl border shadow-sm" />,
});

// ── Kleine voorkeuren per kijker (localStorage, met geheugen als vangnet) ──
function voorkeur<T extends string>(sleutel: string, standaard: T, toegestaan: readonly T[]) {
  const luisteraars = new Set<() => void>();
  let geheugen: T | null = null;
  const lees = (): T => {
    if (geheugen) return geheugen;
    try {
      const v = window.localStorage.getItem(sleutel);
      return (toegestaan as readonly string[]).includes(v ?? "") ? (v as T) : standaard;
    } catch {
      return standaard;
    }
  };
  return {
    lees,
    server: () => standaard,
    volg(melding: () => void) {
      luisteraars.add(melding);
      const opslag = (e: StorageEvent) => {
        if (e.key === sleutel) {
          geheugen = null;
          melding();
        }
      };
      window.addEventListener("storage", opslag);
      return () => {
        luisteraars.delete(melding);
        window.removeEventListener("storage", opslag);
      };
    },
    zet(v: T) {
      geheugen = v;
      try {
        window.localStorage.setItem(sleutel, v);
      } catch {}
      for (const m of luisteraars) m();
    },
  };
}
const ONDERGROND = voorkeur<OndergrondSoort>("svm-werfkaart-ondergrond", "kaart", ["kaart", "luchtfoto"]);
const PANEEL = voorkeur<"open" | "dicht">("svm-werfkaart-paneel", "open", ["open", "dicht"]);
/** Resultatenkolom rechts (vanaf 1280 px) in- of uitgeklapt. */
const LIJST = voorkeur<"open" | "dicht">("svm-werfkaart-lijst", "open", ["open", "dicht"]);

// Vanaf 1024 px staat het filterpaneel naast de kaart, daaronder in een lade.
const BREED = "(min-width: 1024px)";
const volgBreed = (melding: () => void) => {
  const mq = window.matchMedia(BREED);
  mq.addEventListener("change", melding);
  return () => mq.removeEventListener("change", melding);
};
const leesBreed = () => window.matchMedia(BREED).matches;

type FilterStand = { f: Filters; bron: "gebruiker" | "adres"; modus: "push" | "vervang" };

/** Ids in een sleutel van de kaart: één werf, of meerdere (bundel) gescheiden door een spatie. */
const ids = (sleutel: string | null) => (sleutel ? sleutel.split(" ") : []);

const naarPunt = (r: Rij): WerfPunt => ({
  id: r.id,
  titel: r.titel,
  status: r.status,
  statusLabel: STATUS_LABEL[r.status].nl,
  categorie: r.categorie,
  categorieLabel: CATEGORIE_LABEL[r.categorie].nl,
  merken: r.merken,
  adres: adresVan(r),
  klant: r.klant || undefined,
  lat: r.lat as number,
  lon: r.lon as number,
  href: `/admin/projecten/${r.id}`,
});

const EERSTE_RIJEN = 150;
const knop =
  "inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50";

// ── Eén rij in de resultaten ───────────────────────────────────────────────
const Resultaat = memo(function Resultaat({
  r,
  licht,
  onVlieg,
  onLicht,
}: {
  r: Rij;
  licht: boolean;
  onVlieg: (id: string) => void;
  onLicht: (id: string | null) => void;
}) {
  const groep = werfGroep(r.status);
  const plaats = [r.gemeente, r.land && r.land !== "BE" ? r.land : ""].filter(Boolean).join(" · ");
  const lever = r.leverdatum ? `${r.leverdatum.slice(8, 10)}/${r.leverdatum.slice(5, 7)}` : "";
  const inhoud = (
    <>
      <span className={`werf-stip werf-stip--${groep} mt-[7px] shrink-0`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium leading-snug">{r.titel}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {r.klant}
          {plaats ? ` · ${plaats}` : ""}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className={`werf-status werf-status--${groep} wk-pil`}>{STATUS_LABEL[r.status].nl}</span>
          {r.categorie === "last-minute" && (
            <span className="wk-pil wk-pil--rood">
              <Zap className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              {CATEGORIE_LABEL[r.categorie].nl}
            </span>
          )}
          {lever && (
            <span
              className={`wk-pil ${
                r.klaar ? "wk-pil--rand" : r.dagen! < 0 ? "wk-pil--rood" : r.dagen! <= 3 ? "wk-pil--amber" : "wk-pil--rand"
              }`}
              title={`Leverdatum ${r.leverdatum}`}
            >
              {lever}
              {!r.klaar && r.dagen! < 0 ? ` · ${-r.dagen!} d te laat` : !r.klaar && r.dagen! <= 7 ? ` · ${r.dagen === 0 ? "vandaag" : `nog ${r.dagen} d`}` : ""}
            </span>
          )}
          {r.factuur === "betaald" && (
            <span className="wk-pil wk-pil--groen">
              <CircleDollarSign className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              betaald
            </span>
          )}
          {r.factuur === "open" && <span className="wk-pil wk-pil--amber">factuur {r.factuurStatus ?? "open"}</span>}
          {!r.locatie && (
            <span className="wk-pil wk-pil--amber">
              <MapPinOff className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              geen locatie
            </span>
          )}
        </span>
      </span>
    </>
  );
  return (
    <li
      data-rij={r.id}
      className={`wk-rij ${licht ? "is-licht" : ""}`}
      onPointerEnter={() => onLicht(r.id)}
      onPointerLeave={() => onLicht(null)}
    >
      {r.locatie ? (
        <button type="button" className="wk-rij__hoofd" onClick={() => onVlieg(r.id)} onFocus={() => onLicht(r.id)} onBlur={() => onLicht(null)}>
          <span className="sr-only">Toon op de kaart: </span>
          {inhoud}
        </button>
      ) : (
        <Link href={`/admin/projecten/${r.id}`} className="wk-rij__hoofd">
          <span className="sr-only">Geen locatie — open het project om het werfadres aan te vullen: </span>
          {inhoud}
        </Link>
      )}
      <Link href={`/admin/projecten/${r.id}`} className="wk-rij__open" aria-label={`Project openen: ${r.titel}`} title="Project openen">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </li>
  );
});

// ── De pagina ──────────────────────────────────────────────────────────────
export function Werfkaart({ projecten, vandaag, fout }: { projecten: KaartProject[]; vandaag: string; fout: string | null }) {
  const sp = useSearchParams();
  const rijen = useMemo(() => voorbereid(projecten, vandaag), [projecten, vandaag]);
  const opties = useMemo(() => optiesVan(projecten), [projecten]);

  // Filters: de stand hier is de bron; het adres volgt (effect hieronder).
  // `bron` onthoudt of een wijziging van de gebruiker komt (→ adres
  // bijwerken) of uit het adres zelf (terugknop, link) (→ niets schrijven).
  const [stand, setStand] = useState<FilterStand>(() => ({ f: leesFilters(sp, opties), bron: "gebruiker", modus: "vervang" }));
  const filters = stand.f;
  const wijzig = (deel: Partial<Filters>, modus: "push" | "vervang" = "push") =>
    setStand((s) => ({ f: { ...s.f, ...deel }, bron: "gebruiker", modus }));
  const wisFacet = (facet: Facet) => setStand((s) => ({ f: zonderFacet(s.f, facet), bron: "gebruiker", modus: "push" }));
  const wisAlles = () => setStand((s) => ({ f: { ...GEEN_FILTERS, sort: s.f.sort }, bron: "gebruiker", modus: "push" }));

  // Adres gewijzigd buiten deze pagina om (terug/vooruit, een link naar
  // /admin/kaart, …) → filters opnieuw uit het adres. Eigen wijzigingen komen
  // hier ook langs, maar zijn dan al gelijk.
  const spTekst = sp.toString();
  const [spGezien, setSpGezien] = useState(spTekst);
  if (spTekst !== spGezien) {
    setSpGezien(spTekst);
    const extern = leesFilters(sp, opties);
    if (schrijfFilters(extern) !== schrijfFilters(filters)) setStand({ f: extern, bron: "adres", modus: "vervang" });
  }

  // Filters → adres. Eerste keer vervangen (opgeschoond adres, onzin eruit),
  // daarna een stap in de geschiedenis per wijziging (zoeken vervangt).
  useEffect(() => {
    if (stand.bron !== "gebruiker") return;
    const qs = schrijfFilters(stand.f);
    if (qs === window.location.search.replace(/^\?/, "")) return;
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (stand.modus === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, [stand]);

  // Zoekveld: direct zichtbaar, pas na een korte pauze filteren.
  const [zoek, setZoek] = useState(filters.q);
  const [zoekBron, setZoekBron] = useState(filters.q);
  if (filters.q !== zoekBron) {
    setZoekBron(filters.q);
    if (zoek.trim() !== filters.q.trim()) setZoek(filters.q);
  }
  const zoekKlok = useRef<number | undefined>(undefined);
  const onZoek = (v: string) => {
    setZoek(v);
    window.clearTimeout(zoekKlok.current);
    if (!v) wijzig({ q: "" }, "vervang");
    else zoekKlok.current = window.setTimeout(() => wijzig({ q: v.slice(0, 100) }, "vervang"), 220);
  };
  useEffect(() => () => window.clearTimeout(zoekKlok.current), []);

  const { resultaat, tel } = useMemo(() => filterRijen(rijen, filters, vandaag), [rijen, filters, vandaag]);
  const lijst = useMemo(() => sorteer(resultaat, filters.sort), [resultaat, filters.sort]);
  // Volgorde van de punten los van de sortering: anders past de kaart zich
  // opnieuw aan bij elke andere sortering.
  const punten = useMemo(() => resultaat.filter((r) => r.locatie).map(naarPunt), [resultaat]);
  const zonderLocatie = resultaat.length - punten.length;
  const actief = aantalActief(filters);
  const pillen = useMemo(() => filterPillen(filters, opties), [filters, opties]);

  // Kaart ↔ lijst
  const [lijstId, setLijstId] = useState<string | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [focus, setFocus] = useState<KaartFocus | null>(null);
  const [passend, setPassend] = useState(0);
  const licht = useMemo(() => new Set([...ids(pinId), ...ids(openId)]), [pinId, openId]);
  const kaartRef = useRef<HTMLDivElement>(null);
  const lijstRef = useRef<HTMLUListElement>(null);

  const onLicht = (id: string | null) => setLijstId(id);
  const vlieg = (id: string) => {
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    // Lijst onder de kaart (gsm/tablet): de kaart in beeld brengen.
    const kaart = kaartRef.current;
    if (kaart) {
      const r = kaart.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) kaart.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Open popup (klik op een pin) → die rij in de lijst in beeld schuiven.
  useEffect(() => {
    const ul = lijstRef.current;
    const id = ids(openId)[0];
    if (!ul || !id || ul.scrollHeight <= ul.clientHeight) return;
    const rij = ul.querySelector<HTMLElement>(`[data-rij="${CSS.escape(id)}"]`);
    if (!rij) return;
    const boven = rij.offsetTop - ul.offsetTop;
    if (boven < ul.scrollTop || boven + rij.offsetHeight > ul.scrollTop + ul.clientHeight) {
      ul.scrollTo({ top: Math.max(0, boven - ul.clientHeight / 3), behavior: "smooth" });
    }
  }, [openId]);

  // Lange lijsten: eerst 150 rijen, dan "meer". Nieuwe filters → weer 150.
  const [max, setMax] = useState(EERSTE_RIJEN);
  const [maxVoor, setMaxVoor] = useState(lijst);
  if (maxVoor !== lijst) {
    setMaxVoor(lijst);
    setMax(EERSTE_RIJEN);
  }
  const openIndex = openId ? lijst.findIndex((r) => r.id === ids(openId)[0]) : -1;
  if (openIndex >= max) setMax(openIndex + 25);

  // Voorkeuren en schermbreedte
  const ondergrond = useSyncExternalStore(ONDERGROND.volg, ONDERGROND.lees, ONDERGROND.server);
  const paneel = useSyncExternalStore(PANEEL.volg, PANEEL.lees, PANEEL.server);
  const breed = useSyncExternalStore(volgBreed, leesBreed, () => true);
  const [lijstOpen, setLijstOpen] = useState(false);
  const lade = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (breed) lade.current?.close();
  }, [breed]);

  const klapIn = () => {
    PANEEL.zet("dicht");
    requestAnimationFrame(() => document.getElementById("wk-paneel-open")?.focus());
  };
  const klapUit = () => {
    PANEEL.zet("open");
    requestAnimationFrame(() => document.getElementById("wk-paneel-dicht")?.focus());
  };
  const lijstKolom = useSyncExternalStore(LIJST.volg, LIJST.lees, LIJST.server);
  const lijstIn = () => {
    LIJST.zet("dicht");
    requestAnimationFrame(() => document.getElementById("wk-lijst-open")?.focus());
  };
  const lijstUit = () => {
    LIJST.zet("open");
    requestAnimationFrame(() => document.getElementById("wk-lijst-dicht")?.focus());
  };

  const toonZonderLocatie = () => {
    wijzig({ locatie: filters.locatie === "zonder" ? "" : "zonder" });
    setLijstOpen(true);
  };

  const exporteer = () => {
    const csv = werfkaartCsv(lijst, window.location.origin);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `werfkaart-${vandaag}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const paneelInhoud = (metZoeken: boolean) => (
    <FilterPaneel
      filters={filters}
      tel={tel}
      opties={opties}
      vandaag={vandaag}
      zoek={zoek}
      onZoek={onZoek}
      wijzig={wijzig}
      metZoeken={metZoeken}
    />
  );

  const M = projecten.length;
  const N = resultaat.length;

  return (
    <div className="werfkaart lg:-mb-12">
      {/* Kop */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Werfkaart</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted" aria-live="polite">
            <span>
              <span className="font-semibold tabular-nums text-foreground">{N}</span> van <span className="tabular-nums">{M}</span>{" "}
              {M === 1 ? "project" : "projecten"}
            </span>
            {tel.locatie.zonder > 0 && (
              <button
                type="button"
                onClick={toonZonderLocatie}
                aria-pressed={filters.locatie === "zonder"}
                className="wk-zonder inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              >
                <MapPinOff className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                {tel.locatie.zonder} {tel.locatie.zonder === 1 ? "project" : "projecten"} zonder locatie
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Gsm/tablet: wissen zit in de lade en op de pillen */}
          {actief > 0 && (
            <button type="button" onClick={wisAlles} className={`${knop} max-lg:hidden`}>
              <FilterX className="h-4 w-4" strokeWidth={2} aria-hidden />
              Filters wissen
            </button>
          )}
          <button type="button" onClick={() => setPassend((n) => n + 1)} disabled={punten.length === 0} className={knop}>
            <Scan className="h-4 w-4" strokeWidth={2} aria-hidden />
            Passend zoomen
          </button>
          <button
            type="button"
            onClick={exporteer}
            disabled={N === 0}
            className={knop}
            title={`${N} ${N === 1 ? "project" : "projecten"} als CSV (puntkomma, UTF-8)`}
          >
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            CSV
          </button>
        </div>
      </div>

      {fout && (
        <p role="alert" className="wk-fout mt-4 rounded-xl px-4 py-2 text-sm font-medium">
          Projecten konden niet (volledig) geladen worden: {fout}
        </p>
      )}

      {/* Gsm/tablet: zoeken, filterknop en de actieve filters */}
      <div className="mt-4 flex gap-2 lg:hidden">
        <ZoekVeld waarde={zoek} onZoek={onZoek} className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={() => lade.current?.showModal()}
          aria-haspopup="dialog"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3.5 text-sm font-medium shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
          Filters
          {actief > 0 && <span className="wk-teller">{actief}</span>}
        </button>
      </div>
      {pillen.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5 lg:hidden" aria-label="Actieve filters">
          {pillen.map((p) => (
            <li key={p.facet} className="min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => wisFacet(p.facet)}
                className="wk-filterpil inline-flex max-w-full items-center gap-1 rounded-full border bg-card py-1 pl-3 pr-1.5 text-xs font-medium"
                aria-label={`Filter wissen: ${p.label}`}
              >
                <span className="truncate">{p.label}</span>
                <X className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2.5} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Werkvlak: filters | kaart | resultaten */}
      <div className="wk-vlak mt-4 grid gap-3">
        {breed &&
          (paneel === "open" ? (
            <aside aria-label="Filters" className="hidden min-h-0 w-[280px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:flex">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <SlidersHorizontal className="h-4 w-4 text-accent" strokeWidth={2} aria-hidden />
                <h2 className="text-sm font-semibold">Filters</h2>
                {actief > 0 && <span className="wk-teller">{actief}</span>}
                <div className="ml-auto flex items-center gap-1">
                  {actief > 0 && (
                    <button type="button" onClick={wisAlles} className="wk-link rounded-full px-2 py-1 text-xs">
                      Wissen
                    </button>
                  )}
                  <button
                    id="wk-paneel-dicht"
                    type="button"
                    onClick={klapIn}
                    aria-label="Filterpaneel inklappen"
                    title="Filterpaneel inklappen"
                    className="wk-icoonknop grid h-8 w-8 place-items-center rounded-lg"
                  >
                    <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{paneelInhoud(true)}</div>
            </aside>
          ) : (
            <aside aria-label="Filters (ingeklapt)" className="hidden w-12 flex-col items-center gap-2 rounded-2xl border bg-card py-2.5 shadow-sm lg:flex">
              <button
                id="wk-paneel-open"
                type="button"
                onClick={klapUit}
                aria-label={`Filterpaneel openklappen${actief ? ` (${actief} actief)` : ""}`}
                title="Filters tonen"
                className="wk-icoonknop grid h-8 w-8 place-items-center rounded-lg"
              >
                <PanelLeftOpen className="h-4 w-4" strokeWidth={2} />
              </button>
              {actief > 0 && <span className="wk-teller">{actief}</span>}
              <span className="wk-rail-tekst mt-1 font-mono text-[10px] uppercase tracking-widest text-muted" aria-hidden>
                Filters
              </span>
            </aside>
          ))}

        <div ref={kaartRef} className="wk-kaart relative min-w-0 scroll-mt-20">
          <KaartBinnen
            punten={punten}
            taal="nl"
            zonderLocatie={zonderLocatie}
            lijstId={lijstId}
            pinId={pinId}
            openId={openId}
            setPinId={setPinId}
            setOpenId={setOpenId}
            ondergrond={ondergrond}
            onOndergrond={ONDERGROND.zet}
            legende="vast"
            vrijZoomen
            passendTeller={passend}
            focus={focus}
          />
          {punten.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[700] grid place-items-center p-6">
              <div className="wk-leeg pointer-events-auto max-w-sm rounded-2xl border p-5 text-center">
                {N === 0 ? (
                  <>
                    <SearchX className="mx-auto h-6 w-6 text-muted" strokeWidth={2} aria-hidden />
                    <p className="mt-2 text-sm font-semibold">{M === 0 ? "Nog geen projecten" : "Geen projecten voor deze filters"}</p>
                    {M > 0 && (
                      <>
                        <p className="mt-1 text-xs text-muted">Pas de filters aan of begin opnieuw.</p>
                        <button type="button" onClick={wisAlles} className={`${knop} mt-3`}>
                          <FilterX className="h-4 w-4" strokeWidth={2} aria-hidden />
                          Filters wissen
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <MapPinOff className="mx-auto h-6 w-6 text-muted" strokeWidth={2} aria-hidden />
                    <p className="mt-2 text-sm font-semibold">
                      {N === 1 ? "Dit project heeft" : `Geen van deze ${N} projecten heeft`} {N === 1 ? "geen locatie" : "een locatie"}
                    </p>
                    <p className="mt-1 text-xs text-muted">Open een project en vul het werfadres aan; dan verschijnt het op de kaart.</p>
                    {!breed && (
                      <button type="button" onClick={() => setLijstOpen(true)} className={`${knop} mt-3`}>
                        <List className="h-4 w-4" strokeWidth={2} aria-hidden />
                        Toon de lijst
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Gsm/tablet: lijst onder de kaart, in- en uitklapbaar */}
        <button
          type="button"
          onClick={() => setLijstOpen((o) => !o)}
          aria-expanded={lijstOpen}
          aria-controls="wk-lijst"
          className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm font-medium shadow-sm lg:hidden"
        >
          <List className="h-4 w-4 text-muted" strokeWidth={2} aria-hidden />
          {lijstOpen ? "Lijst verbergen" : "Lijst tonen"}
          <span className="font-mono text-xs tabular-nums text-muted">{N}</span>
          <ChevronDown className={`ml-auto h-4 w-4 text-muted transition-transform ${lijstOpen ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
        </button>

        <section
          id="wk-lijst"
          aria-label="Resultaten"
          className={`wk-lijst ${lijstOpen ? "flex" : "hidden"} min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:flex ${
            lijstKolom === "dicht" ? "xl:hidden" : ""
          }`}
        >
          <div className="flex items-center gap-2 border-b py-3 pl-4 pr-2.5">
            <h2 className="text-sm font-semibold">Resultaten</h2>
            <span className="font-mono text-xs tabular-nums text-muted">{N}</span>
            <label className="ml-auto flex min-w-0 items-center text-xs text-muted">
              <select
                value={filters.sort}
                onChange={(e) => wijzig({ sort: e.target.value as Sortering }, "vervang")}
                aria-label="Sorteren"
                className="wk-select max-w-[9.5rem] rounded-lg py-1 pl-1.5 text-xs font-medium text-foreground"
              >
                {SORTERINGEN.map((s) => (
                  <option key={s} value={s}>
                    {SORTERING_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <button
              id="wk-lijst-dicht"
              type="button"
              onClick={lijstIn}
              aria-label="Resultaten inklappen"
              title="Resultaten inklappen (grotere kaart)"
              className="wk-icoonknop hidden h-8 w-8 shrink-0 place-items-center rounded-lg xl:grid"
            >
              <PanelRightClose className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {filters.locatie === "zonder" && N > 0 && (
            <p className="wk-uitleg mx-3 mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed">
              Deze projecten staan niet op de kaart. Open een project en vul het werfadres aan.
            </p>
          )}

          {N === 0 ? (
            <div className="grid flex-1 place-items-center px-6 py-10 text-center">
              <div>
                <SearchX className="mx-auto h-6 w-6 text-muted" strokeWidth={2} aria-hidden />
                <p className="mt-2 text-sm font-semibold">{M === 0 ? "Nog geen projecten" : "Niets gevonden"}</p>
                {actief > 0 && (
                  <button type="button" onClick={wisAlles} className="wk-link mt-1 text-xs">
                    Filters wissen
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ul ref={lijstRef} className="wk-rijen min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
              {lijst.slice(0, max).map((r) => (
                <Resultaat key={r.id} r={r} licht={licht.has(r.id) || lijstId === r.id} onVlieg={vlieg} onLicht={onLicht} />
              ))}
              {lijst.length > max && (
                <li className="p-2">
                  <button type="button" onClick={() => setMax((m) => m + 300)} className={`${knop} w-full justify-center`}>
                    Toon meer ({lijst.length - max})
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>
        {lijstKolom === "dicht" && (
          <aside aria-label="Resultaten (ingeklapt)" className="hidden w-12 flex-col items-center gap-2 rounded-2xl border bg-card py-2.5 shadow-sm xl:flex">
            <button
              id="wk-lijst-open"
              type="button"
              onClick={lijstUit}
              aria-label={`Resultaten openklappen (${N})`}
              title="Resultaten tonen"
              className="wk-icoonknop grid h-8 w-8 place-items-center rounded-lg"
            >
              <PanelRightOpen className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="font-mono text-[11px] font-semibold tabular-nums">{N}</span>
            <span className="wk-rail-tekst mt-1 font-mono text-[10px] uppercase tracking-widest text-muted" aria-hidden>
              Resultaten
            </span>
          </aside>
        )}
      </div>

      {/* Gsm/tablet: filters in een schuiflade (native dialog: focusval en Escape) */}
      <dialog
        ref={lade}
        aria-labelledby="wk-lade-titel"
        className="wk-lade"
        onClick={(e) => {
          if (e.target === e.currentTarget) lade.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <h2 id="wk-lade-titel" className="text-base font-semibold">
              Filters
            </h2>
            {actief > 0 && <span className="wk-teller">{actief}</span>}
            <button
              type="button"
              onClick={() => lade.current?.close()}
              aria-label="Filters sluiten"
              className="wk-icoonknop ml-auto grid h-9 w-9 place-items-center rounded-lg"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{!breed && paneelInhoud(false)}</div>
          <div className="flex gap-2 border-t px-4 py-3">
            <button type="button" onClick={wisAlles} disabled={actief === 0} className={`${knop} flex-1 justify-center`}>
              Wissen
            </button>
            <button
              type="button"
              onClick={() => lade.current?.close()}
              className="inline-flex flex-[2] items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Toon {N} {N === 1 ? "project" : "projecten"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
