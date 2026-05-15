"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type SectionKind =
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "gallery"
  | "contact";

type Theme = { slug: string; bg: string; fg: string; accent: string };

const themes: Theme[] = [
  { slug: "warm", bg: "#fafaf9", fg: "#1c1917", accent: "#b45309" },
  { slug: "cool", bg: "#f8fafc", fg: "#0f172a", accent: "#0ea5e9" },
  { slug: "bos", bg: "#f7faf6", fg: "#14271d", accent: "#15803d" },
  { slug: "noir", bg: "#0c0a09", fg: "#fafaf9", accent: "#f59e0b" },
];

const sectionKinds: SectionKind[] = [
  "hero",
  "features",
  "testimonials",
  "pricing",
  "gallery",
  "contact",
];

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    panelTheme: string;
    bizName: string;
    themeLabels: Record<string, string>;
    panelSections: string;
    sectionLabels: Record<SectionKind, string>;
    add: string;
    panelReady: string;
    readyText: string;
    sendPreview: string;
    mailSubject: (n: string) => string;
    mailBody: (n: string, theme: string, sections: string) => string;
    emptyPreview: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    preview: {
      welcome: string;
      tagline: string;
      discover: string;
      featuresTitle: string;
      feature: string;
      featureDesc: string;
      testiTitle: string;
      testi: { q: string; w: string }[];
      pricingTitle: string;
      tiers: { n: string; p: string }[];
      perMonth: string;
      galleryTitle: string;
      contactTitle: string;
      name: string;
      email: string;
      message: string;
      send: string;
    };
  }
> = {
  nl: {
    eyebrow: "Builder",
    title: "Bouw je eigen pagina, klik per klik.",
    intro:
      "Probeer eens. Kies een thema, voeg secties toe, herschik ze, en zie je site groeien. Klaar? Stuur je preview door en ik werk hem voor je uit.",
    panelTheme: "Naam + thema",
    bizName: "Zaak-naam",
    themeLabels: { warm: "Warm", cool: "Koel", bos: "Bos", noir: "Noir" },
    panelSections: "Secties",
    sectionLabels: { hero: "Hero", features: "Features", testimonials: "Testimonials", pricing: "Pricing", gallery: "Galerij", contact: "Contact" },
    add: "Voeg toe",
    panelReady: "Klaar?",
    readyText: "Stuur je preview door en ik bouw 'm voor je uit als echte site, met eigen content en admin.",
    sendPreview: "Stuur preview door",
    mailSubject: (n) => `Builder preview voor ${n}`,
    mailBody: (n, theme, sections) =>
      `Hoi Vincent,\n\nIk bouwde een preview op studio-vm.be/builder voor "${n}".\nThema: ${theme}\nSecties: ${sections}\n\nKan je een offerte maken?\n\nGroeten`,
    emptyPreview: "Begin met een sectie toe te voegen.",
    ctaTitle: "Liever ineens een echt design?",
    ctaText:
      "De builder is een speelgoed — leuk om te proberen, niet om je echte zaak op te laten draaien. Voor dat laatste zit je beter bij een Pro-pakket.",
    ctaButton: "Bekijk pakketten",
    preview: {
      welcome: "Welkom bij",
      tagline: "Een tagline die uitlegt wat je doet.",
      discover: "Ontdek meer",
      featuresTitle: "Wat je krijgt",
      feature: "Feature",
      featureDesc: "Een korte uitleg waarom dit nuttig is.",
      testiTitle: "Wat klanten zeggen",
      testi: [{ q: "Eindelijk een site die snel laadt.", w: "Sophie, restaurant" }, { q: "Mijn klanten vinden 't direct.", w: "Pieter, fotograaf" }],
      pricingTitle: "Tarieven",
      tiers: [{ n: "Basis", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/maand",
      galleryTitle: "Galerij",
      contactTitle: "Contact",
      name: "Je naam",
      email: "E-mail",
      message: "Je bericht",
      send: "Verstuur",
    },
  },
  fr: {
    eyebrow: "Builder",
    title: "Construisez votre page, clic par clic.",
    intro:
      "Essayez. Choisissez un thème, ajoutez des sections, réorganisez-les, et regardez votre site grandir. Prêt ? Envoyez votre preview et je le finalise pour vous.",
    panelTheme: "Nom + thème",
    bizName: "Nom de l'activité",
    themeLabels: { warm: "Chaud", cool: "Frais", bos: "Forêt", noir: "Noir" },
    panelSections: "Sections",
    sectionLabels: { hero: "Hero", features: "Atouts", testimonials: "Témoignages", pricing: "Tarifs", gallery: "Galerie", contact: "Contact" },
    add: "Ajouter",
    panelReady: "Prêt ?",
    readyText: "Envoyez votre preview et je le construis en vrai site, avec contenu propre et admin.",
    sendPreview: "Envoyer la preview",
    mailSubject: (n) => `Preview builder pour ${n}`,
    mailBody: (n, theme, sections) =>
      `Bonjour Vincent,\n\nJ'ai construit une preview sur studio-vm.be/builder pour "${n}".\nThème : ${theme}\nSections : ${sections}\n\nPouvez-vous faire un devis ?\n\nCordialement`,
    emptyPreview: "Commencez par ajouter une section.",
    ctaTitle: "Plutôt un vrai design directement ?",
    ctaText:
      "Le builder est un jouet — sympa à essayer, pas pour faire tourner votre vraie activité. Pour ça, un forfait Pro est plus indiqué.",
    ctaButton: "Voir les forfaits",
    preview: {
      welcome: "Bienvenue chez",
      tagline: "Une accroche qui explique ce que vous faites.",
      discover: "Découvrir",
      featuresTitle: "Ce que vous obtenez",
      feature: "Atout",
      featureDesc: "Une courte explication de l'utilité.",
      testiTitle: "Ce que disent les clients",
      testi: [{ q: "Enfin un site qui charge vite.", w: "Sophie, restaurant" }, { q: "Mes clients trouvent tout de suite.", w: "Pieter, photographe" }],
      pricingTitle: "Tarifs",
      tiers: [{ n: "Base", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/mois",
      galleryTitle: "Galerie",
      contactTitle: "Contact",
      name: "Votre nom",
      email: "E-mail",
      message: "Votre message",
      send: "Envoyer",
    },
  },
  en: {
    eyebrow: "Builder",
    title: "Build your own page, click by click.",
    intro:
      "Give it a try. Pick a theme, add sections, reorder them, and watch your site grow. Done? Send your preview and I'll finalize it for you.",
    panelTheme: "Name + theme",
    bizName: "Business name",
    themeLabels: { warm: "Warm", cool: "Cool", bos: "Forest", noir: "Noir" },
    panelSections: "Sections",
    sectionLabels: { hero: "Hero", features: "Features", testimonials: "Testimonials", pricing: "Pricing", gallery: "Gallery", contact: "Contact" },
    add: "Add",
    panelReady: "Done?",
    readyText: "Send your preview and I'll build it into a real site, with your own content and admin.",
    sendPreview: "Send preview",
    mailSubject: (n) => `Builder preview for ${n}`,
    mailBody: (n, theme, sections) =>
      `Hi Vincent,\n\nI built a preview on studio-vm.be/builder for "${n}".\nTheme: ${theme}\nSections: ${sections}\n\nCan you make a quote?\n\nBest`,
    emptyPreview: "Start by adding a section.",
    ctaTitle: "Rather a real design straight away?",
    ctaText:
      "The builder is a toy — fun to try, not to run your real business on. For that, a Pro package is the better fit.",
    ctaButton: "See packages",
    preview: {
      welcome: "Welcome to",
      tagline: "A tagline that explains what you do.",
      discover: "Discover more",
      featuresTitle: "What you get",
      feature: "Feature",
      featureDesc: "A short explanation of why this is useful.",
      testiTitle: "What clients say",
      testi: [{ q: "Finally a site that loads fast.", w: "Sophie, restaurant" }, { q: "My clients find it right away.", w: "Pieter, photographer" }],
      pricingTitle: "Pricing",
      tiers: [{ n: "Basic", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/month",
      galleryTitle: "Gallery",
      contactTitle: "Contact",
      name: "Your name",
      email: "Email",
      message: "Your message",
      send: "Send",
    },
  },
};

export default function BuilderPage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [sections, setSections] = useState<SectionKind[]>([
    "hero",
    "features",
    "contact",
  ]);
  const [businessName, setBusinessName] = useState(
    locale === "fr" ? "Mon Affaire" : locale === "en" ? "My Business" : "Mijn Zaak",
  );

  const addSection = (k: SectionKind) => setSections((s) => [...s, k]);
  const removeSection = (idx: number) =>
    setSections((s) => s.filter((_, i) => i !== idx));
  const moveSection = (idx: number, dir: -1 | 1) =>
    setSections((s) => {
      const next = [...s];
      const tgt = idx + dir;
      if (tgt < 0 || tgt >= next.length) return s;
      [next[idx], next[tgt]] = [next[tgt], next[idx]];
      return next;
    });

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{c.intro}</p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Panel icon={<Palette className="h-4 w-4" />} title={c.panelTheme}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.bizName}
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {themes.map((tm) => (
                  <button
                    key={tm.slug}
                    type="button"
                    onClick={() => setTheme(tm)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                      theme.slug === tm.slug
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-6 rounded-full border"
                      style={{
                        background: `linear-gradient(135deg, ${tm.bg} 0%, ${tm.bg} 50%, ${tm.accent} 50%, ${tm.accent} 100%)`,
                      }}
                    />
                    {c.themeLabels[tm.slug]}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel icon={<Layers className="h-4 w-4" />} title={c.panelSections}>
              <ul className="space-y-2">
                {sections.map((kind, i) => (
                  <li
                    key={`${kind}-${i}`}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <span>{c.sectionLabels[kind]}</span>
                    <div className="flex items-center gap-1 text-muted">
                      <button
                        type="button"
                        onClick={() => moveSection(i, -1)}
                        aria-label="↑"
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(i, 1)}
                        aria-label="↓"
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        disabled={i === sections.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(i)}
                        aria-label="x"
                        className="rounded p-1 hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {c.add}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sectionKinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addSection(k)}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                      {c.sectionLabels[k]}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel icon={null} title={c.panelReady}>
              <p className="text-xs text-muted">{c.readyText}</p>
              <a
                href={`mailto:info@studio-vm.be?subject=${encodeURIComponent(
                  c.mailSubject(businessName),
                )}&body=${encodeURIComponent(
                  c.mailBody(
                    businessName,
                    c.themeLabels[theme.slug],
                    sections.map((s) => c.sectionLabels[s]).join(", "),
                  ),
                )}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {c.sendPreview}
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
                  <p>{c.emptyPreview}</p>
                </div>
              ) : (
                sections.map((kind, i) => (
                  <PreviewSection
                    key={`${kind}-${i}`}
                    kind={kind}
                    theme={theme}
                    businessName={businessName}
                    p={c.preview}
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
            {c.ctaTitle}
          </h2>
          <p className="mt-3 text-muted">{c.ctaText}</p>
          <Link
            href={localePath(locale, "/pricing")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.ctaButton}
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

type Preview = (typeof T)[Locale]["preview"];

function PreviewSection({
  kind,
  theme,
  businessName,
  p,
}: {
  kind: SectionKind;
  theme: Theme;
  businessName: string;
  p: Preview;
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
            {p.welcome}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {businessName}
          </h2>
          <p className="mt-3 text-sm opacity-70" style={{ color: theme.fg }}>
            {p.tagline}
          </p>
          <button
            className="mt-6 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            {p.discover}
          </button>
        </div>
      );
    case "features":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            {p.featuresTitle}
          </h3>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4 text-xs" style={border}>
                <div
                  className="mb-2 h-6 w-6 rounded-full"
                  style={{ background: theme.accent, opacity: 0.2 }}
                />
                <p className="font-semibold">
                  {p.feature} {i}
                </p>
                <p className="mt-1 opacity-70">{p.featureDesc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "testimonials":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            {p.testiTitle}
          </h3>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {p.testi.map((t, i) => (
              <blockquote
                key={i}
                className="rounded-lg border p-4 text-xs"
                style={border}
              >
                <p>"{t.q}"</p>
                <footer className="mt-2 font-mono text-[10px] opacity-70">
                  — {t.w}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      );
    case "pricing":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            {p.pricingTitle}
          </h3>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {p.tiers.map((tier) => (
              <div
                key={tier.n}
                className="rounded-lg border p-4 text-center"
                style={border}
              >
                <p className="font-semibold">{tier.n}</p>
                <p className="mt-1 text-lg" style={accentText}>
                  {tier.p}
                </p>
                <p className="mt-1 opacity-60">{p.perMonth}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            {p.galleryTitle}
          </h3>
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
          <h3 className="text-center text-xl font-semibold tracking-tight">
            {p.contactTitle}
          </h3>
          <div className="mx-auto mt-6 max-w-sm space-y-2 text-xs">
            <input
              placeholder={p.name}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <input
              placeholder={p.email}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <textarea
              placeholder={p.message}
              rows={3}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <button
              className="w-full rounded-full px-4 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.bg }}
            >
              {p.send}
            </button>
          </div>
        </div>
      );
  }
}
