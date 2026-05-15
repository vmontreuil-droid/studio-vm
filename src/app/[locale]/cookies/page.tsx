import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  localeCode: string;
  shortTitle: string;
  shortBody: string;
  tableTitle: string;
  cols: { name: string; purpose: string; duration: string; type: string };
  rows: { name: string; purpose: string; duration: string; type: string }[];
  removeTitle: string;
  removeBody: string;
  analyticsTitle: string;
  analyticsBody: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Cookieverklaring",
    updated: "Laatst bijgewerkt",
    localeCode: "nl-BE",
    shortTitle: "Korte versie",
    shortBody:
      "We gebruiken geen tracking-cookies, geen advertentie-cookies, geen third-party trackers. Wat we wel gebruiken zijn een paar localStorage-waarden om de demo-functies (shop, support tickets) te laten werken — die blijven uitsluitend in jouw browser.",
    tableTitle: "Wat staat er opgeslagen?",
    cols: { name: "Naam", purpose: "Doel", duration: "Bewaartijd", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Onthoudt je demo-winkelmand op /shop.", duration: "Tot je 'm leegmaakt", type: "Functioneel (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Bewaart de tickets die je aanmaakt op de support-demo.", duration: "Tot je reset", type: "Functioneel (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Onthoudt of je de cookie-banner gezien hebt.", duration: "1 jaar", type: "Functioneel (localStorage)" },
      { name: "locale", purpose: "Onthoudt je taalkeuze (NL/FR/EN).", duration: "1 jaar", type: "Functioneel (cookie)" },
      { name: "theme", purpose: "Onthoudt je licht/donker-voorkeur.", duration: "Tot je 'm wist", type: "Functioneel (localStorage)" },
    ],
    removeTitle: "Hoe verwijder ik ze?",
    removeBody:
      "Open je browser-instellingen → Privacy → Site-data verwijderen voor studio-vm.be. Dat wist alle lokale data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We gebruiken privacy-vriendelijke analytics. Geen cookies, geen persoonlijke identificatoren — enkel geanonimiseerde paginabezoeken.",
  },
  fr: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Déclaration cookies",
    updated: "Dernière mise à jour",
    localeCode: "fr-BE",
    shortTitle: "Version courte",
    shortBody:
      "Nous n'utilisons aucun cookie de tracking, aucun cookie publicitaire, aucun tracker tiers. Ce que nous utilisons : quelques valeurs localStorage pour faire fonctionner les démos (boutique, tickets support) — elles restent uniquement dans votre navigateur.",
    tableTitle: "Qu'est-ce qui est stocké ?",
    cols: { name: "Nom", purpose: "But", duration: "Durée", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Retient votre panier démo sur /shop.", duration: "Jusqu'à ce que vous le vidiez", type: "Fonctionnel (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Conserve les tickets créés dans la démo support.", duration: "Jusqu'au reset", type: "Fonctionnel (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Retient si vous avez vu la bannière cookies.", duration: "1 an", type: "Fonctionnel (localStorage)" },
      { name: "locale", purpose: "Retient votre choix de langue (NL/FR/EN).", duration: "1 an", type: "Fonctionnel (cookie)" },
      { name: "theme", purpose: "Retient votre préférence clair/sombre.", duration: "Jusqu'à effacement", type: "Fonctionnel (localStorage)" },
    ],
    removeTitle: "Comment les supprimer ?",
    removeBody:
      "Ouvrez les paramètres du navigateur → Confidentialité → Supprimer les données du site pour studio-vm.be. Cela efface toutes les données locales.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "Nous utilisons des analytics respectueux de la vie privée. Pas de cookies, pas d'identifiants personnels — uniquement des visites de pages anonymisées.",
  },
  en: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Cookie statement",
    updated: "Last updated",
    localeCode: "en-GB",
    shortTitle: "Short version",
    shortBody:
      "We use no tracking cookies, no advertising cookies, no third-party trackers. What we do use are a few localStorage values to make the demo features (shop, support tickets) work — they stay only in your browser.",
    tableTitle: "What is stored?",
    cols: { name: "Name", purpose: "Purpose", duration: "Retention", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Remembers your demo cart on /shop.", duration: "Until you empty it", type: "Functional (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Stores the tickets you create in the support demo.", duration: "Until you reset", type: "Functional (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Remembers whether you've seen the cookie banner.", duration: "1 year", type: "Functional (localStorage)" },
      { name: "locale", purpose: "Remembers your language choice (NL/FR/EN).", duration: "1 year", type: "Functional (cookie)" },
      { name: "theme", purpose: "Remembers your light/dark preference.", duration: "Until you clear it", type: "Functional (localStorage)" },
    ],
    removeTitle: "How do I remove them?",
    removeBody:
      "Open your browser settings → Privacy → Clear site data for studio-vm.be. That wipes all local data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We use privacy-friendly analytics. No cookies, no personal identifiers — only anonymized page views.",
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

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <article>
        <header className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {c.title}
            </h1>
            <p className="mt-4 text-sm text-muted">
              {c.updated}:{" "}
              {new Date().toLocaleDateString(c.localeCode, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
          <section>
            <h2 className="text-xl font-semibold tracking-tight">{c.shortTitle}</h2>
            <p className="mt-3 leading-relaxed">{c.shortBody}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">{c.tableTitle}</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-card">
                  <tr>
                    {[c.cols.name, c.cols.purpose, c.cols.duration, c.cols.type].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {c.rows.map((r) => (
                    <tr key={r.name}>
                      <td className="px-4 py-3 font-mono text-xs">{r.name}</td>
                      <td className="px-4 py-3">{r.purpose}</td>
                      <td className="px-4 py-3 text-muted">{r.duration}</td>
                      <td className="px-4 py-3 text-muted">{r.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">{c.removeTitle}</h2>
            <p className="mt-3 leading-relaxed">{c.removeBody}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              {c.analyticsTitle}
            </h2>
            <p className="mt-3 leading-relaxed">{c.analyticsBody}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
