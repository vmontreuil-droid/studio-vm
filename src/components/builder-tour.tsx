"use client";

import { useState } from "react";

type Step = { n: string; t: string; d: string };

// Interactieve rondleiding: hover/klik een stap en de overeenkomstige
// zone in de gestileerde builder-mock licht op (en omgekeerd).
export function BuilderTour({
  title,
  lead,
  steps,
}: {
  title: string;
  lead: string;
  steps: Step[];
}) {
  const [act, setAct] = useState<string>("1");
  const on = (n: string) => act === n;
  const zone = (n: string): React.CSSProperties =>
    on(n)
      ? {
          outline: "2px solid var(--accent)",
          outlineOffset: 2,
          boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent)",
          borderRadius: 8,
          transition: "all .2s",
        }
      : { transition: "all .2s" };

  const Mark = ({ n, cls }: { n: string; cls: string }) => (
    <button
      type="button"
      onMouseEnter={() => setAct(n)}
      onClick={() => setAct(n)}
      className={`absolute z-10 flex items-center justify-center rounded-full border-2 border-background font-bold text-background shadow transition-transform ${cls} ${
        on(n) ? "scale-125" : "scale-100"
      }`}
      style={{
        background: on(n) ? "var(--accent)" : "color-mix(in srgb, var(--accent) 70%, #000)",
        height: 24,
        width: 24,
        fontSize: 12,
      }}
      aria-label={`stap ${n}`}
    >
      {n}
    </button>
  );

  return (
    <section className="border-b">
      <div className="w-full px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
            {title}
          </h2>
          <p className="mt-3 text-muted">{lead}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          {/* Mock */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center gap-1.5 border-b bg-background px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-mono text-[11px] text-muted">
                  builder · jouw-zaak.be
                </span>
              </div>
              <div className="grid grid-cols-[34%_1fr]">
                <div className="relative space-y-2 border-r p-3">
                  <div className="absolute right-3 top-3">
                    <Mark n="1" cls="" />
                  </div>
                  <div style={zone("1")} className="space-y-2 p-1">
                    <div className="h-2 w-2/3 rounded bg-foreground/15" />
                    <div className="h-7 rounded-lg bg-accent/15" />
                    <div className="h-7 rounded-lg bg-foreground/10" />
                    <div className="h-7 rounded-lg bg-foreground/10" />
                  </div>
                  <div style={zone("5")} className="space-y-1 p-1">
                    <div className="h-2 w-1/2 rounded bg-foreground/15" />
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-4 rounded bg-foreground/10" />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -right-3 bottom-8">
                    <Mark n="5" cls="" />
                  </div>
                </div>
                <div className="relative">
                  <div
                    style={zone("3")}
                    className="relative flex h-32 items-center justify-center bg-gradient-to-br from-accent/25 to-foreground/10"
                  >
                    <div className="text-center">
                      <div className="mx-auto h-2 w-16 rounded bg-foreground/30" />
                      <div className="mx-auto mt-2 h-4 w-28 rounded bg-foreground/40" />
                      <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-accent/70" />
                    </div>
                    <div className="absolute left-3 top-3">
                      <Mark n="3" cls="" />
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Mark n="4" cls="" />
                    </div>
                  </div>
                  <div style={zone("2")} className="relative p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-lg border p-2">
                          <div className="h-8 rounded bg-foreground/10" />
                          <div className="mt-1.5 h-1.5 w-3/4 rounded bg-foreground/20" />
                          <div className="mt-1 h-1.5 w-full rounded bg-foreground/10" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute -left-3 -top-2">
                      <Mark n="2" cls="" />
                    </div>
                    <div className="absolute -right-3 bottom-2">
                      <Mark n="6" cls="" />
                    </div>
                  </div>
                  <div
                    style={zone("7")}
                    className="flex items-center justify-between border-t px-3 py-2"
                  >
                    <span className="font-mono text-[10px] text-muted">
                      ✓ bewaard
                    </span>
                    <span
                      style={zone("8")}
                      className="rounded-full bg-foreground px-3 py-1 text-[10px] font-medium text-background"
                    >
                      ➤
                    </span>
                    <div className="absolute -left-3">
                      <Mark n="7" cls="" />
                    </div>
                    <div className="absolute -right-3">
                      <Mark n="8" cls="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stappen */}
          <ol className="space-y-2.5">
            {steps.map((s) => (
              <li key={s.n}>
                <button
                  type="button"
                  onMouseEnter={() => setAct(s.n)}
                  onClick={() => setAct(s.n)}
                  className={`flex w-full gap-3 rounded-xl border p-4 text-left transition-colors ${
                    on(s.n)
                      ? "border-accent bg-accent/5"
                      : "bg-card hover:bg-card-hover"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform ${
                      on(s.n)
                        ? "scale-110 bg-accent text-background"
                        : "bg-foreground/10 text-foreground"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold tracking-tight">
                      {s.t}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {s.d}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
