import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  localeCode: string;
  sections: { title: string; body: string }[];
  footer: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Algemene voorwaarden — Studio VM",
    eyebrow: "Voorwaarden",
    title: "Algemene voorwaarden",
    updated: "Laatst bijgewerkt",
    localeCode: "nl-BE",
    sections: [
      { title: "Toepassing", body: "Deze voorwaarden gelden voor elke offerte, opdracht en abonnement uitgevoerd door Studio VM (Vincent Montreuil), tenzij schriftelijk anders overeengekomen." },
      { title: "Offertes", body: "Offertes blijven 30 dagen geldig. Een opdracht is bevestigd na schriftelijke akkoordverklaring + betaling van het voorschot (30%)." },
      { title: "Doorlooptijd", body: "Geschatte doorlooptijden zijn richtinggevend, niet bindend, tenzij anders schriftelijk overeengekomen. Vertraging door de klant verschuift de levertermijn evenredig." },
      { title: "Betaling", body: "Eenmalige opdrachten worden gefactureerd in drie schijven: 30% bij start, 40% halverwege, 30% bij oplevering. Abonnementen maandelijks via SEPA. Facturen betaalbaar binnen 14 dagen." },
      { title: "Eigendom en code", body: "De code wordt overgedragen aan de klant via een GitHub-repo. De klant blijft eigenaar van zijn eigen content. Studio VM behoudt het recht om het project te tonen in zijn portfolio (tenzij schriftelijk anders)." },
      { title: "Hosting en derde partijen", body: "Hosting verloopt via Vercel + Supabase (EU regio's). Kosten van deze partijen zijn ten laste van de klant, tenzij inbegrepen in een Care/Plus/Scale abonnement." },
      { title: "Garantie en bug-fix", body: "Bugs die binnen 30 dagen na lancering worden gemeld en aantoonbaar door Studio VM zijn veroorzaakt, worden gratis verholpen. Daarna geldt het abonnement of een uurtarief." },
      { title: "Aansprakelijkheid", body: "Studio VM is enkel aansprakelijk voor directe schade die rechtstreeks en uitsluitend voortvloeit uit een bewezen fout. Indirecte schade is uitgesloten. De totale aansprakelijkheid is beperkt tot het bedrag van de opdracht." },
      { title: "Opzegging abonnement", body: "Maandabonnementen kunnen schriftelijk worden opgezegd met opzegtermijn van 1 maand. Reeds gefactureerde periodes worden niet terugbetaald." },
      { title: "Toepasselijk recht", body: "Op elke overeenkomst is het Belgisch recht van toepassing. Bij geschillen zijn de rechtbanken van Kortrijk bevoegd." },
    ],
    footer:
      "Studio VM · Vincent Montreuil · West-Vlaanderen, België · info@studio-vm.be · BE 0672.960.066",
  },
  fr: {
    metaTitle: "Conditions générales — Studio VM",
    eyebrow: "Conditions",
    title: "Conditions générales",
    updated: "Dernière mise à jour",
    localeCode: "fr-BE",
    sections: [
      { title: "Application", body: "Ces conditions s'appliquent à chaque devis, mission et abonnement exécutés par Studio VM (Vincent Montreuil), sauf accord écrit contraire." },
      { title: "Devis", body: "Les devis restent valables 30 jours. Une mission est confirmée après accord écrit + paiement de l'acompte (30%)." },
      { title: "Délais", body: "Les délais estimés sont indicatifs, non contraignants, sauf accord écrit contraire. Un retard du client décale le délai de livraison proportionnellement." },
      { title: "Paiement", body: "Les missions uniques sont facturées en trois tranches : 30% au début, 40% à mi-parcours, 30% à la livraison. Abonnements mensuels via SEPA. Factures payables sous 14 jours." },
      { title: "Propriété et code", body: "Le code est transféré au client via un dépôt GitHub. Le client reste propriétaire de son propre contenu. Studio VM conserve le droit de montrer le projet dans son portfolio (sauf accord écrit contraire)." },
      { title: "Hébergement et tiers", body: "L'hébergement passe par Vercel + Supabase (régions EU). Les coûts de ces tiers sont à charge du client, sauf inclus dans un abonnement Care/Plus/Scale." },
      { title: "Garantie et correction de bugs", body: "Les bugs signalés dans les 30 jours après le lancement et démontrablement causés par Studio VM sont corrigés gratuitement. Ensuite l'abonnement ou un tarif horaire s'applique." },
      { title: "Responsabilité", body: "Studio VM n'est responsable que des dommages directs résultant exclusivement d'une faute prouvée. Les dommages indirects sont exclus. La responsabilité totale est limitée au montant de la mission." },
      { title: "Résiliation abonnement", body: "Les abonnements mensuels peuvent être résiliés par écrit avec un préavis d'1 mois. Les périodes déjà facturées ne sont pas remboursées." },
      { title: "Droit applicable", body: "Le droit belge s'applique à chaque convention. En cas de litige, les tribunaux de Courtrai sont compétents." },
    ],
    footer:
      "Studio VM · Vincent Montreuil · Flandre-Occidentale, Belgique · info@studio-vm.be · BE 0672.960.066",
  },
  en: {
    metaTitle: "Terms — Studio VM",
    eyebrow: "Terms",
    title: "General terms",
    updated: "Last updated",
    localeCode: "en-GB",
    sections: [
      { title: "Application", body: "These terms apply to every quote, assignment and subscription carried out by Studio VM (Vincent Montreuil), unless agreed otherwise in writing." },
      { title: "Quotes", body: "Quotes remain valid for 30 days. An assignment is confirmed after written agreement + payment of the deposit (30%)." },
      { title: "Timelines", body: "Estimated timelines are indicative, not binding, unless agreed otherwise in writing. Delay by the client shifts the delivery date proportionally." },
      { title: "Payment", body: "One-off assignments are invoiced in three parts: 30% at start, 40% halfway, 30% on delivery. Subscriptions monthly via SEPA. Invoices payable within 14 days." },
      { title: "Ownership and code", body: "The code is transferred to the client via a GitHub repo. The client remains owner of their own content. Studio VM keeps the right to show the project in its portfolio (unless agreed otherwise in writing)." },
      { title: "Hosting and third parties", body: "Hosting runs via Vercel + Supabase (EU regions). Costs of these parties are borne by the client, unless included in a Care/Plus/Scale subscription." },
      { title: "Warranty and bug fixing", body: "Bugs reported within 30 days after launch and demonstrably caused by Studio VM are fixed for free. After that the subscription or an hourly rate applies." },
      { title: "Liability", body: "Studio VM is only liable for direct damage resulting exclusively from a proven fault. Indirect damage is excluded. Total liability is limited to the amount of the assignment." },
      { title: "Subscription cancellation", body: "Monthly subscriptions can be cancelled in writing with a 1-month notice period. Already invoiced periods are not refunded." },
      { title: "Applicable law", body: "Belgian law applies to every agreement. In case of disputes, the courts of Kortrijk have jurisdiction." },
    ],
    footer:
      "Studio VM · Vincent Montreuil · West Flanders, Belgium · info@studio-vm.be · BE 0672.960.066",
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

export default async function VoorwaardenPage({
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
          {c.sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
                <span className="font-mono text-sm text-accent">{i + 1}.</span>
                {s.title}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/90">{s.body}</p>
            </section>
          ))}

          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            {c.footer}
          </p>
        </div>
      </article>
    </main>
  );
}
