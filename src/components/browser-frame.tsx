"use client";

// Toont de échte voorpagina (screenshot) in een browser-frame. Klik =
// vergroten naar een grote, LIVE en bedienbare iframe van de échte site
// — de bezoeker blijft op studio-vm (geen weglink). iframe wordt pas
// geladen bij openen (snel + geen 6 iframes tegelijk).

import { useEffect, useState } from "react";
import { X, Maximize2 } from "lucide-react";

function hostOf(url: string | null): string {
  if (!url) return "voorbeeld.be";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

const LABEL: Record<string, { open: string; close: string }> = {
  nl: { open: "Klik om live te openen & te bedienen", close: "Sluiten" },
  fr: { open: "Cliquez pour ouvrir & utiliser en direct", close: "Fermer" },
  en: { open: "Click to open & use it live", close: "Close" },
};

function Chrome({
  host,
  accent,
  children,
}: {
  host: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
      <span className="h-3 w-3 rounded-full bg-red-400" />
      <span className="h-3 w-3 rounded-full bg-yellow-400" />
      <span className="h-3 w-3 rounded-full bg-green-400" />
      <span className="mx-auto flex items-center gap-2 rounded-full border bg-card px-4 py-1 font-mono text-xs text-muted">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        {host}
      </span>
      {children}
    </div>
  );
}

export function BrowserFrame({
  url,
  image,
  name,
  accent,
  locale = "nl",
}: {
  url: string | null;
  image?: string;
  name: string;
  accent: string;
  locale?: string;
}) {
  const host = hostOf(url);
  const [open, setOpen] = useState(false);
  const lbl = LABEL[locale] ?? LABEL.nl;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        disabled={!url}
        aria-label={lbl.open}
        className="group block w-full overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md disabled:cursor-default"
      >
        <Chrome host={host} accent={accent} />
        <div className="relative h-[460px] overflow-hidden sm:h-[620px]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={`${name} — echte voorpagina`}
              className="absolute inset-x-0 top-0 w-full transition-transform duration-[7000ms] ease-linear group-hover:-translate-y-[55%] motion-reduce:transition-none"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, #0c0a09))`,
              }}
            />
          )}
          {url && (
            <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent pb-6 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-black shadow-lg">
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
                {lbl.open}
              </span>
            </span>
          )}
        </div>
      </button>

      {open && url && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-black/80 p-2 backdrop-blur-sm sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Chrome host={host} accent={accent}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={lbl.close}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                {lbl.close}
              </button>
            </Chrome>
            <iframe
              src={url}
              title={`${name} — live`}
              className="h-full w-full flex-1 bg-white"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  );
}
