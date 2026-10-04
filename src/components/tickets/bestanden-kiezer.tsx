"use client";

// Bestandskiezer voor ticketbijlagen (klantportaal en admin): kiezen, slepen
// of een schermafdruk plakken (Ctrl+V). Gecontroleerd: de ouder bewaart de
// lijst (`bestanden`) en laadt zelf op (tickets-upload.ts); dit onderdeel
// controleert type, grootte en aantal en toont de voortgang.

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { AlertCircle, FileUp, Paperclip, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { BIJLAGE_ACCEPT, BIJLAGE_MAX_AANTAL, bestandGrootte, bijlageFout } from "@/lib/tickets";
import { BESTANDEN_T, FOUT_TEKST } from "@/lib/tickets-teksten";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EXT_VAN_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
};

function stempel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Een geplakte schermafdruk heet meestal 'image.png': geef hem een herkenbare naam. */
function hernoemGeplakt(f: File, i: number, nu: Date): File {
  const generiek = !f.name || /^image\.(png|jpe?g|gif|webp|heic)$/i.test(f.name);
  if (!generiek) return f;
  const ext = EXT_VAN_TYPE[f.type] ?? "png";
  return new File([f], `screenshot-${stempel(nu)}${i ? `-${i + 1}` : ""}.${ext}`, {
    type: f.type || "image/png",
    lastModified: nu.getTime(),
  });
}

function heeftBestanden(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

const GEEN_TEKSTVELD = new Set(["file", "checkbox", "radio", "button", "submit", "reset", "image", "range", "color", "hidden"]);

/** Veld waar een gewone plak tekst invoegt (tekstvak, invoerveld, bewerkbare inhoud). */
function isTekstveld(el: EventTarget | null): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !GEEN_TEKSTVELD.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

export function BestandenKiezer({
  locale,
  bestanden,
  onChange,
  disabled = false,
  voortgang = null,
  id,
}: {
  locale: Locale;
  bestanden: File[];
  onChange(files: File[]): void;
  disabled?: boolean;
  /** Voortgang van het opladen als fractie 0..1; null = niet bezig. */
  voortgang?: number | null;
  id?: string;
}) {
  const T = BESTANDEN_T[locale];
  const grootte = (b: number) => bestandGrootte(b, locale);
  const eigenId = useId();
  const invoerId = id ?? `bijlagen-${eigenId.replace(/:/g, "")}`;
  const uitlegId = `${invoerId}-uitleg`;
  const foutId = `${invoerId}-fout`;
  const invoer = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const [sleept, setSleept] = useState(false);
  // De melding hoort bij één toestand van de lijst: verandert de lijst
  // (verwijderen, verzonden en leeggemaakt), dan verdwijnt ze vanzelf.
  const [fout, setFout] = useState<{ tekst: string; voor: File[] } | null>(null);
  const zichtbareFout = fout && fout.voor === bestanden ? fout.tekst : null;
  const vol = bestanden.length >= BIJLAGE_MAX_AANTAL;

  function voegToe(lijst: File[]) {
    if (disabled || lijst.length === 0) return;
    const nieuw = [...bestanden];
    let melding: string | null = null;
    for (const f of lijst) {
      if (nieuw.some((x) => x.name === f.name && x.size === f.size)) continue; // dubbel: stil negeren
      const fo = bijlageFout(f.name, f.size);
      if (fo) {
        melding = fo === "bijlage_groot" ? T.teGroot(f.name) : fo === "bijlage_type" ? T.type(f.name) : FOUT_TEKST[fo][locale];
        continue;
      }
      if (nieuw.length >= BIJLAGE_MAX_AANTAL) {
        melding = T.maximum(BIJLAGE_MAX_AANTAL);
        break;
      }
      nieuw.push(f);
    }
    const veranderd = nieuw.length !== bestanden.length;
    setFout(melding ? { tekst: melding, voor: veranderd ? nieuw : bestanden } : null);
    if (veranderd) onChange(nieuw);
  }

  function verwijder(i: number) {
    if (disabled) return;
    onChange(bestanden.filter((_, j) => j !== i));
  }

  // Plakken (Ctrl+V) van een schermafdruk of gekopieerd bestand, waar ook in
  // hetzelfde formulier (zonder formulier: enkel in de zone of op de pagina
  // zelf). Gewone tekst plakken blijft ongemoeid: Excel, Word en Outlook
  // leggen naast de tekst ook een afbeelding van de selectie op het klembord —
  // in een tekstveld krijgt dat veld dan de tekst en wordt er niets bijgevoegd.
  const opPlakken = useEffectEvent((e: ClipboardEvent) => {
    if (disabled) return;
    const klembord = e.clipboardData;
    const files = Array.from(klembord?.files ?? []);
    if (files.length === 0) return;
    const doel = e.target instanceof Node ? e.target : null;
    if (isTekstveld(doel) && (klembord?.getData("text/plain") ?? "").trim() !== "") return;
    const vorm = zone.current?.closest("form") ?? null;
    const hier =
      !doel ||
      doel === document.body ||
      doel === document.documentElement ||
      !!zone.current?.contains(doel) ||
      (!!vorm && vorm.contains(doel));
    if (!hier) return;
    e.preventDefault();
    const nu = new Date();
    voegToe(files.map((f, i) => hernoemGeplakt(f, i, nu)));
  });

  useEffect(() => {
    const luister = (e: ClipboardEvent) => opPlakken(e);
    document.addEventListener("paste", luister);
    return () => document.removeEventListener("paste", luister);
  }, []);

  const totaal = bestanden.reduce((t, f) => t + f.size, 0);
  const bezig = voortgang != null && bestanden.length > 0;
  const fractie = Math.max(0, Math.min(1, voortgang ?? 0));
  const pct = Math.round(fractie * 100);

  return (
    <div>
      <label htmlFor={invoerId} className="block text-sm font-medium">
        {T.label}
      </label>
      <p id={uitlegId} className="mt-1 text-xs leading-relaxed text-muted">
        {T.uitleg}
      </p>
      <input
        ref={invoer}
        id={invoerId}
        type="file"
        multiple
        accept={BIJLAGE_ACCEPT}
        disabled={disabled || vol}
        tabIndex={-1}
        aria-describedby={zichtbareFout ? `${uitlegId} ${foutId}` : uitlegId}
        className="sr-only"
        onChange={(e) => {
          // Meteen kopiëren: een FileList is "live" en wordt leeg zodra het veld gereset wordt.
          const lijst = Array.from(e.target.files ?? []);
          e.target.value = "";
          voegToe(lijst);
        }}
      />
      <div
        ref={zone}
        onDragEnter={(e) => {
          if (!heeftBestanden(e)) return;
          e.preventDefault();
          if (!disabled) setSleept(true);
        }}
        onDragOver={(e) => {
          if (!heeftBestanden(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(e) => {
          if (!zone.current?.contains(e.relatedTarget as Node | null)) setSleept(false);
        }}
        onDrop={(e) => {
          if (!heeftBestanden(e)) return;
          e.preventDefault();
          setSleept(false);
          voegToe(Array.from(e.dataTransfer.files));
        }}
        className={`mt-2 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
          sleept ? "border-accent bg-accent/5" : "border-border"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <FileUp className="h-7 w-7 text-accent" strokeWidth={1.5} aria-hidden />
        <p className="hidden text-sm text-muted sm:block">{T.sleep}</p>
        <button
          type="button"
          onClick={() => invoer.current?.click()}
          disabled={disabled || vol}
          aria-describedby={uitlegId}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
        >
          <Paperclip className="h-4 w-4" strokeWidth={2} aria-hidden />
          {T.kies}
        </button>
        {vol && <p className="text-xs text-muted">{T.maximum(BIJLAGE_MAX_AANTAL)}</p>}
      </div>

      {zichtbareFout && (
        <p id={foutId} role="alert" className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{zichtbareFout}</span>
        </p>
      )}

      {bestanden.length > 0 && (
        <ul className="mt-3 divide-y rounded-xl border" aria-label={T.gekozen(bestanden.length)}>
          {bestanden.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 py-1.5 pl-3 pr-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate" title={f.name}>
                {f.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted">{grootte(f.size)}</span>
              <button
                type="button"
                onClick={() => verwijder(i)}
                disabled={disabled}
                aria-label={T.verwijderen(f.name)}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-40 ${FOCUS}`}
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {bezig && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={T.opladen(grootte(totaal * fractie), grootte(totaal))}
            className="h-2 overflow-hidden rounded-full bg-card-hover"
          >
            <div className="h-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{T.opladen(grootte(totaal * fractie), grootte(totaal))}</p>
        </div>
      )}
    </div>
  );
}
