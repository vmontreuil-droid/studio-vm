import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Term = { term: string; plain: string };
type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  terms: Term[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Woordenboek — Studio VM",
    metaDesc:
      "Webjargon in mensentaal. Next.js, Supabase, PWA, SEO, hreflang — uitgelegd zonder technische pretentie.",
    eyebrow: "Woordenboek",
    title: "Jargon, in mensentaal.",
    lead: "Je hoeft niets van dit alles te kennen om met mij te werken — dat is net het punt. Maar als je nieuwsgierig bent waar de termen op de site over gaan: hier is alles in gewone taal.",
    terms: [
      { term: "Next.js", plain: "Het 'framework' waarmee ik bouw. Vergelijk het met de constructiemethode van een huis: het bepaalt hoe sterk en snel het eindresultaat is. Het zorgt voor snelle, server-gerenderde pagina's." },
      { term: "React", plain: "De bouwstenen waarmee de pagina's in elkaar zitten. Maakt interactieve onderdelen (zoals een winkelmand of zoekvenster) mogelijk." },
      { term: "Supabase", plain: "De database + login achter je site. Hier zitten je producten, klanten, bestellingen — veilig opgeslagen in Europa." },
      { term: "Tailwind", plain: "De manier waarop ik de site vormgeef. Zorgt voor consistente, snelle styling zonder rommelige CSS." },
      { term: "Vercel", plain: "Waar je site 'woont' (de hosting). Wereldwijd snel, automatische backups, SSL inbegrepen." },
      { term: "PWA", plain: "Progressive Web App. Een website die je als app op je telefoon kan installeren, die offline werkt — zonder App Store." },
      { term: "SSR", plain: "Server-Side Rendering. De pagina is al volledig opgebouwd vóór ze bij de bezoeker (en Google) aankomt. Sneller en beter voor SEO." },
      { term: "SEO", plain: "Search Engine Optimization. Alles wat ervoor zorgt dat Google je site goed begrijpt en toont in zoekresultaten." },
      { term: "hreflang", plain: "Een signaal aan Google: 'deze pagina bestaat ook in het Frans/Engels'. Zo verschijn je in zoekresultaten in elke taal apart." },
      { term: "301-redirect", plain: "Een permanente 'verhuiskaart'. Oude link → nieuwe pagina, zodat bezoekers én je Google-ranking meeverhuizen bij een migratie." },
      { term: "CDN", plain: "Content Delivery Network. Kopieën van je site staan wereldwijd, dichtbij elke bezoeker. Daarom laadt het overal snel." },
      { term: "Open Graph", plain: "De mooie preview-kaart die verschijnt als iemand je link deelt op social media of WhatsApp." },
      { term: "JSON-LD", plain: "Onzichtbare 'uitleg' in je pagina waarmee Google rich results toont — sterren, breadcrumbs, FAQ in de zoekresultaten." },
      { term: "Mollie / Stripe", plain: "De betaaldiensten voor een webshop. Mollie is sterk lokaal (Bancontact, lagere fees), Stripe internationaal." },
      { term: "Webhook", plain: "Een automatisch seintje tussen systemen. Bv.: betaling gelukt → bestelling bevestigd. Zonder dat iemand op een knop moet duwen." },
      { term: "Repo / GitHub", plain: "De plek waar de broncode van je site bewaard wordt. Jij krijgt toegang — de code is van jou, geen gijzeling." },
    ],
    ctaTitle: "Nog een term die je niet snapt?",
    ctaText: "Vraag het gerust. Ik leg liever iets twee keer uit dan dat je een offerte tekent die je niet begrijpt.",
    ctaButton: "Stel je vraag",
  },
  fr: {
    metaTitle: "Glossaire — Studio VM",
    metaDesc:
      "Le jargon web en langage humain. Next.js, Supabase, PWA, SEO, hreflang — expliqués sans prétention technique.",
    eyebrow: "Glossaire",
    title: "Le jargon, en langage humain.",
    lead: "Vous n'avez besoin de rien connaître de tout ça pour travailler avec moi — c'est justement le but. Mais si vous êtes curieux de ce que signifient les termes du site : voici tout en langage simple.",
    terms: [
      { term: "Next.js", plain: "Le 'framework' avec lequel je construis. Comme la méthode de construction d'une maison : il détermine la solidité et la rapidité du résultat. Il assure des pages rapides, server-rendered." },
      { term: "React", plain: "Les briques qui composent les pages. Rend possibles les éléments interactifs (panier, fenêtre de recherche)." },
      { term: "Supabase", plain: "La base de données + connexion derrière votre site. Vos produits, clients, commandes — stockés en sécurité en Europe." },
      { term: "Tailwind", plain: "La façon dont je mets en forme le site. Style cohérent et rapide, sans CSS désordonné." },
      { term: "Vercel", plain: "Où votre site 'habite' (l'hébergement). Rapide mondialement, backups automatiques, SSL inclus." },
      { term: "PWA", plain: "Progressive Web App. Un site que vous pouvez installer comme app sur votre téléphone, qui marche hors ligne — sans App Store." },
      { term: "SSR", plain: "Server-Side Rendering. La page est déjà entièrement construite avant d'arriver chez le visiteur (et Google). Plus rapide et meilleur pour le SEO." },
      { term: "SEO", plain: "Search Engine Optimization. Tout ce qui fait que Google comprend bien votre site et l'affiche dans les résultats." },
      { term: "hreflang", plain: "Un signal à Google : 'cette page existe aussi en NL/EN'. Vous apparaissez ainsi dans les résultats dans chaque langue." },
      { term: "Redirection 301", plain: "Un 'avis de déménagement' permanent. Ancien lien → nouvelle page, pour que visiteurs et classement Google déménagent lors d'une migration." },
      { term: "CDN", plain: "Content Delivery Network. Des copies de votre site dans le monde entier, proches de chaque visiteur. D'où la rapidité partout." },
      { term: "Open Graph", plain: "La belle carte d'aperçu qui apparaît quand on partage votre lien sur les réseaux ou WhatsApp." },
      { term: "JSON-LD", plain: "Une 'explication' invisible dans votre page pour que Google affiche des rich results — étoiles, fil d'Ariane, FAQ." },
      { term: "Mollie / Stripe", plain: "Les services de paiement d'une boutique. Mollie est fort en local (Bancontact, frais plus bas), Stripe à l'international." },
      { term: "Webhook", plain: "Un signal automatique entre systèmes. Ex. : paiement réussi → commande confirmée. Sans que personne ne clique." },
      { term: "Repo / GitHub", plain: "L'endroit où le code source de votre site est conservé. Vous y avez accès — le code est à vous, pas de prise d'otage." },
    ],
    ctaTitle: "Un autre terme que vous ne comprenez pas ?",
    ctaText: "Demandez sans hésiter. Je préfère expliquer deux fois plutôt que vous fassiez signer un devis incompris.",
    ctaButton: "Posez votre question",
  },
  en: {
    metaTitle: "Glossary — Studio VM",
    metaDesc:
      "Web jargon in plain language. Next.js, Supabase, PWA, SEO, hreflang — explained without technical pretension.",
    eyebrow: "Glossary",
    title: "Jargon, in plain language.",
    lead: "You don't need to know any of this to work with me — that's exactly the point. But if you're curious what the terms on the site mean: here's everything in plain language.",
    terms: [
      { term: "Next.js", plain: "The 'framework' I build with. Like the construction method of a house: it determines how strong and fast the result is. It delivers fast, server-rendered pages." },
      { term: "React", plain: "The building blocks the pages are made of. Makes interactive parts (like a cart or search window) possible." },
      { term: "Supabase", plain: "The database + login behind your site. Your products, customers, orders — safely stored in Europe." },
      { term: "Tailwind", plain: "How I style the site. Consistent, fast styling without messy CSS." },
      { term: "Vercel", plain: "Where your site 'lives' (hosting). Fast worldwide, automatic backups, SSL included." },
      { term: "PWA", plain: "Progressive Web App. A website you can install as an app on your phone, that works offline — without the App Store." },
      { term: "SSR", plain: "Server-Side Rendering. The page is fully built before it reaches the visitor (and Google). Faster and better for SEO." },
      { term: "SEO", plain: "Search Engine Optimization. Everything that makes Google understand your site well and show it in results." },
      { term: "hreflang", plain: "A signal to Google: 'this page also exists in NL/FR'. So you appear in results in each language separately." },
      { term: "301 redirect", plain: "A permanent 'change of address'. Old link → new page, so visitors and your Google ranking move along in a migration." },
      { term: "CDN", plain: "Content Delivery Network. Copies of your site worldwide, close to every visitor. That's why it loads fast everywhere." },
      { term: "Open Graph", plain: "The nice preview card that appears when someone shares your link on social media or WhatsApp." },
      { term: "JSON-LD", plain: "Invisible 'explanation' in your page so Google shows rich results — stars, breadcrumbs, FAQ in search." },
      { term: "Mollie / Stripe", plain: "The payment services for a webshop. Mollie is strong locally (Bancontact, lower fees), Stripe internationally." },
      { term: "Webhook", plain: "An automatic signal between systems. E.g.: payment succeeded → order confirmed. Without anyone pressing a button." },
      { term: "Repo / GitHub", plain: "The place where your site's source code is kept. You get access — the code is yours, no hostage situation." },
    ],
    ctaTitle: "Another term you don't get?",
    ctaText: "Just ask. I'd rather explain something twice than have you sign a quote you don't understand.",
    ctaButton: "Ask your question",
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

export default async function WoordenboekPage({
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
          <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
            {c.terms.map((t) => (
              <div key={t.term} className="bg-card p-6">
                <dt className="font-mono text-sm font-semibold text-accent">
                  {t.term}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">
                  {t.plain}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{c.ctaText}</p>
          <Link
            href={localePath(locale, "/#contact")}
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
