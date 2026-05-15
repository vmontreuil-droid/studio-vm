import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FaqJsonLd } from "@/components/json-ld";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Group = { title: string; items: { q: string; a: string }[] };
type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  intro: string;
  introLink: string;
  groups: Group[];
  ctaTitle: string;
  ctaButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "FAQ — Studio VM",
    eyebrow: "FAQ",
    title: "Veelgestelde vragen",
    intro: "Antwoorden op de vragen die ik wekelijks krijg. Staat 't jouwe er niet bij?",
    introLink: "Stuur een bericht",
    groups: [
      {
        title: "Praktisch",
        items: [
          { q: "Hoe lang duurt een project?", a: "Starter ~2 weken, Pro 4–6 weken, Webshop 6–10 weken vanaf de officiële kick-off. Migraties hangen af van de hoeveelheid content en redirects." },
          { q: "Kunnen we eerst kosteloos kennismaken?", a: "Altijd. Een eerste gesprek is vrijblijvend en kost niets. Je krijgt een eerlijk advies — ook als ik denk dat je beter geholpen bent door iemand anders." },
          { q: "Werk je alleen of met een team?", a: "Ik werk alleen voor de development. Voor logo's, fotografie of copy verwijs ik je door naar mensen waar ik graag mee samenwerk — meestal allemaal in West-Vlaanderen." },
          { q: "Werk je met klanten buiten België?", a: "Liefst lokaal (West-Vlaanderen + Brussel) zodat we elkaar kunnen ontmoeten. Maar voor specifieke projecten kan dat ook elders — alles is digitaal." },
        ],
      },
      {
        title: "Prijs & betaling",
        items: [
          { q: "Hoe verloopt de facturatie?", a: "30% bij start, 40% halverwege, 30% bij oplevering. Voor abonnementen: maandelijks via SEPA-opdracht." },
          { q: "Kan ik later upgraden van een Starter naar Pro?", a: "Ja. Je betaalt enkel het verschil + de tijd voor de extra functies." },
          { q: "Wat als ik geen abonnement neem?", a: "Dan staat je site rustig op Vercel + Supabase free tier. Wil je later support of updates? Dan factureer ik per uur (€95/u)." },
        ],
      },
      {
        title: "Technisch",
        items: [
          { q: "Welke technologie gebruik je?", a: "Next.js 16 (React) voor de frontend, Supabase voor de database en auth, Tailwind v4 voor styling, Vercel voor hosting. Allemaal open standaarden — geen vendor lock-in." },
          { q: "Wat met SEO?", a: "Standaard ingebouwd: sitemap.xml, robots.txt, Open Graph, structured data. Bij migraties zorg ik voor permanente redirects zodat je geen ranking verliest." },
          { q: "Krijg ik de code?", a: "Ja, de code zit in een GitHub-repo waar jij toegang toe krijgt. Ook als we ooit uit elkaar gaan, blijft alles van jou." },
          { q: "Wat met privacy en GDPR?", a: "Cookie-banner, privacy-verklaring, data-export en -verwijdering zitten ingebouwd in elke site. Hosting in Europa (Vercel EU + Supabase EU regio)." },
        ],
      },
      {
        title: "Na oplevering",
        items: [
          { q: "Wat als er iets stuk gaat?", a: "Eerste 30 dagen na launch los ik bugs gratis op. Daarna via abonnement of per uur." },
          { q: "Kan ik content zelf wijzigen?", a: "Ja — de admin is gemaakt voor jou. Menu's, foto's, teksten, openingsuren, alles wijzig je zelf zonder ontwikkelaar." },
          { q: "Wat als ik nieuwe features wil?", a: "Twee opties: Plus/Scale abonnement met inbegrepen development uren, of per kwartaal een mini-project boeken." },
        ],
      },
    ],
    ctaTitle: "Vraag niet beantwoord?",
    ctaButton: "Stel ze rechtstreeks",
  },
  fr: {
    metaTitle: "FAQ — Studio VM",
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    intro: "Réponses aux questions que je reçois chaque semaine. La vôtre n'y est pas ?",
    introLink: "Envoyez un message",
    groups: [
      {
        title: "Pratique",
        items: [
          { q: "Combien de temps dure un projet ?", a: "Starter ~2 semaines, Pro 4–6 semaines, Boutique 6–10 semaines depuis le lancement officiel. Les migrations dépendent du volume de contenu et des redirections." },
          { q: "Peut-on d'abord faire connaissance gratuitement ?", a: "Toujours. Un premier entretien est sans engagement et gratuit. Vous recevez un conseil honnête — même si je pense que quelqu'un d'autre vous aiderait mieux." },
          { q: "Travaillez-vous seul ou en équipe ?", a: "Je travaille seul pour le développement. Pour les logos, la photographie ou la rédaction, je vous oriente vers des personnes avec qui j'aime collaborer — souvent toutes en Flandre-Occidentale." },
          { q: "Travaillez-vous avec des clients hors Belgique ?", a: "De préférence en local (Flandre-Occidentale + Bruxelles) pour pouvoir se rencontrer. Mais pour des projets spécifiques, ailleurs est possible — tout est numérique." },
        ],
      },
      {
        title: "Prix & paiement",
        items: [
          { q: "Comment se passe la facturation ?", a: "30 % au début, 40 % à mi-parcours, 30 % à la livraison. Pour les abonnements : mensuellement par mandat SEPA." },
          { q: "Puis-je passer plus tard d'un Starter à Pro ?", a: "Oui. Vous payez seulement la différence + le temps des fonctions supplémentaires." },
          { q: "Et si je ne prends pas d'abonnement ?", a: "Votre site reste tranquillement sur Vercel + Supabase free tier. Besoin de support ou de mises à jour plus tard ? Je facture à l'heure (€95/h)." },
        ],
      },
      {
        title: "Technique",
        items: [
          { q: "Quelle technologie utilisez-vous ?", a: "Next.js 16 (React) pour le frontend, Supabase pour la base de données et l'auth, Tailwind v4 pour le style, Vercel pour l'hébergement. Que des standards ouverts — pas de vendor lock-in." },
          { q: "Et le SEO ?", a: "Intégré par défaut : sitemap.xml, robots.txt, Open Graph, données structurées. Lors des migrations, je mets des redirections permanentes pour ne pas perdre de classement." },
          { q: "Est-ce que je reçois le code ?", a: "Oui, le code est dans un dépôt GitHub auquel vous avez accès. Même si on se sépare un jour, tout reste à vous." },
          { q: "Et la vie privée et le RGPD ?", a: "Bannière cookies, politique de confidentialité, export et suppression des données intégrés dans chaque site. Hébergement en Europe (Vercel EU + région Supabase EU)." },
        ],
      },
      {
        title: "Après la livraison",
        items: [
          { q: "Et si quelque chose casse ?", a: "Les 30 premiers jours après le lancement, je corrige les bugs gratuitement. Ensuite via abonnement ou à l'heure." },
          { q: "Puis-je modifier le contenu moi-même ?", a: "Oui — l'admin est fait pour vous. Cartes, photos, textes, heures d'ouverture, vous modifiez tout sans développeur." },
          { q: "Et si je veux de nouvelles fonctions ?", a: "Deux options : abonnement Plus/Scale avec heures de développement incluses, ou réserver un mini-projet par trimestre." },
        ],
      },
    ],
    ctaTitle: "Question sans réponse ?",
    ctaButton: "Posez-la directement",
  },
  en: {
    metaTitle: "FAQ — Studio VM",
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    intro: "Answers to the questions I get weekly. Yours not listed?",
    introLink: "Send a message",
    groups: [
      {
        title: "Practical",
        items: [
          { q: "How long does a project take?", a: "Starter ~2 weeks, Pro 4–6 weeks, Webshop 6–10 weeks from the official kick-off. Migrations depend on the amount of content and redirects." },
          { q: "Can we meet for free first?", a: "Always. A first chat is non-binding and free. You get honest advice — even if I think someone else would help you better." },
          { q: "Do you work alone or with a team?", a: "I work alone for development. For logos, photography or copy I refer you to people I like to work with — usually all in West Flanders." },
          { q: "Do you work with clients outside Belgium?", a: "Preferably local (West Flanders + Brussels) so we can meet. But for specific projects, elsewhere works too — it's all digital." },
        ],
      },
      {
        title: "Price & payment",
        items: [
          { q: "How does invoicing work?", a: "30% at start, 40% halfway, 30% on delivery. For subscriptions: monthly via SEPA mandate." },
          { q: "Can I upgrade from Starter to Pro later?", a: "Yes. You only pay the difference + the time for the extra features." },
          { q: "What if I don't take a subscription?", a: "Your site sits quietly on Vercel + Supabase free tier. Want support or updates later? I bill by the hour (€95/h)." },
        ],
      },
      {
        title: "Technical",
        items: [
          { q: "What technology do you use?", a: "Next.js 16 (React) for the frontend, Supabase for database and auth, Tailwind v4 for styling, Vercel for hosting. All open standards — no vendor lock-in." },
          { q: "What about SEO?", a: "Built in by default: sitemap.xml, robots.txt, Open Graph, structured data. For migrations I add permanent redirects so you don't lose ranking." },
          { q: "Do I get the code?", a: "Yes, the code is in a GitHub repo you get access to. Even if we ever part ways, everything stays yours." },
          { q: "What about privacy and GDPR?", a: "Cookie banner, privacy policy, data export and deletion built into every site. Hosting in Europe (Vercel EU + Supabase EU region)." },
        ],
      },
      {
        title: "After delivery",
        items: [
          { q: "What if something breaks?", a: "The first 30 days after launch I fix bugs for free. After that via subscription or by the hour." },
          { q: "Can I edit content myself?", a: "Yes — the admin is built for you. Menus, photos, text, opening hours, you change it all without a developer." },
          { q: "What if I want new features?", a: "Two options: Plus/Scale subscription with included development hours, or book a mini-project per quarter." },
        ],
      },
    ],
    ctaTitle: "Question not answered?",
    ctaButton: "Ask it directly",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: copy[locale].metaTitle };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const contact = localePath(locale, "/#contact");
  const allFaqs = c.groups.flatMap((g) => g.items);

  return (
    <main>
      <FaqJsonLd items={allFaqs} />
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 text-muted">
            {c.intro}{" "}
            <Link href={contact} className="text-accent hover:underline">
              {c.introLink}
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-16 px-6 py-20">
          {c.groups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
                {group.title}
              </h2>
              <dl className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.q} className="rounded-2xl border bg-card p-6">
                    <dt className="font-semibold">{item.q}</dt>
                    <dd className="mt-2 text-muted">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <Link
            href={contact}
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
