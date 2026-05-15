"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Monitor, Globe2, Boxes, Database, ChevronRight } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const icons = [Monitor, Globe2, Boxes, Database];

const T: Record<
  Locale,
  { title: string; intro: string; tap: string; nodes: { name: string; sub: string; body: string }[] }
> = {
  nl: {
    title: "Wat er onder de motorkap zit",
    intro: "Klik op een onderdeel — uitgelegd in mensentaal.",
    tap: "Tik voor uitleg",
    nodes: [
      { name: "Bezoeker", sub: "Browser / telefoon", body: "Jouw klant. Mobiel-eerst: de meeste bezoekers komen via hun telefoon, dus daar wordt op geoptimaliseerd." },
      { name: "Vercel Edge", sub: "CDN, wereldwijd", body: "Kopieën van je site staan dicht bij elke bezoeker, wereldwijd. Daarom laadt het overal snel — plus automatische HTTPS en backups." },
      { name: "Next.js", sub: "De applicatie", body: "Pagina's worden server-side opgebouwd vóór ze aankomen. Google ziet complete inhoud, geen lege loader. Snel en SEO-vriendelijk." },
      { name: "Supabase EU", sub: "Data + login", body: "Producten, klanten, bestellingen — veilig opgeslagen in Europa, met login en rij-beveiliging. Jouw data, jouw regels." },
    ],
  },
  fr: {
    title: "Ce qu'il y a sous le capot",
    intro: "Cliquez sur un élément — expliqué en langage humain.",
    tap: "Touchez pour l'explication",
    nodes: [
      { name: "Visiteur", sub: "Navigateur / téléphone", body: "Votre client. Mobile d'abord : la plupart des visiteurs viennent via leur téléphone, c'est donc là qu'on optimise." },
      { name: "Vercel Edge", sub: "CDN, mondial", body: "Des copies de votre site sont proches de chaque visiteur, partout. D'où la rapidité — plus HTTPS et backups automatiques." },
      { name: "Next.js", sub: "L'application", body: "Les pages sont construites côté serveur avant d'arriver. Google voit le contenu complet, pas un loader vide. Rapide et SEO-friendly." },
      { name: "Supabase EU", sub: "Données + connexion", body: "Produits, clients, commandes — stockés en sécurité en Europe, avec login et sécurité au niveau ligne. Vos données, vos règles." },
    ],
  },
  en: {
    title: "What's under the hood",
    intro: "Click a part — explained in plain language.",
    tap: "Tap for explanation",
    nodes: [
      { name: "Visitor", sub: "Browser / phone", body: "Your customer. Mobile-first: most visitors come via their phone, so that's what gets optimized." },
      { name: "Vercel Edge", sub: "CDN, worldwide", body: "Copies of your site sit close to every visitor, worldwide. That's why it loads fast everywhere — plus automatic HTTPS and backups." },
      { name: "Next.js", sub: "The application", body: "Pages are built server-side before they arrive. Google sees complete content, not an empty loader. Fast and SEO-friendly." },
      { name: "Supabase EU", sub: "Data + login", body: "Products, customers, orders — safely stored in Europe, with login and row-level security. Your data, your rules." },
    ],
  },
};

export function StackDiagram() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];
  const [active, setActive] = useState(0);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {t.title}
      </p>
      <p className="mt-2 text-sm text-muted">{t.intro}</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {t.nodes.map((n, i) => {
          const Icon = icons[i];
          const on = active === i;
          return (
            <div key={n.name} className="flex flex-1 items-center sm:flex-col">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={on}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  on
                    ? "border-accent bg-card-hover"
                    : "border-border bg-card hover:bg-card-hover"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${on ? "text-accent" : "text-muted"}`}
                  strokeWidth={1.5}
                />
                <p className="mt-3 font-semibold tracking-tight">{n.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {n.sub}
                </p>
              </button>
              {i < t.nodes.length - 1 && (
                <ChevronRight
                  className="mx-1 h-4 w-4 flex-shrink-0 rotate-90 text-muted sm:rotate-0"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {t.nodes[active].name} · {t.nodes[active].sub}
        </p>
        <p className="mt-2 leading-relaxed">{t.nodes[active].body}</p>
      </div>
    </div>
  );
}
