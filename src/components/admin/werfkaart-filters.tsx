"use client";

// Filterpaneel van de werfkaart (/admin/kaart): links naast de kaart (breed)
// of in de schuiflade (gsm/tablet). Elke keuze toont live hoeveel projecten
// er dan overblijven (zie filterRijen in @/lib/werfkaart). Stijlen: sectie
// "Werfkaart" onderaan src/app/globals.css.

import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Search, Users, X, Zap } from "lucide-react";
import { CATEGORIE_LABEL, STATUS_LABEL } from "@/lib/projecten";
import { werfGroep } from "@/lib/werf-punten";
import {
  ACTIEF,
  AFGEROND,
  ALLE_STATUSSEN,
  CATEGORIEEN,
  FACTUREN,
  FACTUUR_LABEL,
  GEEN,
  LEVERINGEN,
  LEVERING_LABEL,
  PERIODE_LABEL,
  isDag,
  landNaam,
  normaal,
  provincieNaam,
  sameSet,
  stelselLabel,
  wisselLand,
  wisselProvincie,
  type Filters,
  type KlantOptie,
  type Opties,
  type Tellingen,
} from "@/lib/werfkaart";

export type Wijzig = (deel: Partial<Filters>, modus?: "push" | "vervang") => void;

/** Keuze aan/uit in een lijst, in de vaste volgorde van `alle` (zelfde selectie = zelfde adres). */
const wisselIn = <T,>(alle: readonly T[], gekozen: T[], x: T): T[] =>
  alle.filter((y) => (y === x ? !gekozen.includes(x) : gekozen.includes(y)));

// ── Bouwstenen ─────────────────────────────────────────────────────────────
function Chip({
  aan,
  gemengd = false,
  n,
  onClick,
  voor,
  children,
  titel,
}: {
  aan: boolean;
  /** Deels gekozen (België met losse provincies). */
  gemengd?: boolean;
  n?: number;
  onClick: () => void;
  voor?: ReactNode;
  children: ReactNode;
  titel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={gemengd && !aan ? "mixed" : aan}
      onClick={onClick}
      title={titel}
      className={`wk-chip ${n === 0 && !aan && !gemengd ? "is-leeg" : ""}`}
    >
      {voor}
      <span className="min-w-0 truncate">{children}</span>
      {n != null && <span className="wk-chip__n">{n}</span>}
    </button>
  );
}

function Segment<T extends string>({
  label,
  keuzes,
  waarde,
  onKies,
}: {
  label: string;
  keuzes: { w: T; label: string; n?: number }[];
  waarde: T;
  onKies: (w: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="wk-seg">
      {keuzes.map((k) => (
        <button key={k.w} type="button" aria-pressed={waarde === k.w} onClick={() => onKies(k.w)}>
          <span className="truncate">{k.label}</span>
          {k.n != null && <span className="wk-seg__n">{k.n}</span>}
        </button>
      ))}
    </div>
  );
}

function Sectie({
  titel,
  actief,
  onWis,
  children,
}: {
  titel: string;
  actief: boolean;
  onWis: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="wk-sectie">
      <div className="mb-2.5 flex min-h-5 items-center justify-between gap-2">
        <h3 id={id} className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
          {titel}
          {actief && <span className="wk-sectie__aan" aria-label="(actief)" />}
        </h3>
        {actief && (
          <button type="button" onClick={onWis} className="wk-link text-[11px]">
            wissen
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Klant: zoekbare keuzelijst (combobox) ──────────────────────────────────
function KlantKiezer({
  klanten,
  tel,
  waarde,
  onKies,
}: {
  klanten: KlantOptie[];
  tel: Record<string, number>;
  waarde: string;
  onKies: (email: string) => void;
}) {
  const id = useId();
  const [tekst, setTekst] = useState("");
  const [open, setOpen] = useState(false);
  const [actief, setActief] = useState(0);
  const lijst = useMemo(() => {
    const w = normaal(tekst.trim());
    const hits = w ? klanten.filter((k) => normaal(`${k.naam} ${k.email}`).includes(w)) : klanten;
    return hits.slice(0, 60);
  }, [tekst, klanten]);
  const gekozen = klanten.find((k) => k.email === waarde);

  if (gekozen) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2">
        <Users className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{gekozen.naam}</div>
          {gekozen.naam !== gekozen.email && <div className="truncate text-[11px] text-muted">{gekozen.email}</div>}
        </div>
        <button
          type="button"
          onClick={() => onKies("")}
          aria-label={`Klantfilter wissen (${gekozen.naam})`}
          title="Klantfilter wissen"
          className="wk-icoonknop grid h-7 w-7 shrink-0 place-items-center rounded-lg"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    );
  }

  const kies = (k: KlantOptie) => {
    onKies(k.email);
    setTekst("");
    setOpen(false);
  };
  const naar = (i: number) => {
    setActief(i);
    document.getElementById(`${id}-o${i}`)?.scrollIntoView({ block: "nearest" });
  };
  const toets = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (lijst.length) naar(Math.min(lijst.length - 1, actief + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (lijst.length) naar(Math.max(0, actief - 1));
    } else if (e.key === "Enter") {
      if (open && lijst[actief]) {
        e.preventDefault();
        kies(lijst[actief]);
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-label="Klant zoeken"
          aria-expanded={open}
          aria-controls={`${id}-lijst`}
          aria-autocomplete="list"
          aria-activedescendant={open && lijst[actief] ? `${id}-o${actief}` : undefined}
          autoComplete="off"
          value={tekst}
          onChange={(e) => {
            setTekst(e.target.value);
            setOpen(true);
            setActief(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={toets}
          placeholder={`Zoek bij ${klanten.length} ${klanten.length === 1 ? "klant" : "klanten"}`}
          className="wk-veld w-full py-2 pl-9 pr-3"
        />
      </div>
      {open && (
        <ul id={`${id}-lijst`} role="listbox" aria-label="Klanten" className="wk-keuzelijst mt-1.5 max-h-60 overflow-y-auto overscroll-contain p-1">
          {lijst.map((k, i) => (
            <li
              key={k.email}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === actief}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActief(i)}
              onClick={() => kies(k)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{k.naam}</span>
                {k.naam !== k.email && <span className="block truncate text-[11px] text-muted">{k.email}</span>}
              </span>
              <span className="wk-chip__n">{tel[k.email] ?? 0}</span>
            </li>
          ))}
          {lijst.length === 0 && <li className="px-2.5 py-2 text-[13px] text-muted">Geen klant gevonden</li>}
        </ul>
      )}
    </div>
  );
}

// ── Zoekveld (ook los gebruikt boven de kaart op een gsm) ──────────────────
export function ZoekVeld({ waarde, onZoek, className = "" }: { waarde: string; onZoek: (v: string) => void; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} aria-hidden />
      <input
        type="search"
        value={waarde}
        onChange={(e) => onZoek(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && waarde) {
            e.preventDefault();
            onZoek("");
          }
        }}
        aria-label="Zoeken in projecten"
        placeholder="Titel, adres, gemeente, klant…"
        className="wk-veld wk-zoek w-full py-2 pl-9 pr-9"
      />
      {waarde && (
        <button
          type="button"
          onClick={() => onZoek("")}
          aria-label="Zoekterm wissen"
          title="Zoekterm wissen"
          className="wk-icoonknop absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ── Het paneel ─────────────────────────────────────────────────────────────
export function FilterPaneel({
  filters: f,
  tel,
  opties,
  vandaag,
  zoek,
  onZoek,
  wijzig,
  metZoeken = true,
}: {
  filters: Filters;
  tel: Tellingen;
  opties: Opties;
  vandaag: string;
  zoek: string;
  onZoek: (v: string) => void;
  wijzig: Wijzig;
  /** Zoekveld bovenaan (op een gsm staat het al boven de kaart). */
  metZoeken?: boolean;
}) {
  const som = (xs: string[], r: Record<string, number>) => xs.reduce((t, x) => t + (r[x] ?? 0), 0);
  const statusPreset = sameSet(f.status, ACTIEF) ? "actief" : sameSet(f.status, AFGEROND) ? "afgerond" : f.status.length ? "" : "alles";
  // Systemen: wat in de gegevens voorkomt of gekozen is; daarna de rest (gedimd).
  const systemen = [...opties.systemen, GEEN].filter((m) => m !== GEEN || (tel.systeem[GEEN] ?? 0) > 0 || f.systeem.includes(GEEN));
  const systemenGesorteerd = [
    ...systemen.filter((m) => (tel.systeem[m] ?? 0) > 0 || f.systeem.includes(m)),
    ...systemen.filter((m) => !((tel.systeem[m] ?? 0) > 0 || f.systeem.includes(m))),
  ];

  return (
    <div className="wk-paneel">
      {metZoeken && (
        <Sectie titel="Zoeken" actief={!!f.q.trim()} onWis={() => onZoek("")}>
          <ZoekVeld waarde={zoek} onZoek={onZoek} />
        </Sectie>
      )}

      <Sectie titel="Status" actief={f.status.length > 0} onWis={() => wijzig({ status: [] })}>
        <Segment
          label="Snelkeuze status"
          waarde={statusPreset}
          onKies={(w) => wijzig({ status: w === "actief" ? ACTIEF : w === "afgerond" ? AFGEROND : [] })}
          keuzes={[
            { w: "actief", label: "Actief", n: som(ACTIEF, tel.status) },
            { w: "afgerond", label: "Afgerond", n: som(AFGEROND, tel.status) },
            { w: "alles", label: "Alles", n: som(ALLE_STATUSSEN, tel.status) },
          ]}
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {ALLE_STATUSSEN.map((s) => (
            <Chip
              key={s}
              aan={f.status.includes(s)}
              n={tel.status[s] ?? 0}
              onClick={() => wijzig({ status: wisselIn(ALLE_STATUSSEN, f.status, s) })}
              voor={<span className={`werf-stip werf-stip--${werfGroep(s)} shrink-0`} aria-hidden />}
            >
              {STATUS_LABEL[s].nl}
            </Chip>
          ))}
        </div>
      </Sectie>

      <Sectie titel="Urgentie" actief={f.urg.length > 0} onWis={() => wijzig({ urg: [] })}>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIEEN.map((c) => (
            <Chip
              key={c}
              aan={f.urg.includes(c)}
              n={tel.urg[c] ?? 0}
              onClick={() => wijzig({ urg: wisselIn(CATEGORIEEN, f.urg, c) })}
              voor={c === "last-minute" ? <Zap className="wk-zap h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden /> : undefined}
            >
              {CATEGORIE_LABEL[c].nl}
            </Chip>
          ))}
        </div>
      </Sectie>

      <Sectie titel="Machinesturing" actief={f.systeem.length > 0} onWis={() => wijzig({ systeem: [] })}>
        <div className="flex flex-wrap gap-1.5">
          {systemenGesorteerd.map((m) => (
            <Chip
              key={m}
              aan={f.systeem.includes(m)}
              n={tel.systeem[m] ?? 0}
              onClick={() => wijzig({ systeem: wisselIn(systemen, f.systeem, m) })}
            >
              {m === GEEN ? "Geen systeem" : m}
            </Chip>
          ))}
        </div>
      </Sectie>

      <Sectie titel="Klant" actief={!!f.klant} onWis={() => wijzig({ klant: "" })}>
        <KlantKiezer klanten={opties.klanten} tel={tel.klant} waarde={f.klant} onKies={(email) => wijzig({ klant: email })} />
      </Sectie>

      <Sectie titel="Land & provincie" actief={f.land.length + f.prov.length > 0} onWis={() => wijzig({ land: [], prov: [] })}>
        <div className="flex flex-wrap gap-1.5">
          {opties.landen.map((l) => (
            <Chip
              key={l}
              aan={f.land.includes(l)}
              gemengd={l === "BE" && f.prov.length > 0}
              n={tel.land[l] ?? 0}
              onClick={() => wijzig(wisselLand(f, l))}
            >
              {landNaam(l)}
            </Chip>
          ))}
        </div>
        {opties.provincies.length > 0 && (
          <div className="wk-boom mt-3 pl-3">
            <p className="mb-1.5 text-[11px] text-muted">Provincie (België, volgens postcode)</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Provincies in België">
              {opties.provincies.map((c) => (
                <Chip
                  key={c}
                  aan={f.land.includes("BE") || f.prov.includes(c)}
                  n={tel.prov[c] ?? 0}
                  onClick={() => wijzig(wisselProvincie(f, c, opties.provincies))}
                >
                  {provincieNaam(c)}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </Sectie>

      <Sectie titel="Coördinatenstelsel" actief={f.stelsel.length > 0} onWis={() => wijzig({ stelsel: [] })}>
        <div className="flex flex-wrap gap-1.5">
          {opties.stelsels.map((s) => (
            <Chip
              key={s.sleutel}
              aan={f.stelsel.includes(s.sleutel)}
              n={tel.stelsel[s.sleutel] ?? 0}
              titel={s.sleutel === GEEN ? undefined : [s.naam, s.epsg].filter(Boolean).join(" — ")}
              onClick={() => wijzig({ stelsel: wisselIn(opties.stelsels.map((x) => x.sleutel), f.stelsel, s.sleutel) })}
            >
              {stelselLabel(s)}
            </Chip>
          ))}
          {opties.stelsels.length === 0 && <p className="text-xs text-muted">Nog geen stelsels.</p>}
        </div>
      </Sectie>

      <Sectie
        titel="Aangemaakt"
        actief={!!f.periode && (f.periode !== "eigen" || !!(f.van || f.tot))}
        onWis={() => wijzig({ periode: "", van: "", tot: "" })}
      >
        <div className="flex flex-wrap gap-1.5">
          {(["30d", "jaar", "12m"] as const).map((p) => (
            <Chip
              key={p}
              aan={f.periode === p}
              n={tel.periode[p] ?? 0}
              onClick={() => wijzig({ periode: f.periode === p ? "" : p, van: "", tot: "" })}
            >
              {PERIODE_LABEL[p]}
            </Chip>
          ))}
          <Chip
            aan={f.periode === "eigen"}
            n={f.periode === "eigen" && (f.van || f.tot) ? (tel.periode.eigen ?? 0) : undefined}
            onClick={() => wijzig({ periode: f.periode === "eigen" ? "" : "eigen", van: "", tot: "" })}
          >
            {PERIODE_LABEL.eigen}
          </Chip>
        </div>
        {f.periode === "eigen" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[11px] text-muted">
              Van
              <input
                type="date"
                value={f.van}
                max={f.tot || vandaag}
                onChange={(e) => {
                  const v = isDag(e.target.value) ? e.target.value : "";
                  wijzig(v && f.tot && v > f.tot ? { van: f.tot, tot: v } : { van: v }, "vervang");
                }}
                className="wk-veld mt-1 w-full px-2.5 py-1.5"
              />
            </label>
            <label className="text-[11px] text-muted">
              Tot en met
              <input
                type="date"
                value={f.tot}
                min={f.van || undefined}
                onChange={(e) => {
                  const v = isDag(e.target.value) ? e.target.value : "";
                  wijzig(v && f.van && v < f.van ? { van: v, tot: f.van } : { tot: v }, "vervang");
                }}
                className="wk-veld mt-1 w-full px-2.5 py-1.5"
              />
            </label>
          </div>
        )}
      </Sectie>

      <Sectie titel="Levering" actief={f.levering.length > 0} onWis={() => wijzig({ levering: [] })}>
        <div className="flex flex-wrap gap-1.5">
          {LEVERINGEN.map((l) => (
            <Chip
              key={l}
              aan={f.levering.includes(l)}
              n={tel.levering[l] ?? 0}
              titel={l === "telaat" || l === "week" ? "Enkel projecten die nog niet geleverd zijn" : undefined}
              onClick={() => wijzig({ levering: wisselIn(LEVERINGEN, f.levering, l) })}
              voor={l === "telaat" ? <span className="wk-stip-rood shrink-0" aria-hidden /> : undefined}
            >
              {LEVERING_LABEL[l]}
            </Chip>
          ))}
        </div>
      </Sectie>

      <Sectie
        titel="Factuur & offerte"
        actief={f.factuur.length > 0 || !!f.offerte}
        onWis={() => wijzig({ factuur: [], offerte: "" })}
      >
        <div className="flex flex-wrap gap-1.5">
          {FACTUREN.map((x) => (
            <Chip key={x} aan={f.factuur.includes(x)} n={tel.factuur[x] ?? 0} onClick={() => wijzig({ factuur: wisselIn(FACTUREN, f.factuur, x) })}>
              {FACTUUR_LABEL[x]}
            </Chip>
          ))}
        </div>
        <div className="mt-2.5">
          <Segment
            label="Offerte"
            waarde={f.offerte || "alle"}
            onKies={(w) => wijzig({ offerte: w === "alle" ? "" : w })}
            keuzes={[
              { w: "alle", label: "Alle", n: tel.offerte.alle },
              { w: "ja", label: "Met offerte", n: tel.offerte.ja },
              { w: "nee", label: "Zonder", n: tel.offerte.nee },
            ]}
          />
        </div>
      </Sectie>

      <Sectie titel="Locatie" actief={!!f.locatie} onWis={() => wijzig({ locatie: "" })}>
        <Segment
          label="Locatie"
          waarde={f.locatie || "alle"}
          onKies={(w) => wijzig({ locatie: w === "alle" ? "" : w })}
          keuzes={[
            { w: "alle", label: "Alle", n: tel.locatie.alle },
            { w: "met", label: "Op de kaart", n: tel.locatie.met },
            { w: "zonder", label: "Zonder", n: tel.locatie.zonder },
          ]}
        />
      </Sectie>
    </div>
  );
}

