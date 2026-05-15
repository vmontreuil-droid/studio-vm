import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ArrowRight, Check, X } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  logoTitle: string;
  logoNote: string;
  download: string;
  colorsTitle: string;
  typoTitle: string;
  typoBody: string;
  bioTitle: string;
  bioOneLine: string;
  bioShort: string;
  bioLong: string;
  rulesTitle: string;
  dos: string[];
  donts: string[];
  contactTitle: string;
  contactText: string;
  contactButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Pers & brand kit — Studio VM",
    metaDesc:
      "Logo's, kleuren, typografie en bio van Studio VM (Vincent Montreuil). Vrij te gebruiken voor pers en partners.",
    eyebrow: "Pers & brand",
    title: "Brand kit.",
    lead: "Schrijf je over Studio VM, of werk je met me samen? Hier vind je het logo, de kleuren, de typografie en een bio — klaar voor gebruik, geen toestemming nodig.",
    logoTitle: "Logo",
    logoNote:
      "Het woordmerk is <vm/> — een zelfsluitende tag. Hou de accent-kleur op de punthaken. Niet uitrekken, herkleuren of in een kader stoppen.",
    download: "Download SVG",
    colorsTitle: "Kleuren",
    typoTitle: "Typografie",
    typoBody:
      "Geist Sans voor tekst, Geist Mono voor labels, code en accenten. Beide gratis (Vercel). Headings: tracking-tight, semibold.",
    bioTitle: "Bio",
    bioOneLine: "Vincent Montreuil — freelance webdeveloper, West-Vlaanderen.",
    bioShort:
      "Studio VM is de eenmanszaak van Vincent Montreuil. Hij bouwt snelle, tweetalige websites en webshops voor lokale ondernemers met Next.js en Supabase.",
    bioLong:
      "Studio VM is de eenmanszaak van Vincent Montreuil, freelance webdeveloper in West-Vlaanderen. Hij vervangt trage WordPress- en Squarespace-sites door snelle, eigen builds in Next.js + Supabase — met een admin die de klant zelf begrijpt, code die van de klant blijft, en geen maandelijkse plugin-kosten. Klanten zijn restaurants, ateliers, fotografen en KMO's in Vlaanderen en Brussel.",
    rulesTitle: "Wel & niet",
    dos: [
      "Gebruik het logo op voldoende contrast",
      "Behoud de accent-kleur op de < en />",
      "Noem de naam 'Studio VM' (niet 'StudioVM' of 'studio vm')",
    ],
    donts: [
      "Niet uitrekken, kantelen of vervormen",
      "Geen schaduw, gloed of kader toevoegen",
      "Niet herkleuren buiten het palet hieronder",
    ],
    contactTitle: "Pers-aanvraag of meer materiaal?",
    contactText:
      "Nodig je hi-res beeld, een quote of een interview? Stuur een bericht — ik antwoord meestal dezelfde dag.",
    contactButton: "Neem contact op",
  },
  fr: {
    metaTitle: "Presse & brand kit — Studio VM",
    metaDesc:
      "Logos, couleurs, typographie et bio de Studio VM (Vincent Montreuil). Libre d'utilisation pour la presse et les partenaires.",
    eyebrow: "Presse & brand",
    title: "Brand kit.",
    lead: "Vous écrivez sur Studio VM, ou vous collaborez avec moi ? Voici le logo, les couleurs, la typographie et une bio — prêts à l'emploi, sans autorisation.",
    logoTitle: "Logo",
    logoNote:
      "Le logotype est <vm/> — une balise auto-fermante. Gardez la couleur accent sur les chevrons. Ne pas étirer, recolorer ou encadrer.",
    download: "Télécharger le SVG",
    colorsTitle: "Couleurs",
    typoTitle: "Typographie",
    typoBody:
      "Geist Sans pour le texte, Geist Mono pour labels, code et accents. Les deux gratuits (Vercel). Titres : tracking serré, semibold.",
    bioTitle: "Bio",
    bioOneLine: "Vincent Montreuil — développeur web freelance, Flandre-Occidentale.",
    bioShort:
      "Studio VM est l'entreprise individuelle de Vincent Montreuil. Il construit des sites et boutiques rapides et bilingues pour les entrepreneurs locaux avec Next.js et Supabase.",
    bioLong:
      "Studio VM est l'entreprise individuelle de Vincent Montreuil, développeur web freelance en Flandre-Occidentale. Il remplace les sites WordPress et Squarespace lents par des builds propres et rapides en Next.js + Supabase — avec un admin que le client comprend, un code qui lui reste, et sans frais mensuels de plugins. Clients : restaurants, ateliers, photographes et PME en Flandre et à Bruxelles.",
    rulesTitle: "À faire & à éviter",
    dos: [
      "Utiliser le logo sur un contraste suffisant",
      "Garder la couleur accent sur < et />",
      "Nommer 'Studio VM' (pas 'StudioVM' ni 'studio vm')",
    ],
    donts: [
      "Ne pas étirer, incliner ou déformer",
      "Pas d'ombre, lueur ou cadre",
      "Ne pas recolorer hors de la palette ci-dessous",
    ],
    contactTitle: "Demande presse ou plus de matériel ?",
    contactText:
      "Besoin d'images haute résolution, d'une citation ou d'une interview ? Envoyez un message — je réponds en général le jour même.",
    contactButton: "Prendre contact",
  },
  en: {
    metaTitle: "Press & brand kit — Studio VM",
    metaDesc:
      "Logos, colours, typography and bio of Studio VM (Vincent Montreuil). Free to use for press and partners.",
    eyebrow: "Press & brand",
    title: "Brand kit.",
    lead: "Writing about Studio VM, or working with me? Here's the logo, colours, typography and a bio — ready to use, no permission needed.",
    logoTitle: "Logo",
    logoNote:
      "The wordmark is <vm/> — a self-closing tag. Keep the accent colour on the brackets. Don't stretch, recolour or box it.",
    download: "Download SVG",
    colorsTitle: "Colours",
    typoTitle: "Typography",
    typoBody:
      "Geist Sans for text, Geist Mono for labels, code and accents. Both free (Vercel). Headings: tight tracking, semibold.",
    bioTitle: "Bio",
    bioOneLine: "Vincent Montreuil — freelance web developer, West Flanders.",
    bioShort:
      "Studio VM is the sole proprietorship of Vincent Montreuil. He builds fast, multilingual websites and webshops for local entrepreneurs with Next.js and Supabase.",
    bioLong:
      "Studio VM is the sole proprietorship of Vincent Montreuil, freelance web developer in West Flanders. He replaces slow WordPress and Squarespace sites with fast, own builds in Next.js + Supabase — with an admin the client understands, code that stays theirs, and no monthly plugin costs. Clients are restaurants, studios, photographers and SMEs in Flanders and Brussels.",
    rulesTitle: "Do & don't",
    dos: [
      "Use the logo on sufficient contrast",
      "Keep the accent colour on < and />",
      "Call it 'Studio VM' (not 'StudioVM' or 'studio vm')",
    ],
    donts: [
      "Don't stretch, tilt or distort",
      "No shadow, glow or box",
      "Don't recolour outside the palette below",
    ],
    contactTitle: "Press request or more material?",
    contactText:
      "Need hi-res imagery, a quote or an interview? Send a message — I usually reply the same day.",
    contactButton: "Get in touch",
  },
};

const colors = [
  { name: "Accent (licht)", hex: "#b45309" },
  { name: "Accent (donker)", hex: "#f59e0b" },
  { name: "Voorgrond", hex: "#1c1917" },
  { name: "Achtergrond", hex: "#fafaf9" },
  { name: "Donker", hex: "#0c0a09" },
];

function Wordmark({ dark }: { dark?: boolean }) {
  return (
    <div
      className="flex h-28 items-center justify-center rounded-2xl border font-mono text-3xl font-semibold tracking-tight"
      style={{
        background: dark ? "#0c0a09" : "#fafaf9",
        color: dark ? "#fafaf9" : "#1c1917",
        borderColor: dark ? "#292524" : "#e7e5e4",
      }}
    >
      <span style={{ color: dark ? "#f59e0b" : "#b45309" }}>&lt;</span>vm
      <span style={{ color: dark ? "#f59e0b" : "#b45309" }}>/&gt;</span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const c = copy[locale];
  return { title: c.metaTitle, description: c.metaDesc };
}

export default async function PersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.lead}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.logoTitle}
            </h2>
            <a
              href="/studio-vm-logo.svg"
              download
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:bg-card-hover"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              {c.download}
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Wordmark />
            <Wordmark dark />
          </div>
          <p className="mt-4 text-sm text-muted">{c.logoNote}</p>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.colorsTitle}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map((col) => (
              <div key={col.hex} className="rounded-2xl border bg-background p-3">
                <div
                  className="h-16 rounded-lg border"
                  style={{ background: col.hex }}
                />
                <p className="mt-3 text-xs font-medium">{col.name}</p>
                <p className="font-mono text-[11px] text-muted">{col.hex}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
            {c.typoTitle}
          </h2>
          <p className="text-lg leading-relaxed">{c.typoBody}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-sans text-2xl font-semibold tracking-tight">
                Geist Sans
              </p>
              <p className="mt-1 font-sans text-sm text-muted">
                Aa Bb Cc — 0123456789
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-mono text-2xl font-semibold tracking-tight">
                Geist Mono
              </p>
              <p className="mt-1 font-mono text-sm text-muted">
                Aa Bb Cc — 0123456789
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
            {c.bioTitle}
          </h2>
          {[
            { tag: "1 regel", text: c.bioOneLine },
            { tag: "Kort", text: c.bioShort },
            { tag: "Lang", text: c.bioLong },
          ].map((b) => (
            <div key={b.tag} className="rounded-2xl border bg-background p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {b.tag}
              </p>
              <p className="mt-2 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.rulesTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <ul className="space-y-3">
              {c.dos.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
                    strokeWidth={2.5}
                  />
                  {d}
                </li>
              ))}
            </ul>
            <ul className="space-y-3">
              {c.donts.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm">
                  <X
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                    strokeWidth={2.5}
                  />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.contactTitle}
          </h2>
          <p className="mt-4 text-muted">{c.contactText}</p>
          <Link
            href={localePath(locale, "/#contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.contactButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
