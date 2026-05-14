import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — Studio VM",
  description:
    "Veelgestelde vragen over websites, webshops, prijzen, doorlooptijd en onderhoud.",
};

type Group = {
  title: string;
  items: { q: string; a: string }[];
};

const groups: Group[] = [
  {
    title: "Praktisch",
    items: [
      {
        q: "Hoe lang duurt een project?",
        a: "Starter ~2 weken, Pro 4–6 weken, Webshop 6–10 weken vanaf de officiële kick-off. Migraties hangen af van de hoeveelheid content en redirects.",
      },
      {
        q: "Kunnen we eerst kosteloos kennismaken?",
        a: "Altijd. Een eerste gesprek is vrijblijvend en kost niets. Je krijgt een eerlijk advies — ook als ik denk dat je beter geholpen bent door iemand anders.",
      },
      {
        q: "Werk je alleen of met een team?",
        a: "Ik werk alleen voor de development. Voor logo's, fotografie of copy verwijs ik je door naar mensen waar ik graag mee samenwerk — meestal allemaal in West-Vlaanderen.",
      },
      {
        q: "Werk je met klanten buiten België?",
        a: "Liefst lokaal (West-Vlaanderen + Brussel) zodat we elkaar kunnen ontmoeten. Maar voor specifieke projecten kan dat ook elders — alles is digitaal.",
      },
    ],
  },
  {
    title: "Prijs & betaling",
    items: [
      {
        q: "Hoe verloopt de facturatie?",
        a: "30% bij start, 40% halverwege, 30% bij oplevering. Voor abonnementen: maandelijks via SEPA-opdracht.",
      },
      {
        q: "Kan ik later upgraden van een Starter naar Pro?",
        a: "Ja. Je betaalt enkel het verschil + de tijd voor de extra functies.",
      },
      {
        q: "Wat als ik geen abonnement neem?",
        a: "Dan staat je site rustig op Vercel + Supabase free tier. Wil je later support of updates? Dan factureer ik per uur (€95/u).",
      },
    ],
  },
  {
    title: "Technisch",
    items: [
      {
        q: "Welke technologie gebruik je?",
        a: "Next.js 16 (React) voor de frontend, Supabase voor de database en auth, Tailwind v4 voor styling, Vercel voor hosting. Allemaal open standaarden — geen vendor lock-in.",
      },
      {
        q: "Wat met SEO?",
        a: "Standaard ingebouwd: sitemap.xml, robots.txt, Open Graph, structured data. Bij migraties zorg ik voor permanente redirects zodat je geen ranking verliest.",
      },
      {
        q: "Krijg ik de code?",
        a: "Ja, de code zit in een GitHub-repo waar jij toegang toe krijgt. Ook als we ooit uit elkaar gaan, blijft alles van jou.",
      },
      {
        q: "Wat met privacy en GDPR?",
        a: "Cookie-banner, privacy-verklaring, data-export en -verwijdering zitten ingebouwd in elke site. Hosting in Europa (Vercel EU + Supabase EU regio).",
      },
    ],
  },
  {
    title: "Na oplevering",
    items: [
      {
        q: "Wat als er iets stuk gaat?",
        a: "Eerste 30 dagen na launch los ik bugs gratis op. Daarna via abonnement of per uur.",
      },
      {
        q: "Kan ik content zelf wijzigen?",
        a: "Ja — de admin is gemaakt voor jou. Menu's, foto's, teksten, openingsuren, alles wijzig je zelf zonder ontwikkelaar.",
      },
      {
        q: "Wat als ik nieuwe features wil?",
        a: "Twee opties: Plus/Scale abonnement met inbegrepen development uren, of per kwartaal een mini-project boeken.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            FAQ
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Veelgestelde vragen
          </h1>
          <p className="mt-6 text-muted">
            Antwoorden op de vragen die ik wekelijks krijg. Staat 't jouwe er niet bij?{" "}
            <Link href="/#contact" className="text-accent hover:underline">
              Stuur een bericht
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-16 px-6 py-20">
          {groups.map((group) => (
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
            Vraag niet beantwoord?
          </h2>
          <Link
            href="/#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Stel ze rechtstreeks
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
