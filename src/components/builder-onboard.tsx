"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { TOUR_STEPS } from "@/lib/tour-steps";

// Korte, optionele onboarding in de builder: dezelfde 10 stappen als de
// marketing-tour. Eerste bezoek = automatisch; daarna een klein "?"-
// knopje om 'm opnieuw te openen. Altijd te sluiten/over te slaan.
const KEY = "vm_builder_onboard";

export function BuilderOnboard() {
  const path = usePathname() || "";
  const seg = path.split("/")[1];
  const locale: Locale = isValidLocale(seg) ? seg : "nl";
  const steps = TOUR_STEPS[locale];

  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "done") setOpen(true);
    } catch {
      /* geen storage → toon één keer deze sessie */
      setOpen(true);
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(KEY, "done");
    } catch {
      /* negeren */
    }
    setOpen(false);
  };

  const L =
    locale === "fr"
      ? { skip: "Passer", prev: "Précédent", next: "Suivant", done: "C'est parti", help: "Aide" }
      : locale === "en"
        ? { skip: "Skip", prev: "Back", next: "Next", done: "Let's go", help: "Help" }
        : { skip: "Overslaan", prev: "Vorige", next: "Volgende", done: "Aan de slag", help: "Uitleg" };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setI(0);
          setOpen(true);
        }}
        aria-label={L.help}
        title={L.help}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background shadow-lg transition-transform hover:scale-105"
      >
        ?
      </button>
    );
  }

  const s = steps[i];
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={finish}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={finish}
          aria-label="Sluiten"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          ✕
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            {s.n}
          </span>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {i + 1} / {steps.length}
          </p>
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          {s.t}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>

        <div className="mt-5 flex flex-wrap items-center gap-1">
          {steps.map((st, k) => (
            <span
              key={st.n}
              className={`h-1.5 rounded-full transition-all ${
                k === i
                  ? "w-5 bg-accent"
                  : k < i
                    ? "w-1.5 bg-accent/50"
                    : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            {L.skip}
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI((x) => x - 1)}
                className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover"
              >
                {L.prev}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? finish() : setI((x) => x + 1))}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              {last ? L.done : L.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
