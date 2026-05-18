"use client";

import { useEffect, useRef, useState } from "react";

type Step = { n: string; t: string; d: string };

// Auto-spelende, geanimeerde rondleiding: de mock "bouwt zichzelf"
// op terwijl de stappen meelopen. Hover/klik pauzeert en springt.
export function BuilderTour({
  title,
  lead,
  steps,
}: {
  title: string;
  lead: string;
  steps: Step[];
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [closed, setClosed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cur = steps[i]?.n ?? "1";

  useEffect(() => {
    if (paused || steps.length < 2) return;
    const t = setInterval(
      () => setI((x) => (x + 1) % steps.length),
      2600,
    );
    return () => clearInterval(t);
  }, [paused, steps.length]);

  const on = (n: string) => cur === n;
  const glow = (n: string): React.CSSProperties =>
    on(n)
      ? {
          outline: "2px solid var(--accent)",
          outlineOffset: 2,
          boxShadow:
            "0 0 0 5px color-mix(in srgb, var(--accent) 22%, transparent)",
          borderRadius: 10,
          transform: "scale(1.015)",
          transition: "all .45s cubic-bezier(.2,.7,.2,1)",
        }
      : {
          transform: "scale(1)",
          transition: "all .45s cubic-bezier(.2,.7,.2,1)",
          opacity: 0.92,
        };

  const Mark = ({ n }: { n: string }) => (
    <button
      type="button"
      onMouseEnter={() => {
        setPaused(true);
        setI(steps.findIndex((s) => s.n === n));
      }}
      onClick={() => {
        setPaused(true);
        setI(steps.findIndex((s) => s.n === n));
      }}
      aria-label={`stap ${n}`}
      className="absolute z-10 flex items-center justify-center rounded-full border-2 border-background font-bold text-background"
      style={{
        height: 24,
        width: 24,
        fontSize: 12,
        background: on(n)
          ? "var(--accent)"
          : "color-mix(in srgb, var(--accent) 65%, #000)",
        transform: on(n) ? "scale(1.3)" : "scale(1)",
        transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
        boxShadow: on(n)
          ? "0 0 0 6px color-mix(in srgb, var(--accent) 30%, transparent)"
          : "none",
      }}
    >
      {n}
    </button>
  );

  const Bar = ({ w = "w-full", live = false }: { w?: string; live?: boolean }) => (
    <div
      className={`h-2 ${w} overflow-hidden rounded`}
      style={{ background: "color-mix(in srgb, currentColor 10%, transparent)" }}
    >
      {live && (
        <div
          className="h-full w-1/3 rounded"
          style={{
            background: "color-mix(in srgb, var(--accent) 45%, transparent)",
            animation: "svmShim 1.6s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );

  if (closed) {
    return (
      <section className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-6">
          <button
            type="button"
            onClick={() => {
              setClosed(false);
              setPaused(false);
            }}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            ▶ {title}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative border-b"
      ref={wrapRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        aria-label="Sluiten"
        onClick={() => setClosed(true)}
        className="absolute right-4 top-4 z-20 rounded-full border bg-background px-2.5 py-1 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      >
        ✕
      </button>
      <style>{`
        @keyframes svmShim{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}
        @keyframes svmPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
        @keyframes svmFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
            {title}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-muted sm:text-xl">
            {lead}
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_.7fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div className="flex items-center gap-1.5 border-b bg-background px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-mono text-[11px] text-muted">
                  builder · jouw-zaak.be
                </span>
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-accent">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animation: "svmPulse 1.2s ease-in-out infinite" }}
                  />
                  live
                </span>
              </div>
              <div className="grid grid-cols-[34%_1fr] text-foreground">
                <div className="relative space-y-2 border-r p-3">
                  <div className="absolute right-2 top-3">
                    <Mark n="1" />
                  </div>
                  <div style={glow("1")} className="space-y-2 p-1">
                    <Bar w="w-2/3" />
                    <div className="h-7 rounded-lg bg-accent/15" />
                    <div className="h-7 rounded-lg bg-foreground/10" />
                    <div className="h-7 rounded-lg bg-foreground/10" />
                  </div>
                  <div style={glow("5")} className="space-y-1 p-1">
                    <Bar w="w-1/2" />
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: 8 }).map((_, k) => (
                        <div
                          key={k}
                          className="h-4 rounded bg-foreground/10"
                          style={
                            on("5")
                              ? {
                                  animation: `svmFade .4s ease ${k * 60}ms both`,
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -right-3 bottom-7">
                    <Mark n="5" />
                  </div>
                </div>
                <div className="relative">
                  <div
                    style={glow("3")}
                    className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-accent/25 to-foreground/10"
                  >
                    {on("3") && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--accent) 20%, transparent) 50%, transparent 70%)",
                          animation: "svmShim 1.8s ease-in-out infinite",
                        }}
                      />
                    )}
                    <div className="relative text-center">
                      <div className="mx-auto h-2 w-16 rounded bg-foreground/30" />
                      <div className="mx-auto mt-2 h-4 w-28 rounded bg-foreground/45" />
                      <div
                        className="mx-auto mt-2 h-5 w-20 rounded-full bg-accent/80"
                        style={
                          on("3") || on("8")
                            ? {
                                animation:
                                  "svmPulse 1.2s ease-in-out infinite",
                              }
                            : undefined
                        }
                      />
                    </div>
                    <div className="absolute left-3 top-3">
                      <Mark n="3" />
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Mark n="4" />
                    </div>
                  </div>
                  <div style={glow("2")} className="relative p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 3 }).map((_, k) => (
                        <div
                          key={k}
                          className="rounded-lg border p-2"
                          style={
                            on("2")
                              ? { animation: `svmFade .45s ease ${k * 90}ms both` }
                              : undefined
                          }
                        >
                          <div className="h-8 rounded bg-foreground/10" />
                          <div className="mt-1.5 h-1.5 w-3/4 rounded bg-foreground/20" />
                          <div className="mt-1 h-1.5 w-full rounded bg-foreground/10" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute -left-3 -top-2">
                      <Mark n="2" />
                    </div>
                    <div className="absolute -right-3 bottom-2">
                      <Mark n="6" />
                    </div>
                  </div>
                  <div
                    style={glow("7")}
                    className="flex items-center justify-between border-t px-3 py-2"
                  >
                    <span
                      className="font-mono text-[10px] text-accent"
                      style={
                        on("7")
                          ? { animation: "svmPulse 1s ease-in-out infinite" }
                          : { color: "var(--muted)" }
                      }
                    >
                      ✓ bewaard
                    </span>
                    <span
                      style={glow("8")}
                      className="rounded-full bg-foreground px-3 py-1 text-[10px] font-medium text-background"
                    >
                      ➤
                    </span>
                    <div className="absolute -left-3">
                      <Mark n="7" />
                    </div>
                    <div className="absolute -right-3">
                      <Mark n="8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {steps.map((s, k) => (
                <button
                  key={s.n}
                  type="button"
                  aria-label={s.t}
                  onClick={() => {
                    setPaused(true);
                    setI(k);
                  }}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: k === i ? 22 : 7,
                    background:
                      k === i
                        ? "var(--accent)"
                        : "color-mix(in srgb, var(--muted) 45%, transparent)",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div
              key={cur}
              className="rounded-2xl border bg-card p-6"
              style={{ animation: "svmFade .4s ease both" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-background">
                  {cur}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  {steps[i]?.t}
                </h3>
              </div>
              <p className="mt-3 leading-relaxed text-muted">
                {steps[i]?.d}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">
                {paused ? "gepauzeerd · klik een stap" : "speelt automatisch af"}
              </p>
            </div>

            <ol className="mt-3 space-y-1.5">
              {steps.map((s, k) => (
                <li key={s.n}>
                  <button
                    type="button"
                    onMouseEnter={() => {
                      setPaused(true);
                      setI(k);
                    }}
                    onClick={() => {
                      setPaused(true);
                      setI(k);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      k === i
                        ? "border-accent bg-accent/5"
                        : "border-transparent hover:bg-card-hover"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        k === i
                          ? "bg-accent text-background"
                          : "bg-foreground/10 text-muted"
                      }`}
                    >
                      {s.n}
                    </span>
                    <span
                      className={k === i ? "font-medium" : "text-muted"}
                    >
                      {s.t}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
