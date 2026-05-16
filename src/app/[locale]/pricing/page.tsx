import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { getPricing, type PricingTier } from "@/lib/pricing";
import { openproviderConfigured } from "@/lib/openprovider";
import { DomainCheck } from "@/components/domain-check";
import { PricingCompare } from "@/components/pricing-compare";
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
    domEyebrow: string;
    domTitle: string;
    domIntro: string;
    domItems: { t: string; price: string; d: string }[];
    domNote: string;
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
      "Eén onderhoudsabonnement is verplicht vanaf maand 1 — je kiest vrij welk niveau, en je kan later in je klantenportaal zelf opgraden.",
    modEyebrow: "À la carte",
    modTitle: "Losse modules bij te bestellen",
    modIntro:
      "Bij elk pakket. Enkel wat je nodig hebt — je betaalt nooit voor functies die je niet gebruikt.",
    payEyebrow: "Betaalwijze",
    payTitle: "Vast bedrag, betalen op jouw tempo",
    payItems: [
      { t: "30% bij vastleggen", d: "Je stelt alles samen in de configurator en betaalt 30% aanbetaling om je scope vast te leggen." },
      { t: "Spreiding 0% toeslag", d: "Het saldo ineens of gespreid in 3×, 6×, 12× of 24× — zonder enige toeslag." },
      { t: "Directe-vastlegkorting", d: "Leg je meteen vast, dan 7% korting op het eenmalige bedrag. Geen sterretjes." },
    ],
    domEyebrow: "Domein & e-mail",
    domTitle: "Nog geen domein of e-mailadres?",
    domIntro:
      "Geen probleem — dat regelen wij voor je. Je blijft altijd 100% eigenaar van je domein, geen lock-in.",
    domItems: [
      { t: "Domein (.be / .com)", price: "€ 39 / jaar", d: "Wij registreren en beheren je domeinnaam. Jij blijft de eigenaar." },
      { t: "Domein + 1 e-mailadres", price: "€ 5 / maand", d: "Professioneel adres (jij@jouwzaak.be), spamfilter, op al je toestellen." },
      { t: "Domein + team-e-mail", price: "vanaf € 6 / gebruiker / maand", d: "Volwaardige mailbox via Google Workspace of Microsoft 365, met agenda & drive." },
      { t: "Domeinverhuis", price: "€ 75 vast", d: "We halen je domein volledig beheerd weg bij je huidige host (API-gedreven). Jij keurt 1× goed, wij doen de rest — meestal binnen enkele uren (.be), zonder downtime." },
    ],
    domNote:
      "Heb je al een domein of e-mail? Dan koppelen we dat kosteloos. Vaste prijzen, transparant — je kiest domein en e-mail mee in de configurator en het zit meteen in je totaal.",
    faqEyebrow: "Vragen die vaak terugkomen",
    faqTitle: "Goed om te weten",
    faqs: [
      { q: "Kan ik later upgraden van Starter naar Pro?", a: "Ja. Je betaalt enkel het verschil + tijd voor de extra functies. Je onderhoudsabonnement kan je zelf opgraden in je klantenportaal." },
      { q: "Is een onderhoudsabonnement verplicht?", a: "Ja, één abonnement is verplicht vanaf maand 1 — zo blijft je site veilig, up-to-date en gehost. Je kiest vrij welk niveau (Care/Plus/Scale/Partner), niet gekoppeld aan je pakket, en je kan later zelf opgraden." },
      { q: "Zit een logo of fotografie in de prijs?", a: "Werk je met je eigen foto's? Perfect, dan zit dat inbegrepen. Heb je niets bruikbaars? Dan vink je in de configurator de optie Fotoshoot (€450) aan — een halve dag pro shoot, webklaar. Een logo/huisstijl maak ik niet zelf, daarvoor werk ik met vaste partners." },
      { q: "Hoe lang duurt een project?", a: "Uitvoering is 1 à 2 weken — alles wordt strak herschreven in Next.js + Supabase, ongeacht de scope. Wat de timing bepaalt is de vrijgave van je domein en of er fotomateriaal klaar is." },
      { q: "Hoe leg ik alles vast?", a: "Via de configurator: je kiest pakket, onderhoud, domein en e-mail, ziet meteen je exacte vaste prijs, en betaalt 30% aanbetaling om je scope vast te leggen. Geen vrijblijvende offertes met sterretjes — wat je samenstelt, dat is de prijs." },
    ],
    ctaTitle: "Klaar om je prijs vast te zetten?",
    ctaIntro:
      "Stel in de configurator je pakket, onderhoud en domein samen. Je ziet meteen je exacte vaste prijs — geen offerte met sterretjes.",
    ctaButton: "Naar de configurator",
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
      "Un abonnement de maintenance est obligatoire dès le 1er mois — vous choisissez librement le niveau et pouvez évoluer plus tard depuis votre espace client.",
    modEyebrow: "À la carte",
    modTitle: "Modules à ajouter",
    modIntro:
      "Avec chaque forfait. Uniquement ce dont vous avez besoin — jamais de fonctions inutilisées.",
    payEyebrow: "Paiement",
    payTitle: "Prix fixe, payé à votre rythme",
    payItems: [
      { t: "30 % au verrouillage", d: "Vous composez tout dans le configurateur et payez 30 % d'acompte pour verrouiller votre scope." },
      { t: "Échelonnement 0 %", d: "Le solde en une fois ou en 3×, 6×, 12× ou 24× — sans aucun supplément." },
      { t: "Remise verrouillage", d: "Vous verrouillez tout de suite ? 7 % de remise sur le montant unique. Sans astérisques." },
    ],
    domEyebrow: "Domaine & e-mail",
    domTitle: "Pas encore de domaine ou d'e-mail ?",
    domIntro:
      "Aucun souci — on s'en occupe. Vous restez toujours 100 % propriétaire de votre domaine, sans lock-in.",
    domItems: [
      { t: "Domaine (.be / .com)", price: "€ 39 / an", d: "Nous enregistrons et gérons votre nom de domaine. Vous en restez propriétaire." },
      { t: "Domaine + 1 e-mail", price: "€ 5 / mois", d: "Adresse pro (vous@votresociete.be), anti-spam, sur tous vos appareils." },
      { t: "Domaine + e-mail d'équipe", price: "dès € 6 / utilisateur / mois", d: "Boîte complète via Google Workspace ou Microsoft 365, avec agenda & drive." },
      { t: "Transfert de domaine", price: "€ 75 forfait", d: "Nous rapatrions votre domaine, entièrement géré (piloté par API). Vous approuvez 1×, on fait le reste — souvent en quelques heures (.be), sans interruption." },
    ],
    domNote:
      "Vous avez déjà un domaine ou un e-mail ? On le relie gratuitement. Prix fixes, transparents — vous choisissez domaine et e-mail dans le configurateur et c'est directement dans votre total.",
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Bon à savoir",
    faqs: [
      { q: "Puis-je passer plus tard de Starter à Pro ?", a: "Oui. Vous payez seulement la différence + le temps des fonctions supplémentaires. Votre abonnement de maintenance, vous le faites évoluer vous-même depuis votre espace client." },
      { q: "Un abonnement de maintenance est-il obligatoire ?", a: "Oui, un abonnement est obligatoire dès le 1er mois — votre site reste ainsi sûr, à jour et hébergé. Vous choisissez librement le niveau (Care/Plus/Scale/Partner), non lié au forfait, et pouvez évoluer plus tard." },
      { q: "Un logo ou de la photographie sont-ils inclus ?", a: "Vous avez vos propres photos ? Parfait, c'est inclus. Rien d'exploitable ? Cochez l'option Shooting photo (€450) dans le configurateur — une demi-journée pro, prête pour le web. Je ne crée pas le logo/identité moi-même : je travaille avec des partenaires fixes." },
      { q: "Combien de temps dure un projet ?", a: "Réalisation en 1 à 2 semaines — tout est réécrit proprement en Next.js + Supabase, quelle que soit la portée. Ce qui détermine le timing : la libération de votre domaine et la disponibilité du matériel photo." },
      { q: "Comment est-ce que je verrouille tout ?", a: "Via le configurateur : vous choisissez forfait, maintenance, domaine et e-mail, voyez votre prix fixe exact et payez 30 % d'acompte pour verrouiller votre scope. Pas de devis avec astérisques — ce que vous composez, c'est le prix." },
    ],
    ctaTitle: "Prêt à fixer votre prix ?",
    ctaIntro:
      "Composez dans le configurateur votre forfait, maintenance et domaine. Vous voyez immédiatement votre prix fixe exact — sans astérisques.",
    ctaButton: "Vers le configurateur",
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
      "One maintenance subscription is required from month 1 — you freely pick the level and can upgrade yourself later from your client portal.",
    modEyebrow: "À la carte",
    modTitle: "Add-on modules",
    modIntro:
      "With every package. Only what you need — you never pay for features you don't use.",
    payEyebrow: "Payment",
    payTitle: "Fixed price, paid at your pace",
    payItems: [
      { t: "30% to lock in", d: "You compose everything in the configurator and pay a 30% deposit to lock your scope." },
      { t: "0% surcharge split", d: "The balance at once or in 3×, 6×, 12× or 24× — without any surcharge." },
      { t: "Lock-in discount", d: "Lock in straight away? 7% off the one-off amount. No asterisks." },
    ],
    domEyebrow: "Domain & email",
    domTitle: "No domain or email address yet?",
    domIntro:
      "No problem — we sort that for you. You always stay 100% owner of your domain, no lock-in.",
    domItems: [
      { t: "Domain (.be / .com)", price: "€ 39 / year", d: "We register and manage your domain name. You remain the owner." },
      { t: "Domain + 1 email", price: "€ 5 / month", d: "Professional address (you@yourbiz.be), spam filter, on all your devices." },
      { t: "Domain + team email", price: "from € 6 / user / month", d: "Full mailbox via Google Workspace or Microsoft 365, with calendar & drive." },
      { t: "Domain transfer", price: "€ 75 flat", d: "We move your domain over, fully managed (API-driven). You approve once, we do the rest — usually within hours (.be), zero downtime." },
    ],
    domNote:
      "Already have a domain or email? We connect it free of charge. Fixed prices, transparent — you pick domain and email in the configurator and it's in your total right away.",
    faqEyebrow: "Questions that keep coming up",
    faqTitle: "Good to know",
    faqs: [
      { q: "Can I upgrade from Starter to Pro later?", a: "Yes. You only pay the difference + time for the extra features. Your maintenance subscription you upgrade yourself from your client portal." },
      { q: "Is a maintenance subscription required?", a: "Yes, one subscription is required from month 1 — that keeps your site secure, up to date and hosted. You freely pick the level (Care/Plus/Scale/Partner), not tied to your package, and can upgrade later." },
      { q: "Is a logo or photography included?", a: "Working with your own photos? Perfect, that's included. Nothing usable? Tick the Photo shoot option (€450) in the configurator — a half-day pro shoot, web-ready. I don't create the logo/brand identity myself; I work with fixed partners for that." },
      { q: "How long does a project take?", a: "Build is 1 to 2 weeks — everything is cleanly rewritten in Next.js + Supabase, regardless of scope. Timing only depends on your domain release and whether photo material is ready." },
      { q: "How do I lock everything in?", a: "Via the configurator: you pick package, maintenance, domain and email, see your exact fixed price and pay a 30% deposit to lock your scope. No quotes with asterisks — what you compose is the price." },
    ],
    ctaTitle: "Ready to lock in your price?",
    ctaIntro:
      "Compose your package, maintenance and domain in the configurator. You see your exact fixed price right away — no quote with asterisks.",
    ctaButton: "To the configurator",
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
  const { oneShot, subscription } = getPricing(locale);

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
          <Link
            href={localePath(locale, "/offerte")}
            className="group/btn mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            {locale === "fr"
              ? "Composez votre prix exact"
              : locale === "en"
                ? "Build your exact price"
                : "Stel je exacte prijs samen"}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
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
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.domEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.domTitle}
            </h2>
            <p className="mt-4 text-muted">{c.domIntro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.domItems.map((d) => (
              <div
                key={d.t}
                className="flex flex-col rounded-2xl border bg-card p-6"
              >
                <h3 className="font-semibold">{d.t}</h3>
                <p className="mt-2 font-mono text-sm font-semibold text-accent">
                  {d.price}
                </p>
                <p className="mt-3 flex-1 text-sm text-muted">{d.d}</p>
              </div>
            ))}
          </div>
          {openproviderConfigured && (
            <DomainCheck
              locale={locale}
              contactHref={localePath(locale, "/#contact")}
            />
          )}
          <p className="mx-auto mt-8 max-w-2xl text-center font-mono text-xs text-muted">
            {c.domNote}
          </p>
        </div>
      </section>

      <PricingCompare locale={locale} />

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
            href={localePath(locale, "/offerte")}
            className="group/btn mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            {c.ctaButton}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
              strokeWidth={2.5}
            />
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
      <div className="mx-auto max-w-[88rem] px-6 py-20 sm:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted">{intro}</p>
        </div>
        <div
          className={`grid gap-5 ${
            tiers.length >= 5
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
              : tiers.length === 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-3"
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
      <p className="flex min-h-[2.5rem] items-start font-mono text-xs uppercase leading-snug tracking-widest text-muted">
        {tier.tagline}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{tier.name}</h3>
      {(() => {
        const m = tier.price.match(/^(vanaf|dès|from)\s+(.*)$/i);
        const lead = m ? m[1] : null;
        const main = m ? m[2] : tier.price;
        return (
          <div className="mt-6">
            <span className="block h-4 font-mono text-xs uppercase tracking-widest text-muted">
              {lead ?? " "}
            </span>
            <p className="whitespace-nowrap text-2xl font-semibold tracking-tight xl:text-3xl">
              {main}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {tier.priceNote}
            </p>
          </div>
        );
      })()}
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
        href={localePath(locale, "/offerte")}
        className={`group/btn mt-6 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
          tier.highlighted
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        {locale === "fr"
          ? "Composer"
          : locale === "en"
            ? "Compose"
            : "Samenstellen"}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
          strokeWidth={2.5}
        />
      </Link>
    </div>
  );
}
