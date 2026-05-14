"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Send,
  ArrowRight,
  Palette,
  Layers,
} from "lucide-react";

type SectionKind =
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "gallery"
  | "contact";

type Theme = {
  slug: string;
  label: string;
  bg: string;
  fg: string;
  accent: string;
};

const themes: Theme[] = [
  { slug: "warm", label: "Warm", bg: "#fafaf9", fg: "#1c1917", accent: "#b45309" },
  { slug: "cool", label: "Koel", bg: "#f8fafc", fg: "#0f172a", accent: "#0ea5e9" },
  { slug: "bos", label: "Bos", bg: "#f7faf6", fg: "#14271d", accent: "#15803d" },
  { slug: "noir", label: "Noir", bg: "#0c0a09", fg: "#fafaf9", accent: "#f59e0b" },
];

type SectionDef = {
  kind: SectionKind;
  label: string;
  description: string;
};

const allSections: SectionDef[] = [
  {
    kind: "hero",
    label: "Hero",
    description: "Een grote titel + CTA bovenaan de pagina.",
  },
  {
    kind: "features",
    label: "Features",
    description: "Een grid met 3-6 voordelen van je product.",
  },
  {
    kind: "testimonials",
    label: "Testimonials",
    description: "Klantcitaten met naam en foto.",
  },
  {
    kind: "pricing",
    label: "Pricing",
    description: "Twee of drie prijspakketten naast elkaar.",
  },
  {
    kind: "gallery",
    label: "Galerij",
    description: "Foto-galerij met lightbox.",
  },
  {
    kind: "contact",
    label: "Contact",
    description: "Een contactformulier met naam, e-mail, bericht.",
  },
];

export default function BuilderPage() {
  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [sections, setSections] = useState<SectionKind[]>([
    "hero",
    "features",
    "contact",
  ]);
  const [businessName, setBusinessName] = useState("Mijn Zaak");

  const addSection = (kind: SectionKind) => setSections((s) => [...s, kind]);
  const removeSection = (idx: number) =>
    setSections((s) => s.filter((_, i) => i !== idx));
  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections((s) => {
      const next = [...s];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Builder
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Bouw je eigen pagina, klik per klik.
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Probeer eens. Kies een thema, voeg secties toe, sleep ze in volgorde, en zie
            je site groeien. Klaar? Stuur je preview door en ik werk hem voor je uit.
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Panel icon={<Palette className="h-4 w-4" />} title="Naam + thema">
              <label
                htmlFor="biz"
                className="block font-mono text-[10px] uppercase tracking-widest text-muted"
              >
                Zaak-naam
              </label>
              <input
                id="biz"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                      theme.slug === t.slug
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-6 rounded-full border"
                      style={{
                        background: `linear-gradient(135deg, ${t.bg} 0%, ${t.bg} 50%, ${t.accent} 50%, ${t.accent} 100%)`,
                      }}
                    />
                    {t.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel icon={<Layers className="h-4 w-4" />} title="Secties">
              <ul className="space-y-2">
                {sections.map((kind, i) => {
                  const def = allSections.find((s) => s.kind === kind);
                  if (!def) return null;
                  return (
                    <li
                      key={`${kind}-${i}`}
                      className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      <span>{def.label}</span>
                      <div className="flex items-center gap-1 text-muted">
                        <button
                          type="button"
                          onClick={() => moveSection(i, -1)}
                          aria-label="Omhoog"
                          className="rounded p-1 hover:text-foreground disabled:opacity-30"
                          disabled={i === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(i, 1)}
                          aria-label="Omlaag"
                          className="rounded p-1 hover:text-foreground disabled:opacity-30"
                          disabled={i === sections.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(i)}
                          aria-label="Verwijder"
                          className="rounded p-1 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 border-t pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Voeg toe
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allSections.map((s) => (
                    <button
                      key={s.kind}
                      type="button"
                      onClick={() => addSection(s.kind)}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel icon={null} title="Klaar?">
              <p className="text-xs text-muted">
                Stuur je preview door en ik bouw 'm voor je uit als echte site, met
                eigen content en admin.
              </p>
              <a
                href={`mailto:info@studio-vm.be?subject=${encodeURIComponent(
                  `Builder preview voor ${businessName}`,
                )}&body=${encodeURIComponent(
                  `Hoi Vincent,\n\nIk bouwde een preview op studio-vm.be/builder voor "${businessName}".\nThema: ${theme.label}\nSecties: ${sections.join(", ")}\n\nKan je een offerte maken?\n\nGroeten`,
                )}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                Stuur preview door
              </a>
            </Panel>
          </aside>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 font-mono text-xs text-muted">
                {businessName.toLowerCase().replace(/\s+/g, "-")}.be
              </span>
            </div>
            <div
              style={{ background: theme.bg, color: theme.fg }}
              className="min-h-[600px]"
            >
              {sections.length === 0 ? (
                <div className="flex h-[600px] flex-col items-center justify-center gap-3 p-8 text-center text-muted">
                  <Layers className="h-12 w-12" strokeWidth={1} />
                  <p>Begin met een sectie toe te voegen.</p>
                </div>
              ) : (
                sections.map((kind, i) => (
                  <PreviewSection
                    key={`${kind}-${i}`}
                    kind={kind}
                    theme={theme}
                    businessName={businessName}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Liever ineens een echt design?
          </h2>
          <p className="mt-3 text-muted">
            De builder is een speelgoed — leuk om te proberen, niet om je echte zaak op te
            laten draaien. Voor dat laatste zit je beter bij een Pro-pakket.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Bekijk pakketten
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function PreviewSection({
  kind,
  theme,
  businessName,
}: {
  kind: SectionKind;
  theme: Theme;
  businessName: string;
}) {
  const accentText = { color: theme.accent };
  const border = { borderColor: `${theme.fg}1a` };

  switch (kind) {
    case "hero":
      return (
        <div className="px-8 py-14 text-center">
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={accentText}
          >
            Welkom bij
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{businessName}</h2>
          <p
            className="mt-3 text-sm opacity-70"
            style={{ color: theme.fg }}
          >
            Een tagline die uitlegt wat je doet.
          </p>
          <button
            className="mt-6 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            Ontdek meer
          </button>
        </div>
      );
    case "features":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            Wat je krijgt
          </h3>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4 text-xs" style={border}>
                <div
                  className="mb-2 h-6 w-6 rounded-full"
                  style={{ background: theme.accent, opacity: 0.2 }}
                />
                <p className="font-semibold">Feature {i}</p>
                <p className="mt-1 opacity-70">Een korte uitleg waarom dit nuttig is.</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "testimonials":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            Wat klanten zeggen
          </h3>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              { q: "Eindelijk een site die snel laadt.", w: "Sophie, restaurant" },
              { q: "Mijn klanten vinden 't direct.", w: "Pieter, fotograaf" },
            ].map((t, i) => (
              <blockquote
                key={i}
                className="rounded-lg border p-4 text-xs"
                style={border}
              >
                <p>"{t.q}"</p>
                <footer className="mt-2 font-mono text-[10px] opacity-70">— {t.w}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      );
    case "pricing":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">Tarieven</h3>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {[
              { n: "Basis", p: "€19" },
              { n: "Pro", p: "€49" },
              { n: "Plus", p: "€99" },
            ].map((tier) => (
              <div key={tier.n} className="rounded-lg border p-4 text-center" style={border}>
                <p className="font-semibold">{tier.n}</p>
                <p className="mt-1 text-lg" style={accentText}>
                  {tier.p}
                </p>
                <p className="mt-1 opacity-60">/maand</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">Galerij</h3>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{
                  background: `linear-gradient(${i * 45}deg, ${theme.accent}33, ${theme.fg}11)`,
                }}
              />
            ))}
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">Contact</h3>
          <div className="mx-auto mt-6 max-w-sm space-y-2 text-xs">
            <input
              placeholder="Je naam"
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <input
              placeholder="E-mail"
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <textarea
              placeholder="Je bericht"
              rows={3}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <button
              className="w-full rounded-full px-4 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.bg }}
            >
              Verstuur
            </button>
          </div>
        </div>
      );
  }
}
