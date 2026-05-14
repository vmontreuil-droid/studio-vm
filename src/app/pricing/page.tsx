import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { oneShotTiers, subscriptionTiers, type PricingTier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing — Studio VM",
  description:
    "Eerlijke, transparante prijzen voor websites, webshops en abonnementen. Van Starter tot Custom, met of zonder maandelijks onderhoud.",
};

export default function PricingPage() {
  return (
    <main>
      <Hero />
      <PricingSection
        eyebrow="Eenmalig"
        title="Wat een nieuwe site kost"
        intro="Vier pakketten. Eerlijk geprijsd. Geen offertes met sterretjes."
        tiers={oneShotTiers}
      />
      <PricingSection
        eyebrow="Maandelijks"
        title="Onderhoud en doorgroei"
        intro="Een nieuwe site is mooi, maar een levende site is beter. Kies wat past bij hoe actief je bent."
        tiers={subscriptionTiers}
        muted
      />
      <PricingFAQ />
      <ClosingCTA />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
          Pricing
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Geen verrassingen achteraf.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Heldere pakketten en abonnementen, gepubliceerd op deze pagina. Wat je hier leest
          is wat je krijgt — en wat je betaalt.
        </p>
      </div>
    </section>
  );
}

function PricingSection({
  eyebrow,
  title,
  intro,
  tiers,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  tiers: PricingTier[];
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <TierCard key={tier.slug} tier={tier} muted={muted} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({ tier, muted }: { tier: PricingTier; muted: boolean }) {
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
        href={tier.ctaHref}
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

const faqs = [
  {
    q: "Kan ik later upgraden van Starter naar Pro?",
    a: "Ja. Je betaalt enkel het verschil + tijd voor de extra functies. Niets wordt opnieuw gefactureerd.",
  },
  {
    q: "Wat als ik geen abonnement neem?",
    a: "Dan staat je site rustig op Vercel + Supabase free tier. Je betaalt zelf voor je domein. Wil je later support of updates? Dan factureer ik per uur (€95/u).",
  },
  {
    q: "Zit een logo of fotografie in de prijs?",
    a: "Nee — ik werk met je bestaande huisstijl en foto's. Heb je nog niets? Dan verwijs ik je door naar een grafisch ontwerper of fotograaf waar ik graag mee samenwerk.",
  },
  {
    q: "Hoe lang duurt een project?",
    a: "Starter ~2 weken, Pro 4-6 weken, Webshop 6-10 weken vanaf de kick-off. Migraties hangen af van de hoeveelheid content.",
  },
  {
    q: "Eerst gratis kennismaken?",
    a: "Altijd. Een eerste gesprek (digitaal of bij jou) is vrijblijvend en kost niets. Pas wanneer we beslissen om door te gaan, factureer ik 30% voorschot.",
  },
];

function PricingFAQ() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Vragen die vaak terugkomen
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Goed om te weten
          </h2>
        </div>
        <dl className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border bg-card p-6">
              <dt className="font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Niet zeker welk pakket bij jou past?
        </h2>
        <p className="mt-4 text-muted">
          Stuur me een mailtje met wat je in gedachten hebt. Ik bereken kosteloos welke
          formule het meest steekhoudend is voor jouw zaak.
        </p>
        <Link
          href="/#contact"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Praat met me
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
