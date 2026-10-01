"use client";

// Interactieve stukjes van de projectcockpit (/admin/projecten/[id]):
// rechtstreeks opladen naar Supabase Storage, bevestigknoppen en het
// offerteformulier met live berekening.

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, AlertCircle, Check, X } from "lucide-react";
import {
  leveringPlekken,
  registreerLeveringen,
  planPlekken,
  registreerPlannen,
  maakOfferte,
} from "@/app/actions/projecten-admin";
import { SubmitButton } from "@/components/submit-button";
import { UURTARIEF_CENT, MINIMUM_UREN, euro, type Categorie } from "@/lib/tarieven";
import { CATEGORIE_LABEL, grootteTekst, type Project } from "@/lib/projecten";
import { introOfferte, TALEN, TAAL_NAAM, type Taal } from "@/lib/projecten-teksten";

const INVOER =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

// ── Rechtstreeks opladen (signed upload URL + PUT met voortgang) ─────────

function putMetVoortgang(url: string, f: File, upsert: boolean, opVoortgang: (geladen: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", f.type || "application/octet-stream");
    if (upsert) xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => opVoortgang(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText.slice(0, 200)}`)));
    xhr.onerror = () => reject(new Error("netwerkfout"));
    xhr.send(f);
  });
}

export function Uploader({
  projectId,
  soort,
  systemen = [],
  maxVersie = 0,
}: {
  projectId: string;
  soort: "levering" | "plan";
  systemen?: string[];
  maxVersie?: number;
}) {
  const router = useRouter();
  const invoer = useRef<HTMLInputElement>(null);
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [systeem, setSysteem] = useState(systemen[0] ?? "");
  const [versie, setVersie] = useState(maxVersie > 0 ? maxVersie : 1);
  const [opmerking, setOpmerking] = useState("");
  const [geladen, setGeladen] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [, startTransition] = useTransition();
  const totaal = bestanden.reduce((t, f) => t + f.size, 0);

  async function opladen() {
    if (bestanden.length === 0) return;
    if (soort === "levering" && !systeem) {
      setMelding({ ok: false, tekst: "Kies een systeem." });
      return;
    }
    setBezig(true);
    setMelding(null);
    setGeladen(0);
    try {
      const lijst = bestanden.map((f) => ({ naam: f.name, grootte: f.size }));
      const r = soort === "levering" ? await leveringPlekken(projectId, lijst, systeem, versie) : await planPlekken(projectId, lijst);
      if (!r.ok) throw new Error(r.fout);
      let klaar = 0;
      for (let i = 0; i < bestanden.length; i++) {
        const f = bestanden[i];
        await putMetVoortgang(r.plekken[i].url, f, soort === "levering", (x) => setGeladen(klaar + x));
        klaar += f.size;
        setGeladen(klaar);
      }
      const items = r.plekken.map((p) => ({ naam: p.naam, pad: p.pad, grootte: p.grootte }));
      const reg =
        soort === "levering"
          ? await registreerLeveringen(projectId, items, systeem, versie, opmerking)
          : await registreerPlannen(projectId, items);
      if (!reg.ok) throw new Error("Opgeladen, maar registreren mislukte.");
      setMelding({ ok: true, tekst: `${bestanden.length} bestand(en) opgeladen.` });
      setBestanden([]);
      setOpmerking("");
      if (invoer.current) invoer.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setMelding({ ok: false, tekst: e instanceof Error ? e.message : String(e) });
    } finally {
      setBezig(false);
    }
  }

  const versieKeuzes = maxVersie > 0 ? [maxVersie, maxVersie + 1] : [1];

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      {soort === "levering" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-muted">
            Systeem
            <select value={systeem} onChange={(e) => setSysteem(e.target.value)} className={INVOER}>
              {systemen.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Versie
            <select value={versie} onChange={(e) => setVersie(Number(e.target.value))} className={INVOER}>
              {versieKeuzes.map((v) => (
                <option key={v} value={v}>
                  v{v}
                  {maxVersie > 0 && v === maxVersie ? " (huidige)" : maxVersie > 0 ? " (nieuwe versie)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Opmerking (zichtbaar voor klant)
            <input value={opmerking} onChange={(e) => setOpmerking(e.target.value)} maxLength={500} className={INVOER} placeholder="bv. aangepast na planwijziging" />
          </label>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={invoer}
          type="file"
          multiple
          disabled={bezig}
          onChange={(e) => setBestanden(Array.from(e.target.files ?? []))}
          className="max-w-full text-sm file:mr-3 file:rounded-full file:border file:bg-card file:px-3 file:py-1.5 file:text-xs file:text-foreground"
        />
        <button
          type="button"
          onClick={opladen}
          disabled={bezig || bestanden.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {bezig ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Upload className="h-4 w-4" strokeWidth={2} />}
          {bezig ? "Bezig…" : "Opladen"}
        </button>
        {bestanden.length > 0 && (
          <span className="font-mono text-[11px] text-muted">
            {bestanden.length} bestand(en) · {grootteTekst(totaal)}
            {soort === "levering" ? " · max. 200 MB per bestand" : " · max. 50 MB per bestand"}
          </span>
        )}
      </div>
      {bezig && totaal > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-card-hover">
          <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.min(100, Math.round((geladen / totaal) * 100))}%` }} />
        </div>
      )}
      {melding && (
        <p className={`flex items-center gap-2 text-sm ${melding.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {melding.ok ? <Check className="h-4 w-4" strokeWidth={2} /> : <AlertCircle className="h-4 w-4" strokeWidth={2} />}
          {melding.tekst}
        </p>
      )}
    </div>
  );
}

// ── Knop met bevestiging ────────────────────────────────────────────────

export function BevestigKnop({
  vraag,
  children,
  className,
}: {
  vraag: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(vraag)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

// ── Offerte opstellen ───────────────────────────────────────────────────

export type OfferteStandaard = {
  titel: string;
  uren: number;
  categorie: Categorie;
  taal: Taal;
  naam: string;
  bedrijf: string;
  adres: string;
  btw: string;
  werf: string;
  merken: string[];
  stelsel: Project["stelsel"];
  leverdatum: string | null;
};

export function OfferteFormulier({ projectId, std }: { projectId: string; std: OfferteStandaard }) {
  const [open, setOpen] = useState(false);
  const [uren, setUren] = useState(String(std.uren).replace(".", ","));
  const [categorie, setCategorie] = useState<Categorie>(std.categorie);
  const [taal, setTaal] = useState<Taal>(std.taal);
  const [extra, setExtra] = useState<{ label: string; bedrag: string }[]>([]);
  const [korting, setKorting] = useState("");
  const [btw, setBtw] = useState(std.btw);
  const [intro, setIntro] = useState<string | null>(null); // null = automatisch

  const getal = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const u = Math.max(getal(uren), MINIMUM_UREN);
  const tarief = UURTARIEF_CENT[categorie];
  const autoIntro = useMemo(
    () =>
      introOfferte(taal, {
        titel: std.titel,
        werf: std.werf,
        merken: std.merken,
        stelsel: std.stelsel,
        leverdatum: std.leverdatum,
        uren: u,
        tariefCent: tarief,
        categorie,
      }),
    [taal, std, u, tarief, categorie],
  );
  const model = Math.round(u * tarief);
  const extraCent = extra.reduce((t, e) => t + (e.label.trim() ? Math.max(0, Math.round(getal(e.bedrag) * 100)) : 0), 0);
  const kortingCent = Math.abs(Math.round(getal(korting) * 100));
  const excl = Math.max(0, model + extraCent - kortingCent);
  const verlegd = /^[A-Z]{2}/i.test(btw.trim()) && !/^BE/i.test(btw.trim());

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Offerte opstellen
      </button>
    );
  }

  return (
    <form action={maakOfferte} className="space-y-4 rounded-xl border bg-background p-4">
      <input type="hidden" name="id" value={projectId} />
      <div className="flex items-center justify-between">
        <p className="font-medium">Nieuwe offerte</p>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-muted hover:bg-card-hover" aria-label="Sluiten">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted sm:col-span-2">
          Titel
          <input name="titel" defaultValue={std.titel} maxLength={200} className={INVOER} />
        </label>
        <label className="text-xs text-muted">
          Uren (min. {MINIMUM_UREN})
          <input name="uren" value={uren} onChange={(e) => setUren(e.target.value)} inputMode="decimal" className={INVOER} />
        </label>
        <label className="text-xs text-muted">
          Tarief
          <select name="categorie" value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)} className={INVOER}>
            {(Object.keys(UURTARIEF_CENT) as Categorie[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_LABEL[c].nl} — {euro(UURTARIEF_CENT[c])}/u
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Taal van de offerte
          <select name="taal" value={taal} onChange={(e) => setTaal(e.target.value as Taal)} className={INVOER}>
            {TALEN.map((t) => (
              <option key={t} value={t}>
                {TAAL_NAAM[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Geldigheid
          <select name="geldig" defaultValue="14" className={INVOER}>
            <option value="14">14 dagen</option>
            <option value="30">30 dagen</option>
          </select>
        </label>
      </div>

      <div>
        <p className="text-xs text-muted">Extra lijnen (optioneel, excl. btw)</p>
        <div className="mt-1 space-y-2">
          {extra.map((e, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="extra_label"
                value={e.label}
                onChange={(ev) => setExtra((x) => x.map((y, j) => (j === i ? { ...y, label: ev.target.value } : y)))}
                placeholder="Omschrijving"
                maxLength={200}
                className={`${INVOER} mt-0 flex-1`}
              />
              <input
                name="extra_bedrag"
                value={e.bedrag}
                onChange={(ev) => setExtra((x) => x.map((y, j) => (j === i ? { ...y, bedrag: ev.target.value } : y)))}
                placeholder="€"
                inputMode="decimal"
                className={`${INVOER} mt-0 w-28`}
              />
              <button type="button" onClick={() => setExtra((x) => x.filter((_, j) => j !== i))} className="rounded-lg border px-2 text-muted hover:bg-card-hover" aria-label="Lijn verwijderen">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ))}
          {extra.length < 6 && (
            <button type="button" onClick={() => setExtra((x) => [...x, { label: "", bedrag: "" }])} className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
              + Lijn toevoegen
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Korting (€, excl. btw)
          <input name="korting" value={korting} onChange={(e) => setKorting(e.target.value)} inputMode="decimal" placeholder="0" className={INVOER} />
        </label>
        <label className="text-xs text-muted">
          Btw-nummer klant (VIES-controle bij opslaan)
          <input name="vat_number" value={btw} onChange={(e) => setBtw(e.target.value)} maxLength={32} className={INVOER} />
        </label>
        <label className="text-xs text-muted">
          Naam contactpersoon
          <input name="client_name" defaultValue={std.naam} maxLength={160} className={INVOER} />
        </label>
        <label className="text-xs text-muted">
          Bedrijf
          <input name="client_company" defaultValue={std.bedrijf} maxLength={160} className={INVOER} />
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Facturatieadres
          <input name="client_address" defaultValue={std.adres} maxLength={400} className={INVOER} />
        </label>
      </div>

      <label className="block text-xs text-muted">
        <span className="flex items-center justify-between">
          Begeleidende tekst voor de klant ({TAAL_NAAM[taal]})
          {intro !== null && (
            <button type="button" onClick={() => setIntro(null)} className="text-accent hover:underline">
              opnieuw genereren
            </button>
          )}
        </span>
        <textarea name="intro" rows={10} value={intro ?? autoIntro} onChange={(e) => setIntro(e.target.value)} className={INVOER} />
      </label>
      <label className="block text-xs text-muted">
        Interne notitie (niet zichtbaar voor de klant)
        <input name="internal_note" maxLength={4000} className={INVOER} />
      </label>

      <div className="space-y-1 rounded-xl border p-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>
            Modelleerwerk {String(u).replace(".", ",")} u × {euro(tarief)}
          </span>
          <span className="font-mono">{euro(model)}</span>
        </div>
        {extraCent > 0 && (
          <div className="flex justify-between text-muted">
            <span>Extra lijnen</span>
            <span className="font-mono">{euro(extraCent)}</span>
          </div>
        )}
        {kortingCent > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Korting</span>
            <span className="font-mono">− {euro(kortingCent)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1.5 font-semibold">
          <span>Totaal excl. btw</span>
          <span className="font-mono">{euro(excl)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>{verlegd ? "Incl. btw (verlegd als VIES geldig is)" : "Incl. 21% btw"}</span>
          <span className="font-mono">{euro(verlegd ? excl : Math.round(excl * 1.21))}</span>
        </div>
      </div>

      <SubmitButton
        pendingLabel="Versturen…"
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Offerte opslaan &amp; klant verwittigen
      </SubmitButton>
    </form>
  );
}
