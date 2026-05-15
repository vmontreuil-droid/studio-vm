import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { getPricing, type PricingTier } from "@/lib/pricing";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: `${copy[locale].metaTitle}` };
}

const copy: Record<
  Locale,
  {
    metaTitle: string;
    heroEyebrow: string;
    heroTitle: string;
    heroIntro: string;
    oneShotEyebrow: string;
    oneShotTitle: string;
    oneShotIntro: string;
    subEyebrow: string;
    subTitle: string;
    subIntro: string;
    modEyebrow: string;
    modTitle: string;
    modIntro: string;
    payEyebrow: string;
    payTitle: string;
    payItems: { t: string; d: string }[];
    faqEyebrow: string;
    faqTitle: string;
    faqs: { q: string; a: string }[];
    ctaTitle: string;
    ctaIntro: string;
    ctaButton: string;
  }
> = {
  nl: {
    metaTitle: "Pricing — Studio VM",
    heroEyebrow: "Pricing",
    heroTitle: "Geen verrassingen achteraf.",
    heroIntro:
      "Heldere pakketten en abonnementen, gepubliceerd op deze pagina. Wat je hier leest is wat je krijgt — en wat je betaalt.",
    oneShotEyebrow: "Eenmalig",
    oneShotTitle: "Wat een nieuwe site kost",
    oneShotIntro: "Vijf pakketten. Eerlijk geprijsd. Geen offertes met sterretjes.",
    subEyebrow: "Maandelijks",
    subTitle: "Onderhoud en doorgroei",
    subIntro:
      "Een nieuwe site is mooi, maar een levende site is beter. Kies wat past bij hoe actief je bent.",
    modEyebrow: "À la carte",
    modTitle: "Losse modules bij te bestellen",
    modIntro:
      "Bij elk pakket. Enkel wat je nodig hebt — je betaalt nooit voor functies die je niet gebruikt.",
    payEyebrow: "Betaalwijze",
    payTitle: "Betalen op jouw tempo",
    payItems: [
      { t: "Eenmalig", d: "Klassiek: 30% voorschot bij start, saldo bij oplevering." },
      { t: "In 3 schijven", d: "Gespreid over de looptijd van het project, zonder extra kosten." },
      { t: "Formule", d: "Lagere startprijs + maandelijks (site + Care samen). Ideaal om klein te starten." },
    ],
    faqEyebrow: "Vragen die vaak terugkomen",
    faqTitle: "Goed om te weten",
    faqs: [
      { q: "Kan ik later upgraden van Starter naar Pro?", a: "Ja. Je betaalt enkel het verschil + tijd voor de extra functies. Niets wordt opnieuw gefactureerd." },
      { q: "Wat als ik geen abonnement neem?", a: "Dan staat je site rustig op Vercel + Supabase free tier. Je betaalt zelf voor je domein. Wil je later support of updates? Dan factureer ik per uur (€95/u)." },
      { q: "Zit een logo of fotografie in de prijs?", a: "Werk je met je eigen foto's? Perfect, dan zit dat inbegrepen. Heb je niets bruikbaars? Dan boek je de module Fotoshoot (€450) — een halve dag pro shoot, webklaar. Een logo/huisstijl maak ik niet zelf, daarvoor werk ik met vaste partners." },
      { q: "Hoe lang duurt een project?", a: "Starter ~2 weken, Pro 4-6 weken, Webshop 6-10 weken vanaf de kick-off. Migraties hangen af van de hoeveelheid content." },
      { q: "Eerst gratis kennismaken?", a: "Altijd. Een eerste gesprek (digitaal of bij jou) is vrijblijvend en kost niets. Pas wanneer we beslissen om door te gaan, factureer ik 30% voorschot." },
    ],
    ctaTitle: "Niet zeker welk pakket bij jou past?",
    ctaIntro:
      "Stuur me een mailtje met wat je in gedachten hebt. Ik bereken kosteloos welke formule het meest steekhoudend is voor jouw zaak.",
    ctaButton: "Praat met me",
  },
  fr: {
    metaTitle: "Tarifs — Studio VM",
    heroEyebrow: "Tarifs",
    heroTitle: "Aucune surprise après coup.",
    heroIntro:
      "Forfaits et abonnements clairs, publiés sur cette page. Ce que vous lisez ici est ce que vous obtenez — et ce que vous payez.",
    oneShotEyebrow: "Unique",
    oneShotTitle: "Le coût d'un nouveau site",
    oneShotIntro: "Cinq forfaits. Prix honnête. Pas de devis avec astérisques.",
    subEyebrow: "Mensuel",
    subTitle: "Maintenance et croissance",
    subIntro:
      "Un nouveau site, c'est bien, mais un site vivant, c'est mieux. Choisissez selon votre niveau d'activité.",
    modEyebrow: "À la carte",
    modTitle: "Modules à ajouter",
    modIntro:
      "Avec chaque forfait. Uniquement ce dont vous avez besoin — jamais de fonctions inutilisées.",
    payEyebrow: "Paiement",
    payTitle: "Payer à votre rythme",
    payItems: [
      { t: "Unique", d: "Classique : 30 % d'acompte au départ, solde à la livraison." },
      { t: "En 3 fois", d: "Étalé sur la durée du projet, sans frais supplémentaires." },
      { t: "Formule", d: "Prix de départ réduit + mensuel (site + Care ensemble). Idéal pour démarrer petit." },
    ],
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Bon à savoir",
    faqs: [
      { q: "Puis-je passer plus tard de Starter à Pro ?", a: "Oui. Vous payez seulement la différence + le temps des fonctions supplémentaires. Rien n'est refacturé." },
      { q: "Et si je ne prends pas d'abonnement ?", a: "Votre site reste tranquillement sur Vercel + Supabase free tier. Vous payez votre domaine vous-même. Besoin de support ou de mises à jour plus tard ? Je facture à l'heure (€95/h)." },
      { q: "Un logo ou de la photographie sont-ils inclus ?", a: "Vous avez vos propres photos ? Parfait, c'est inclus. Rien d'exploitable ? Réservez le module Shooting photo (€450) — une demi-journée pro, prête pour le web. Je ne crée pas le logo/identité moi-même : je travaille avec des partenaires fixes." },
      { q: "Combien de temps dure un projet ?", a: "Starter ~2 semaines, Pro 4-6 semaines, Boutique 6-10 semaines depuis le lancement. Les migrations dépendent du volume de contenu." },
      { q: "Une première rencontre gratuite ?", a: "Toujours. Un premier entretien (en ligne ou chez vous) est sans engagement et gratuit. Ce n'est que si on décide de continuer que je facture 30 % d'acompte." },
    ],
    ctaTitle: "Pas sûr du forfait qui vous convient ?",
    ctaIntro:
      "Envoyez-moi un e-mail avec ce que vous avez en tête. Je calcule gratuitement la formule la plus pertinente pour votre activité.",
    ctaButton: "Discutons-en",
  },
  en: {
    metaTitle: "Pricing — Studio VM",
    heroEyebrow: "Pricing",
    heroTitle: "No surprises afterwards.",
    heroIntro:
      "Clear packages and subscriptions, published on this page. What you read here is what you get — and what you pay.",
    oneShotEyebrow: "One-off",
    oneShotTitle: "What a new site costs",
    oneShotIntro: "Five packages. Honestly priced. No quotes with asterisks.",
    subEyebrow: "Monthly",
    subTitle: "Maintenance and growth",
    subIntro:
      "A new site is nice, but a living site is better. Pick what fits how active you are.",
    modEyebrow: "À la carte",
    modTitle: "Add-on modules",
    modIntro:
      "With every package. Only what you need — you never pay for features you don't use.",
    payEyebrow: "Payment",
    payTitle: "Pay at your own pace",
    payItems: [
      { t: "One-off", d: "Classic: 30% deposit at start, balance on delivery." },
      { t: "In 3 instalments", d: "Spread over the project duration, at no extra cost." },
      { t: "Formula", d: "Lower start price + monthly (site + Care together). Ideal to start small." },
    ],
    faqEyebrow: "Questions that keep coming up",
    faqTitle: "Good to know",
    faqs: [
      { q: "Can I upgrade from Starter to Pro later?", a: "Yes. You only pay the difference + time for the extra features. Nothing is re-invoiced." },
      { q: "What if I don't take a subscription?", a: "Your site sits quietly on Vercel + Supabase free tier. You pay for your own domain. Want support or updates later? I bill by the hour (€95/h)." },
      { q: "Is a logo or photography included?", a: "Working with your own photos? Perfect, that's included. Nothing usable? Book the Photo shoot module (€450) — a half-day pro shoot, web-ready. I don't create the logo/brand identity myself; I work with fixed partners for that." },
      { q: "How long does a project take?", a: "Starter ~2 weeks, Pro 4-6 weeks, Webshop 6-10 weeks from kick-off. Migrations depend on the amount of content." },
      { q: "A free first meeting?", a: "Always. A first chat (online or at your place) is non-binding and free. Only when we decide to go ahead do I invoice a 30% deposit." },
    ],
    ctaTitle: "Not sure which package fits you?",
    ctaIntro:
      "Send me an email with what you have in mind. I'll work out — at no cost — which formula makes the most sense for your business.",
    ctaButton: "Let's talk",
  },
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const { oneShot, subscription, addons } = getPricing(locale);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.heroEyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.heroIntro}
          </p>
        </div>
      </section>

      <PricingSection
        eyebrow={c.oneShotEyebrow}
        title={c.oneShotTitle}
        intro={c.oneShotIntro}
        tiers={oneShot}
        locale={locale}
      />
      <PricingSection
        eyebrow={c.subEyebrow}
        title={c.subTitle}
        intro={c.subIntro}
        tiers={subscription}
        locale={locale}
        muted
      />

      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.modEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.modTitle}
            </h2>
            <p className="mt-4 text-muted">{c.modIntro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a) => (
              <div
                key={a.name}
                className="flex flex-col rounded-2xl border bg-card p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">{a.name}</h3>
                  <span className="whitespace-nowrap font-mono text-sm font-semibold text-accent">
                    {a.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.payEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.payTitle}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.payItems.map((p, i) => (
              <div
                key={p.t}
                className="rounded-2xl border bg-background p-6"
              >
                <span className="font-mono text-xs text-accent">
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
          <div className="mb-12 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.faqEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.faqTitle}
            </h2>
          </div>
          <dl className="space-y-6">
            {c.faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border bg-card p-6">
                <dt className="font-semibold">{faq.q}</dt>
                <dd className="mt-2 text-muted">{faq.a}</dd>
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
          <p className="mt-4 text-muted">{c.ctaIntro}</p>
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

function PricingSection({
  eyebrow,
  title,
  intro,
  tiers,
  locale,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  tiers: PricingTier[];
  locale: Locale;
  muted?: boolean;
}) {
  return (
    <section className={`border-b ${muted ? "bg-card" : ""}`}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted">{intro}</p>
        </div>
        <div
          className={`grid gap-6 sm:grid-cols-2 ${
            tiers.length >= 5
              ? "lg:grid-cols-3 xl:grid-cols-5"
              : tiers.length === 4
                ? "lg:grid-cols-4"
                : "lg:grid-cols-3"
          }`}
        >
          {tiers.map((tier) => (
            <TierCard key={tier.slug} tier={tier} locale={locale} muted={muted} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tier,
  locale,
  muted,
}: {
  tier: PricingTier;
  locale: Locale;
  muted: boolean;
}) {
  const baseClass = muted ? "bg-background" : "bg-card";
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        tier.highlighted
          ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
          : "border-border"
      } ${baseClass}`}
    >
      {tier.highlighted && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          {tier.tagline}
        </span>
      )}
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {tier.tagline}
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{tier.name}</h3>
      <div className="mt-6">
        <p className="text-3xl font-semibold tracking-tight">{tier.price}</p>
        <p className="mt-1 font-mono text-xs text-muted">{tier.priceNote}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
              strokeWidth={2.5}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={localePath(locale, tier.ctaHref)}
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
          tier.highlighted
            ? "bg-foreground text-background hover:opacity-90"
            : "border hover:bg-card-hover"
        }`}
      >
        {tier.ctaLabel}
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}
