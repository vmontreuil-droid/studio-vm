import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Uses — Studio VM",
  description:
    "De tools, talen en services die ik elke dag gebruik om Studio VM te runnen.",
};

type Item = { name: string; hint?: string; url?: string };
type Group = { title: string; intro?: string; items: Item[] };

const groups: Group[] = [
  {
    title: "Stack",
    intro: "De technische basis voor zo goed als elk project.",
    items: [
      { name: "Next.js 16", hint: "App Router, React Server Components, Turbopack", url: "https://nextjs.org" },
      { name: "React 19", hint: "Met de nieuwe React Compiler", url: "https://react.dev" },
      { name: "Tailwind v4", hint: "CSS-first met @theme inline", url: "https://tailwindcss.com" },
      { name: "Supabase", hint: "Postgres + auth + storage in EU regio", url: "https://supabase.com" },
      { name: "Vercel", hint: "Hosting + edge functions + CDN", url: "https://vercel.com" },
      { name: "TypeScript", hint: "Strict mode, altijd", url: "https://typescriptlang.org" },
    ],
  },
  {
    title: "Bibliotheken die telkens terugkomen",
    items: [
      { name: "lucide-react", hint: "Iconen", url: "https://lucide.dev" },
      { name: "Mollie", hint: "Belgische betalingen, lagere fees dan Stripe voor lokaal", url: "https://mollie.com" },
      { name: "Stripe", hint: "Voor internationale e-commerce", url: "https://stripe.com" },
      { name: "Resend", hint: "Transactionele e-mail (incl. React Email)", url: "https://resend.com" },
      { name: "React Email", hint: "Mails ontwerpen als React-componenten", url: "https://react.email" },
      { name: "next/og", hint: "Dynamische Open Graph images" },
    ],
  },
  {
    title: "Editor & dev",
    items: [
      { name: "VS Code", hint: "Met Tailwind, ESLint, Prettier" },
      { name: "Claude Code (CLI)", hint: "Pair-programming voor de zware refactors", url: "https://claude.com/code" },
      { name: "GitHub", hint: "Eén repo per klant, Vincent + klant beide eigenaar" },
      { name: "Playwright", hint: "End-to-end tests voor de webshops" },
    ],
  },
  {
    title: "Design & content",
    items: [
      { name: "Figma", hint: "Voor klanten die hun eigen schetsen willen delen" },
      { name: "Sharp", hint: "Image-pipeline server-side" },
      { name: "Geist Sans + Mono", hint: "Standaard fonts (Vercel)", url: "https://vercel.com/font" },
    ],
  },
  {
    title: "Hardware",
    items: [
      { name: "MacBook Pro", hint: "Dagelijks werkpaard" },
      { name: "iPhone + iPad", hint: "Voor mobile testing en PWA installs" },
    ],
  },
];

export default function UsesPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            /uses
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Mijn dagelijkse uitrusting.
          </h1>
          <p className="mt-4 text-muted">
            Geen affiliate-links, geen sponsoring. Gewoon de tools waar ik na jaren bij
            terechtkwam. Geïnspireerd door{" "}
            <a
              href="https://uses.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              uses.tech
            </a>
            .
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-12 px-6 py-12">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>
              {group.intro && (
                <p className="mt-2 text-sm text-muted">{group.intro}</p>
              )}
              <ul className="mt-4 divide-y rounded-2xl border bg-card">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-start gap-4 p-4">
                    <div className="flex-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold tracking-tight transition-colors hover:text-accent"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <p className="font-semibold tracking-tight">{item.name}</p>
                      )}
                      {item.hint && (
                        <p className="mt-0.5 text-sm text-muted">{item.hint}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-sm text-muted">
            Vraag of suggestie?{" "}
            <Link href="/#contact" className="text-accent hover:underline">
              Stuur een bericht
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
