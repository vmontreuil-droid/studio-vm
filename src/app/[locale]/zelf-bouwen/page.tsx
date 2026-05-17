import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, PenTool, Check } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  cta: string;
  stepsTitle: string;
  steps: { n: string; t: string; d: string }[];
  featTitle: string;
  feats: { t: string; d: string }[];
  forTitle: string;
  forText: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  endTitle: string;
  endText: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Zelf je website bouwen — Studio VM",
    metaDesc:
      "Bouw je volledige website zelf met de live builder van Studio VM: slepen, foto's, slides, kleuren, lettertypes. Stuur het door en ik werk het af.",
    eyebrow: "Zelf bouwen",
    title: "Bouw je website zelf — ik geef hem de finishing touch.",
    lead: "Geen ervaring nodig. Kies een sector, beantwoord drie vragen en je hebt een volledige startsite. Pas teksten aan, sleep foto's, kies kleuren en lettertypes — en stuur het naar Studio VM zodra je tevreden bent. Geen verplichting, je kan op elk toestel verder.",
    cta: "Open de builder",
    stepsTitle: "Hoe het werkt",
    steps: [
      { n: "01", t: "Kies je startpunt", d: "Beantwoord de mini-survey (sector, toon, pagina's) of lees je huidige site automatisch in. Je site staat meteen grof klaar." },
      { n: "02", t: "Maak het van jou", d: "Bewerk alle teksten ter plekke, sleep foto's in de hero en in elk blok, pas kleuren, achtergronden en lettertypes aan." },
      { n: "03", t: "Controleer", d: "De Klaar-assistent overloopt lege velden, links en tips in gewone taal — voor een eerste-keer-bouwer." },
      { n: "04", t: "Stuur door", d: "Eén klik naar Studio VM. Ik werk het professioneel af, zet het live en jij volgt alles in je portaal." },
    ],
    featTitle: "Alle toeters en bellen",
    feats: [
      { t: "Hero-slides", d: "Meerdere foto's met eigen tekst per slide, vrij versleepbaar, hoogte, kaart met blur, 6 overgangstypes en regelbare duur." },
      { t: "Vrije foto/tekst-laag", d: "Plaats op élk blok foto's of tekst, sleep ze overal naartoe en maak ze groter of kleiner." },
      { t: "Achtergronden", d: "30 tinten plus subtiele patronen (stippen, strepen, raster…) met eigen kleur en dekking per blok." },
      { t: "Typografie", d: "Veel lettertypes (in hun eigen stijl getoond), tekst-uitlijning en schaal." },
      { t: "Links", d: "Koppel knoppen aan een pagina, een sectie, een webadres — of maak meteen een nieuwe pagina." },
      { t: "Overal verder", d: "Automatisch bewaard op je account; hervat op gsm, tablet of laptop." },
    ],
    forTitle: "Voor wie?",
    forText:
      "Voor wie het zelf in handen wil nemen zonder technische kennis. Jij bepaalt de inhoud en de sfeer; ik zorg voor de professionele afwerking, snelheid, SEO en het live zetten. Het beste van twee werelden.",
    faqTitle: "Veelgestelde vragen",
    faq: [
      { q: "Moet ik iets installeren?", a: "Nee. Alles gebeurt in je browser, ook op gsm of tablet." },
      { q: "Kan ik later nog wijzigen?", a: "Ja. Je werkt in concepten, bewaart automatisch en stuurt door wanneer je tevreden bent." },
      { q: "Wat als ik vastloop?", a: "De Klaar-assistent geeft tips in gewone taal, en je kan het altijd half-af doorsturen — ik vul aan." },
      { q: "Kost dit extra?", a: "Nee, zelf bouwen is gratis. Je betaalt pas wanneer je een pakket vastlegt via de configurator." },
    ],
    endTitle: "Klaar om te beginnen?",
    endText: "Open de builder en zie binnen een minuut je eerste site staan.",
  },
  fr: {
    metaTitle: "Construisez votre site vous-même — Studio VM",
    metaDesc:
      "Construisez votre site avec le builder en direct de Studio VM : glisser-déposer, photos, slides, couleurs, polices. Envoyez-le, je le finalise.",
    eyebrow: "Construire",
    title: "Construisez votre site — je lui donne la touche finale.",
    lead: "Aucune expérience requise. Choisissez un secteur, répondez à trois questions et vous avez un site complet. Adaptez les textes, glissez des photos, choisissez couleurs et polices — puis envoyez-le à Studio VM. Sans engagement, reprenez sur n'importe quel appareil.",
    cta: "Ouvrir le builder",
    stepsTitle: "Comment ça marche",
    steps: [
      { n: "01", t: "Votre point de départ", d: "Répondez au mini-questionnaire (secteur, ton, pages) ou importez votre site actuel. La base est prête immédiatement." },
      { n: "02", t: "Rendez-le vôtre", d: "Modifiez les textes sur place, glissez des photos dans le hero et chaque bloc, ajustez couleurs, fonds et polices." },
      { n: "03", t: "Contrôlez", d: "L'assistant final passe en revue les champs vides, les liens et donne des conseils simples." },
      { n: "04", t: "Envoyez", d: "Un clic vers Studio VM. Je le finalise, le mets en ligne, vous suivez tout dans votre portail." },
    ],
    featTitle: "Toutes les options",
    feats: [
      { t: "Slides hero", d: "Plusieurs photos avec texte par slide, déplaçables, hauteur, carte avec flou, 6 transitions et durée réglable." },
      { t: "Couche photo/texte libre", d: "Ajoutez sur chaque bloc des photos ou du texte, déplacez-les partout, agrandissez/réduisez." },
      { t: "Arrière-plans", d: "30 nuances plus des motifs subtils (points, rayures, grille…) avec couleur et opacité par bloc." },
      { t: "Typographie", d: "De nombreuses polices (montrées dans leur style), alignement et échelle du texte." },
      { t: "Liens", d: "Liez les boutons à une page, une section, une adresse web — ou créez une nouvelle page." },
      { t: "Partout", d: "Enregistré sur votre compte ; reprenez sur mobile, tablette ou ordinateur." },
    ],
    forTitle: "Pour qui ?",
    forText:
      "Pour ceux qui veulent garder la main sans compétences techniques. Vous décidez le contenu et l'ambiance ; je m'occupe de la finition pro, la vitesse, le SEO et la mise en ligne.",
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Dois-je installer quelque chose ?", a: "Non. Tout se passe dans le navigateur, aussi sur mobile." },
      { q: "Puis-je modifier plus tard ?", a: "Oui. Vous travaillez en brouillons, enregistrés automatiquement." },
      { q: "Et si je bloque ?", a: "L'assistant donne des conseils simples, et vous pouvez envoyer même inachevé — je complète." },
      { q: "Est-ce payant ?", a: "Non, construire est gratuit. Vous payez seulement en validant un forfait via le configurateur." },
    ],
    endTitle: "Prêt à commencer ?",
    endText: "Ouvrez le builder et voyez votre première version en une minute.",
  },
  en: {
    metaTitle: "Build your own website — Studio VM",
    metaDesc:
      "Build your full website with Studio VM's live builder: drag & drop, photos, slides, colours, fonts. Send it over and I finish it.",
    eyebrow: "Build it",
    title: "Build your site yourself — I give it the finishing touch.",
    lead: "No experience needed. Pick a sector, answer three questions and you have a full starter site. Edit text, drag photos, choose colours and fonts — then send it to Studio VM when you're happy. No commitment, continue on any device.",
    cta: "Open the builder",
    stepsTitle: "How it works",
    steps: [
      { n: "01", t: "Your starting point", d: "Answer the mini-survey (sector, tone, pages) or import your current site. The draft is ready instantly." },
      { n: "02", t: "Make it yours", d: "Edit text in place, drag photos into the hero and any block, adjust colours, backgrounds and fonts." },
      { n: "03", t: "Check", d: "The almost-done assistant reviews empty fields, links and gives plain-language tips." },
      { n: "04", t: "Send it", d: "One click to Studio VM. I finish it professionally, take it live, you track it in your portal." },
    ],
    featTitle: "All the bells & whistles",
    feats: [
      { t: "Hero slides", d: "Multiple photos with per-slide text, freely draggable, height, card with blur, 6 transitions and adjustable timing." },
      { t: "Free photo/text layer", d: "Add photos or text to any block, drag them anywhere, resize them." },
      { t: "Backgrounds", d: "30 shades plus subtle patterns (dots, stripes, grid…) with own colour and opacity per block." },
      { t: "Typography", d: "Many fonts (shown in their own style), text alignment and scale." },
      { t: "Links", d: "Link buttons to a page, a section, a web address — or create a new page on the spot." },
      { t: "Anywhere", d: "Saved to your account; resume on phone, tablet or laptop." },
    ],
    forTitle: "Who is it for?",
    forText:
      "For anyone who wants to take the lead without technical skills. You decide content and feel; I handle the professional finish, speed, SEO and going live.",
    faqTitle: "Frequently asked",
    faq: [
      { q: "Do I need to install anything?", a: "No. It all runs in your browser, also on phone or tablet." },
      { q: "Can I change it later?", a: "Yes. You work in drafts, auto-saved, and send when happy." },
      { q: "What if I get stuck?", a: "The assistant gives plain-language tips, and you can send it half-finished — I complete it." },
      { q: "Does it cost extra?", a: "No, building is free. You only pay when you lock a package via the configurator." },
    ],
    endTitle: "Ready to start?",
    endText: "Open the builder and see your first version within a minute.",
  },
};

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

export default async function ZelfBouwenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const builder = localePath(locale, "/builder");

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
          <Link
            href={builder}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <PenTool className="h-4 w-4" strokeWidth={2} />
            {c.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.stepsTitle}
          </h2>
          <div className="space-y-6">
            {c.steps.map((s) => (
              <article
                key={s.n}
                className="flex gap-5 rounded-2xl border bg-card p-6 sm:p-8"
              >
                <span className="font-mono text-2xl font-semibold text-accent">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-muted">{s.d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.featTitle}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {c.feats.map((f) => (
              <div key={f.t} className="rounded-2xl border bg-card p-6">
                <p className="flex items-center gap-2 font-semibold tracking-tight">
                  <Check
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.5}
                  />
                  {f.t}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.forTitle}
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            {c.forText}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.faqTitle}
          </h2>
          <div className="space-y-4">
            {c.faq.map((q) => (
              <div key={q.q} className="rounded-2xl border bg-card p-6">
                <p className="font-semibold tracking-tight">{q.q}</p>
                <p className="mt-2 text-muted">{q.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.endTitle}
          </h2>
          <p className="mt-4 text-muted">{c.endText}</p>
          <Link
            href={builder}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <PenTool className="h-4 w-4" strokeWidth={2} />
            {c.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
