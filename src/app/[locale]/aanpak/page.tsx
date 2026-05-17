import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Phase = {
  n: string;
  title: string;
  what: string;
  you: string;
  deliver: string;
  duration: string;
  risk: string;
};

type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  phasesTitle: string;
  phases: Phase[];
  labels: { what: string; you: string; deliver: string; duration: string; risk: string };
  principlesTitle: string;
  principles: { t: string; d: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Aanpak — Studio VM",
    metaDesc:
      "Hoe ik echt werk: zes fases, wat jij doet, wat je krijgt, hoe lang het duurt, en wat ik doe als het misloopt. Geen verrassingen.",
    eyebrow: "Aanpak",
    title: "Geen black box. Dit is precies hoe ik werk.",
    lead: "De meeste mensen zijn niet bang voor een website — ze zijn bang voor het proces: vage offertes, missende deadlines, een ontwikkelaar die verdwijnt. Hieronder elke fase, wat jij doet, en eerlijk: wat er kan mislopen en hoe ik dat opvang.",
    phasesTitle: "De zes fases",
    phases: [
      { n: "01", title: "Kennismaking", what: "Een vrijblijvend gesprek (digitaal of bij jou). Ik luister meer dan ik praat: wat heb je, wat wil je bereiken, wat is het budget en de tijdlijn.", you: "Vertel eerlijk over je zaak en je verwachtingen. Geen voorbereiding nodig.", deliver: "Een helder beeld of we een match zijn — en zo niet, eerlijk advies waar je wél terecht kan.", duration: "~45 min", risk: "Geen risico: dit is gratis en bindt je tot niets." },
      { n: "02", title: "Samenstellen + vastleggen", what: "Je stelt je pakket samen in de configurator en ziet meteen je exacte vaste prijs — geen sterretjes. Je legt vast met 30% aanbetaling (via Mollie).", you: "Kies pakket en onderhoud; bij twijfel kijken we het samen na.", deliver: "Een vaste prijs en een vastgelegde scope na de aanbetaling.", duration: "meteen", risk: "Te dure scope? Je past je samenstelling gewoon aan tot het past." },
      { n: "03", title: "Design", what: "Geen statische mockups die er nooit zo uitzien. Een eerste klikbare versie op een staging-omgeving, iteratief verfijnd met jouw input.", you: "Klik erdoor, geef feedback. Je hoeft geen designer te zijn — 'dit voelt niet goed' is bruikbare input.", deliver: "Een werkende, klikbare versie op je eigen staging-URL.", duration: "enkele dagen", risk: "Smaakverschil is normaal. We werken in rondes; het pakket bepaalt hoeveel rondes inbegrepen zijn." },
      { n: "04", title: "Development", what: "De echte bouw: site + admin + integraties. Tussentijdse demo's zodat je niet vier weken in het ongewisse zit.", you: "Lever content aan (teksten, foto's) en test tussentijds op staging. Hoe sneller jouw input, hoe sneller de oplevering.", deliver: "Een complete, geteste site op staging — door jou zelf te testen.", duration: "1–2 weken", risk: "Vertraging door ontbrekende content schuift de deadline evenredig — daarom plannen we content-aanlevering expliciet in." },
      { n: "05", title: "Lancering", what: "Geen sprong in het diepe. Soft launch: redirects live, sitemap ingediend, ranking gemonitord. Bij migraties: geen seconde downtime.", you: "Eén laatste akkoord. Daarna gaat het live op jouw domein.", deliver: "Live site, oude URL's permanent doorverwezen, monitoring actief.", duration: "1 dag", risk: "Iets mis na launch? De eerste 30 dagen los ik bugs gratis op." },
      { n: "06", title: "Nazorg", what: "Een site is niet 'af' bij lancering. 30 dagen gratis bug-fix, daarna loopt je onderhoudsabonnement (Care/Plus/Scale/Partner) — hosting, beveiliging, updates en support, verplicht vanaf maand 1.", you: "Kies het abonnementsniveau dat past; je kan later zelf opgraden in je portaal.", deliver: "Een werkende site, de code in jouw GitHub-repo, en een lopend onderhoudsabonnement.", duration: "doorlopend (abonnement vanaf maand 1)", risk: "Geen lock-in op je code: de code is van jou. Het abonnement zegt je op met 1 maand opzeg." },
    ],
    labels: { what: "Wat er gebeurt", you: "Wat jij doet", deliver: "Wat je krijgt", duration: "Duur", risk: "Wat als het misloopt" },
    principlesTitle: "Onderliggende principes",
    principles: [
      { t: "Schriftelijk boven mondeling", d: "Wat we afspreken staat op papier. Niet uit wantrouwen — uit respect voor ieders geheugen." },
      { t: "Demo's boven beloftes", d: "Je ziet werkende software op elke stap, niet enkel een factuur en een belofte." },
      { t: "Eerlijk over risico's", d: "Ik benoem vooraf wat kan mislopen. Een verrassing achteraf is altijd duurder dan een gesprek vooraf." },
    ],
    ctaTitle: "Klinkt dit als een proces waar je gerust in bent?",
    ctaText: "Stel je pakket samen en zie meteen je exacte vaste prijs. Geen offerte-druk, geen verkooppraatje.",
    ctaButton: "Stel je pakket samen",
  },
  fr: {
    metaTitle: "Approche — Studio VM",
    metaDesc:
      "Comment je travaille vraiment : six phases, ce que vous faites, ce que vous obtenez, la durée, et ce que je fais si ça dérape. Pas de surprises.",
    eyebrow: "Approche",
    title: "Pas de boîte noire. Voici exactement comment je travaille.",
    lead: "La plupart des gens n'ont pas peur d'un site — ils ont peur du processus : devis flous, délais ratés, un développeur qui disparaît. Ci-dessous chaque phase, ce que vous faites, et honnêtement : ce qui peut déraper et comment je le gère.",
    phasesTitle: "Les six phases",
    phases: [
      { n: "01", title: "Rencontre", what: "Un entretien sans engagement (en ligne ou chez vous). J'écoute plus que je ne parle : ce que vous avez, ce que vous voulez atteindre, le budget et le délai.", you: "Parlez honnêtement de votre activité et de vos attentes. Aucune préparation nécessaire.", deliver: "Une vision claire si on est compatibles — sinon, un conseil honnête vers qui s'adresser.", duration: "~45 min", risk: "Aucun risque : c'est gratuit et ne vous engage à rien." },
      { n: "02", title: "Composer + verrouiller", what: "Vous composez votre forfait dans le configurateur et voyez votre prix fixe exact — sans astérisques. Vous verrouillez avec 30 % d'acompte (via Mollie).", you: "Choisissez forfait et maintenance ; en cas de doute, on regarde ensemble.", deliver: "Un prix fixe et un scope verrouillé après l'acompte.", duration: "immédiat", risk: "Scope trop cher ? Vous ajustez simplement votre composition jusqu'à ce que ça colle." },
      { n: "03", title: "Design", what: "Pas de maquettes statiques jamais conformes. Une première version cliquable sur un staging, affinée itérativement avec vos retours.", you: "Cliquez, donnez votre avis. Pas besoin d'être designer — « ça ne va pas » est un retour utile.", deliver: "Une version fonctionnelle et cliquable sur votre propre URL de staging.", duration: "quelques jours", risk: "Les différences de goût sont normales. On travaille en rondes ; le forfait définit combien sont incluses." },
      { n: "04", title: "Développement", what: "La vraie construction : site + admin + intégrations. Démos intermédiaires pour ne pas rester quatre semaines dans le flou.", you: "Fournissez le contenu (textes, photos) et testez sur staging. Plus votre input est rapide, plus la livraison l'est.", deliver: "Un site complet et testé sur staging — à tester vous-même.", duration: "1–2 semaines", risk: "Un retard dû à du contenu manquant décale le délai proportionnellement — d'où la planification explicite de l'apport de contenu." },
      { n: "05", title: "Lancement", what: "Pas de saut dans le vide. Soft launch : redirections en ligne, sitemap soumis, classement monitoré. Pour les migrations : zéro downtime.", you: "Un dernier accord. Ensuite ça passe en ligne sur votre domaine.", deliver: "Site en ligne, anciennes URL redirigées en permanence, monitoring actif.", duration: "1 jour", risk: "Un souci après le lancement ? Les 30 premiers jours, je corrige les bugs gratuitement." },
      { n: "06", title: "Suivi", what: "Un site n'est pas 'fini' au lancement. 30 jours de correction gratuite, ensuite votre abonnement de maintenance (Care/Plus/Scale/Partner) — hébergement, sécurité, mises à jour et support, obligatoire dès le 1er mois.", you: "Choisissez le niveau d'abonnement qui convient ; vous pouvez évoluer plus tard via votre espace.", deliver: "Un site qui marche, le code dans votre dépôt GitHub, et un abonnement de maintenance actif.", duration: "continu (abonnement dès le 1er mois)", risk: "Pas de lock-in sur le code : le code est à vous. L'abonnement se résilie avec 1 mois de préavis." },
    ],
    labels: { what: "Ce qui se passe", you: "Ce que vous faites", deliver: "Ce que vous obtenez", duration: "Durée", risk: "Si ça dérape" },
    principlesTitle: "Principes sous-jacents",
    principles: [
      { t: "Écrit plutôt qu'oral", d: "Ce qu'on convient est sur papier. Pas par méfiance — par respect pour la mémoire de chacun." },
      { t: "Démos plutôt que promesses", d: "Vous voyez un logiciel fonctionnel à chaque étape, pas seulement une facture et une promesse." },
      { t: "Honnête sur les risques", d: "Je nomme à l'avance ce qui peut déraper. Une surprise après coup coûte toujours plus cher qu'une conversation avant." },
    ],
    ctaTitle: "Ça ressemble à un processus qui vous rassure ?",
    ctaText: "Composez votre forfait et voyez votre prix fixe exact immédiatement. Sans pression, sans baratin commercial.",
    ctaButton: "Composez votre forfait",
  },
  en: {
    metaTitle: "Approach — Studio VM",
    metaDesc:
      "How I really work: six phases, what you do, what you get, how long it takes, and what I do if it goes wrong. No surprises.",
    eyebrow: "Approach",
    title: "No black box. This is exactly how I work.",
    lead: "Most people aren't afraid of a website — they're afraid of the process: vague quotes, missed deadlines, a developer who vanishes. Below each phase, what you do, and honestly: what can go wrong and how I handle it.",
    phasesTitle: "The six phases",
    phases: [
      { n: "01", title: "First meeting", what: "A no-obligation chat (online or at your place). I listen more than I talk: what you have, what you want to achieve, the budget and timeline.", you: "Speak honestly about your business and expectations. No preparation needed.", deliver: "A clear picture of whether we're a match — and if not, honest advice on where to go.", duration: "~45 min", risk: "No risk: it's free and binds you to nothing." },
      { n: "02", title: "Compose + lock in", what: "You compose your package in the configurator and see your exact fixed price — no asterisks. You lock in with a 30% deposit (via Mollie).", you: "Pick package and maintenance; if in doubt, we review it together.", deliver: "A fixed price and a locked scope after the deposit.", duration: "immediate", risk: "Scope too expensive? You simply adjust your composition until it fits." },
      { n: "03", title: "Design", what: "No static mockups that never look like that. A first clickable version on a staging environment, iteratively refined with your input.", you: "Click through, give feedback. You don't need to be a designer — 'this feels off' is usable input.", deliver: "A working, clickable version on your own staging URL.", duration: "a few days", risk: "Taste differences are normal. We work in rounds; the package defines how many are included." },
      { n: "04", title: "Development", what: "The real build: site + admin + integrations. Interim demos so you're not in the dark for four weeks.", you: "Provide content (text, photos) and test on staging. The faster your input, the faster delivery.", deliver: "A complete, tested site on staging — for you to test yourself.", duration: "1–2 weeks", risk: "Delay due to missing content shifts the deadline proportionally — which is why we plan content delivery explicitly." },
      { n: "05", title: "Launch", what: "No leap in the dark. Soft launch: redirects live, sitemap submitted, ranking monitored. For migrations: zero downtime.", you: "One final approval. Then it goes live on your domain.", deliver: "Live site, old URLs permanently redirected, monitoring active.", duration: "1 day", risk: "Something wrong after launch? The first 30 days I fix bugs for free." },
      { n: "06", title: "Aftercare", what: "A site isn't 'done' at launch. 30 days free bug fixing, then your maintenance subscription (Care/Plus/Scale/Partner) — hosting, security, updates and support, required from month 1.", you: "Pick the subscription level that fits; you can upgrade later from your portal.", deliver: "A working site, the code in your GitHub repo, and an active maintenance subscription.", duration: "ongoing (subscription from month 1)", risk: "No lock-in on your code: the code is yours. The subscription cancels with 1 month notice." },
    ],
    labels: { what: "What happens", you: "What you do", deliver: "What you get", duration: "Duration", risk: "If it goes wrong" },
    principlesTitle: "Underlying principles",
    principles: [
      { t: "Written over spoken", d: "What we agree is on paper. Not out of distrust — out of respect for everyone's memory." },
      { t: "Demos over promises", d: "You see working software at every step, not just an invoice and a promise." },
      { t: "Honest about risks", d: "I name up front what can go wrong. A surprise afterwards always costs more than a conversation before." },
    ],
    ctaTitle: "Sound like a process you can be confident in?",
    ctaText: "Build your package and see your exact fixed price right away. No quote pressure, no sales pitch.",
    ctaButton: "Build your package",
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

export default async function AanpakPage({
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
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.phasesTitle}
          </h2>
          <div className="space-y-6">
            {c.phases.map((p) => (
              <article
                key={p.n}
                className="rounded-2xl border bg-card p-6 sm:p-8"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-2xl font-semibold text-accent">
                    {p.n}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {p.title}
                  </h3>
                  <span className="ml-auto font-mono text-xs text-muted">
                    {p.duration}
                  </span>
                </div>
                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Row label={c.labels.what} value={p.what} />
                  <Row label={c.labels.you} value={p.you} />
                  <Row label={c.labels.deliver} value={p.deliver} />
                  <Row label={c.labels.risk} value={p.risk} accent />
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-10 font-mono text-xs uppercase tracking-widest text-accent">
            {c.principlesTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {c.principles.map((pr) => (
              <div key={pr.t} className="rounded-2xl border bg-background p-6">
                <h3 className="font-semibold tracking-tight">{pr.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {pr.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{c.ctaText}</p>
          <Link
            href={localePath(locale, "/offerte")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt
        className={`font-mono text-[10px] uppercase tracking-widest ${
          accent ? "text-accent" : "text-muted"
        }`}
      >
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-foreground/90">
        {value}
      </dd>
    </div>
  );
}
