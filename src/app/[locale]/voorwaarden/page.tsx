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
      { title: "Offertes en configurator", body: "Een via de online configurator samengestelde prijs is een vaste prijs (excl. btw; 21% btw wordt bij afrekening toegevoegd). De samenstelling blijft geldig tot de vermelde vervaldatum. De opdracht is bevestigd zodra de aanbetaling van 30% betaald is." },
      { title: "Doorlooptijd", body: "Geschatte doorlooptijden zijn richtinggevend, niet bindend, tenzij anders schriftelijk overeengekomen. Vertraging door de klant verschuift de levertermijn evenredig." },
      { title: "Betaling", body: "Bij het vastleggen betaalt de klant een aanbetaling van 30% van het eenmalige projectbedrag (incl. 21% btw) via Mollie. Het saldo wordt ineens bij oplevering betaald of gespreid in 3, 6, 12 of 24 maanden zonder enige toeslag (geen intrest, geen kosten — louter spreiding). Abonnementen worden maandelijks gefactureerd. Facturen zijn betaalbaar binnen 14 dagen." },
      { title: "Verplicht onderhoudsabonnement", body: "Bij elk project is één onderhoudsabonnement (Care, Plus, Scale of Partner) verplicht vanaf de eerste maand. Dit dekt hosting, beveiliging, updates en support. De klant kiest vrij het niveau en kan op elk moment opgraden via het klantenportaal. Het abonnement heeft een minimumlooptijd van 12 maanden en wordt daarna stilzwijgend verlengd." },
      { title: "Domein en e-mail", body: "Domeinnaam, e-mailadressen en een eventuele domeinverhuis zitten niet in de projectprijs. Deze worden afzonderlijk met de klant besproken na oplevering; het project kan starten op een tijdelijk Vercel-adres. De klant blijft steeds eigenaar van zijn domein." },
      { title: "Niet-betaling en opschorting", body: "Bij een onbetaalde factuur na de vervaldag volgt een herinnering. Blijft betaling uit, dan kan de website en/of dienst tijdelijk worden opgeschort tot de openstaande schuld volledig vereffend is. Heractivatie gebeurt na volledige betaling; reeds vervallen bedragen blijven verschuldigd." },
      { title: "Eigendom en code", body: "De code wordt overgedragen aan de klant via een GitHub-repo. De klant blijft eigenaar van zijn eigen content. Studio VM behoudt het recht om het project te tonen in zijn portfolio (tenzij schriftelijk anders)." },
      { title: "Hosting en derde partijen", body: "Hosting verloopt via Vercel + Supabase (EU regio's). Kosten van deze partijen zijn ten laste van de klant, tenzij inbegrepen in een Care/Plus/Scale abonnement." },
      { title: "Garantie en bug-fix", body: "Bugs die binnen 30 dagen na lancering worden gemeld en aantoonbaar door Studio VM zijn veroorzaakt, worden gratis verholpen. Daarna geldt het abonnement of een uurtarief." },
      { title: "Aansprakelijkheid", body: "Studio VM is enkel aansprakelijk voor directe schade die rechtstreeks en uitsluitend voortvloeit uit een bewezen fout. Indirecte schade is uitgesloten. De totale aansprakelijkheid is beperkt tot het bedrag van de opdracht." },
      { title: "Looptijd & opzegging abonnement", body: "Het onderhoudsabonnement heeft een minimumlooptijd van 12 maanden en wordt daarna stilzwijgend verlengd. Na de minimumlooptijd is het schriftelijk opzegbaar met een opzegtermijn van 1 maand. Reeds gefactureerde periodes worden niet terugbetaald." },
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
      { title: "Devis et configurateur", body: "Un prix composé via le configurateur en ligne est un prix fixe (HTVA ; 21% de TVA ajoutés au paiement). La composition reste valable jusqu'à la date d'échéance indiquée. La mission est confirmée dès le paiement de l'acompte de 30%." },
      { title: "Délais", body: "Les délais estimés sont indicatifs, non contraignants, sauf accord écrit contraire. Un retard du client décale le délai de livraison proportionnellement." },
      { title: "Paiement", body: "Lors du verrouillage, le client paie un acompte de 30% du montant unique du projet (TVA 21% incl.) via Mollie. Le solde est payé en une fois à la livraison ou échelonné en 3, 6, 12 ou 24 mois sans aucun supplément (ni intérêt, ni frais — simple échelonnement). Les abonnements sont facturés mensuellement. Factures payables sous 14 jours." },
      { title: "Abonnement de maintenance obligatoire", body: "Pour chaque projet, un abonnement de maintenance (Care, Plus, Scale ou Partner) est obligatoire dès le premier mois. Il couvre l'hébergement, la sécurité, les mises à jour et le support. Le client choisit librement le niveau et peut évoluer à tout moment via l'espace client. L'abonnement a une durée minimale de 12 mois et est ensuite reconduit tacitement." },
      { title: "Domaine et e-mail", body: "Le nom de domaine, les adresses e-mail et un éventuel transfert de domaine ne sont pas inclus dans le prix du projet. Ils sont discutés séparément avec le client après la livraison ; le projet peut démarrer sur une adresse Vercel temporaire. Le client reste toujours propriétaire de son domaine." },
      { title: "Non-paiement et suspension", body: "En cas de facture impayée après l'échéance, un rappel est envoyé. À défaut de paiement, le site web et/ou le service peut être temporairement suspendu jusqu'au règlement intégral de la dette. La réactivation a lieu après paiement complet ; les montants échus restent dus." },
      { title: "Propriété et code", body: "Le code est transféré au client via un dépôt GitHub. Le client reste propriétaire de son propre contenu. Studio VM conserve le droit de montrer le projet dans son portfolio (sauf accord écrit contraire)." },
      { title: "Hébergement et tiers", body: "L'hébergement passe par Vercel + Supabase (régions EU). Les coûts de ces tiers sont à charge du client, sauf inclus dans un abonnement Care/Plus/Scale." },
      { title: "Garantie et correction de bugs", body: "Les bugs signalés dans les 30 jours après le lancement et démontrablement causés par Studio VM sont corrigés gratuitement. Ensuite l'abonnement ou un tarif horaire s'applique." },
      { title: "Responsabilité", body: "Studio VM n'est responsable que des dommages directs résultant exclusivement d'une faute prouvée. Les dommages indirects sont exclus. La responsabilité totale est limitée au montant de la mission." },
      { title: "Durée & résiliation abonnement", body: "L'abonnement de maintenance a une durée minimale de 12 mois et est ensuite reconduit tacitement. Après la durée minimale, il est résiliable par écrit avec un préavis d'1 mois. Les périodes déjà facturées ne sont pas remboursées." },
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
      { title: "Quotes and configurator", body: "A price composed via the online configurator is a fixed price (excl. VAT; 21% VAT added at checkout). The composition stays valid until the stated expiry date. The assignment is confirmed once the 30% deposit is paid." },
      { title: "Timelines", body: "Estimated timelines are indicative, not binding, unless agreed otherwise in writing. Delay by the client shifts the delivery date proportionally." },
      { title: "Payment", body: "On lock-in the client pays a 30% deposit of the one-off project amount (incl. 21% VAT) via Mollie. The balance is paid in full on delivery or split over 3, 6, 12 or 24 months without any surcharge (no interest, no fees — purely spreading). Subscriptions are invoiced monthly. Invoices payable within 14 days." },
      { title: "Mandatory maintenance subscription", body: "For every project, one maintenance subscription (Care, Plus, Scale or Partner) is mandatory from the first month. It covers hosting, security, updates and support. The client freely chooses the level and can upgrade at any time via the client portal. The subscription has a minimum term of 12 months and then renews automatically." },
      { title: "Domain and email", body: "The domain name, email addresses and any domain transfer are not included in the project price. They are discussed separately with the client after delivery; the project may start on a temporary Vercel address. The client always remains the owner of their domain." },
      { title: "Non-payment and suspension", body: "If an invoice remains unpaid after the due date, a reminder is sent. If payment is still not made, the website and/or service may be temporarily suspended until the outstanding debt is fully settled. Reactivation occurs after full payment; amounts already due remain payable." },
      { title: "Ownership and code", body: "The code is transferred to the client via a GitHub repo. The client remains owner of their own content. Studio VM keeps the right to show the project in its portfolio (unless agreed otherwise in writing)." },
      { title: "Hosting and third parties", body: "Hosting runs via Vercel + Supabase (EU regions). Costs of these parties are borne by the client, unless included in a Care/Plus/Scale subscription." },
      { title: "Warranty and bug fixing", body: "Bugs reported within 30 days after launch and demonstrably caused by Studio VM are fixed for free. After that the subscription or an hourly rate applies." },
      { title: "Liability", body: "Studio VM is only liable for direct damage resulting exclusively from a proven fault. Indirect damage is excluded. Total liability is limited to the amount of the assignment." },
      { title: "Subscription term & cancellation", body: "The maintenance subscription has a minimum term of 12 months and then renews automatically. After the minimum term it can be cancelled in writing with a 1-month notice period. Already invoiced periods are not refunded." },
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
