"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { RotateCcw, Check } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  { title: string; slow: string; fast: string; restart: string; done: string; note: string }
> = {
  nl: {
    title: "Zelfde inhoud, andere fundering",
    slow: "Typische WordPress-site",
    fast: "Studio VM-build",
    restart: "Opnieuw",
    done: "Klaar",
    note: "Indicatieve simulatie. Echte cijfers: PageSpeed 32 → 98 bij Cottage Waregem.",
  },
  fr: {
    title: "Même contenu, fondation différente",
    slow: "Site WordPress typique",
    fast: "Build Studio VM",
    restart: "Recommencer",
    done: "Prêt",
    note: "Simulation indicative. Chiffres réels : PageSpeed 32 → 98 chez Cottage Waregem.",
  },
  en: {
    title: "Same content, different foundation",
    slow: "Typical WordPress site",
    fast: "Studio VM build",
    restart: "Restart",
    done: "Done",
    note: "Indicative simulation. Real figures: PageSpeed 32 → 98 at Cottage Waregem.",
  },
};

export function LoadingRace() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];

  const [slow, setSlow] = useState(0);
  const [fast, setFast] = useState(0);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const SLOW_MS = 4500;
    const FAST_MS = 800;
    // Trage site: schokkerige, niet-lineaire vooruitgang (render-blocking gevoel).
    const step = (now: number) => {
      const e = now - startRef.current;
      const fp = Math.min(1, e / FAST_MS);
      setFast(fp * 100);
      const raw = Math.min(1, e / SLOW_MS);
      const jank =
        raw < 0.25
          ? raw * 0.6
          : raw < 0.45
            ? 0.15
            : raw < 0.7
              ? 0.15 + (raw - 0.45) * 1.4
              : raw < 0.85
                ? 0.5
                : 0.5 + (raw - 0.85) * 3.33;
      setSlow(Math.min(100, jank * 100));
      if (e < SLOW_MS) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setSlow(100);
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  const restart = () => {
    setSlow(0);
    setFast(0);
    setRunning(true);
    setTick((x) => x + 1);
  };

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {t.title}
        </p>
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          {t.restart}
        </button>
      </div>

      <Track
        label={t.slow}
        pct={slow}
        slow
        done={t.done}
        sec={(4.5 * (slow / 100)).toFixed(1)}
      />
      <div className="h-5" />
      <Track
        label={t.fast}
        pct={fast}
        slow={false}
        done={t.done}
        sec={(0.8 * (fast / 100)).toFixed(1)}
      />

      <p className="mt-6 font-mono text-[11px] text-muted">{t.note}</p>
    </div>
  );
}

function Track({
  label,
  pct,
  slow,
  done,
  sec,
}: {
  label: string;
  pct: number;
  slow: boolean;
  done: string;
  sec: string;
}) {
  const finished = pct >= 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-muted">
          {finished ? (
            <span className="inline-flex items-center gap-1 text-accent">
              <Check className="h-3 w-3" strokeWidth={3} />
              {done} · {sec}s
            </span>
          ) : (
            `${sec}s`
          )}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${pct}%`,
            background: slow
              ? finished
                ? "#9ca3af"
                : "#ef4444"
              : "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}
