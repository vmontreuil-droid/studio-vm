import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import {
  getPricing,
  FLAT_OFFER,
  CUSTOM_OFFER,
  type PricingTier,
} from "@/lib/pricing";
import { openproviderConfigured } from "@/lib/openprovider";
import { DomainCheck } from "@/components/domain-check";
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
    heroCta: string;
    offerEyebrow: string;
    offerTitle: string;
    offerIntro: string;
    customLabel: string;
    subEyebrow: string;
    subTitle: string;
    subIntro: string;
    howEyebrow: string;
    howTitle: string;
    howItems: { t: string; d: string }[];
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
    heroTitle: "Eén prijs. Alles inbegrepen.",
    heroIntro:
      "Geen offertes met sterretjes, geen eenmalige bouwfactuur. Ik bouw je website, host 'm, hou 'm veilig en up-to-date — voor één vast bedrag per maand.",
    heroCta: "Start een gesprek",
    offerEyebrow: "Het aanbod",
    offerTitle: "Wat een website kost",
    offerIntro:
      "Voor een gewone website betaal je één maandprijs — bouw inbegrepen, geen opstartkost. Webshops en maatwerk bespreken we apart.",
    customLabel: "Of grotere plannen?",
    subEyebrow: "Meer nodig?",
    subTitle: "Upgrades voor wie meer wil",
    subIntro:
      "Het €49-pakket dekt alles voor een gewone site. Heb je meer support-uren, content-werk of nieuwe features nodig, dan klim je naar een hoger niveau — wanneer jij wil.",
    howEyebrow: "Zo werkt het",
    howTitle: "Eerlijk en zonder verrassingen",
    howItems: [
      {
        t: "Geen opstartkost",
        d: "Je betaalt niets vooraf voor de bouw. We starten, ik bouw je site, en je betaalt gewoon je eerste maand.",
      },
      {
        t: "12 maanden, dan vrij",
        d: "Eén jaar minimum — zo is de bouw eerlijk verdeeld. Daarna maandelijks opzegbaar, geen kleine lettertjes.",
      },
      {
        t: "Alles in één bedrag",
        d: "Bouw, hosting, onderhoud, updates en support zitten samen in je maandprijs. Nooit een onverwachte factuur.",
      },
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
      "Heb je al een domein of e-mail? Dan koppelen we dat kosteloos. Vaste prijzen, transparant.",
    faqEyebrow: "Vragen die vaak terugkomen",
    faqTitle: "Goed om te weten",
    faqs: [
      { q: "Zit de bouw van de site echt in die €49?", a: "Ja. Er is geen aparte bouwfactuur. Ik bouw je site volledig op maat en de kost daarvan is verrekend over je abonnement — daarom een minimum van 12 maanden." },
      { q: "Waarom 12 maanden minimum?", a: "Omdat de bouw reële uren kost die niet apart gefactureerd worden. Het jaar verdeelt die eerlijk. Na die 12 maanden ben je volledig vrij en maandelijks opzegbaar." },
      { q: "Wat als ik een webshop of iets op maat nodig heb?", a: "Dat valt buiten het vaste maandtarief. Webshops, integraties (boekhouding, CRM), migraties of een systeem op maat bespreken we apart — scope en prijs op aanvraag." },
      { q: "Zit een logo of fotografie in de prijs?", a: "Werk je met je eigen foto's? Perfect, dat zit inbegrepen. Heb je niets bruikbaars? Dan regelen we een fotoshoot apart. Een logo/huisstijl maak ik niet zelf — daarvoor werk ik met vaste partners." },
      { q: "Van wie is mijn website en domein?", a: "Van jou. Je blijft altijd eigenaar van je domein, geen lock-in. Stop je ooit, dan kan je site mee." },
      { q: "Hoe lang duurt het voor mijn site online staat?", a: "De bouw is 1 à 2 weken. Wat de timing bepaalt is vooral de vrijgave van je domein en of er fotomateriaal klaar is." },
    ],
    ctaTitle: "Klaar om te starten?",
    ctaIntro:
      "Eén korte babbel en ik weet genoeg om je site te bouwen. Geen opstartkost, geen verrassingen.",
    ctaButton: "Neem contact op",
  },
  fr: {
    metaTitle: "Tarifs — Studio VM",
    heroEyebrow: "Tarifs",
    heroTitle: "Un prix. Tout inclus.",
    heroIntro:
      "Pas de devis avec astérisques, pas de facture de construction unique. Je construis votre site, je l'héberge, je le garde sûr et à jour — pour un montant fixe par mois.",
    heroCta: "Démarrer la conversation",
    offerEyebrow: "L'offre",
    offerTitle: "Le coût d'un site",
    offerIntro:
      "Pour un site classique, vous payez un prix mensuel — construction incluse, sans frais de démarrage. Boutiques et sur-mesure se discutent à part.",
    customLabel: "Ou de plus grands projets ?",
    subEyebrow: "Besoin de plus ?",
    subTitle: "Évolutions pour aller plus loin",
    subIntro:
      "Le forfait à €49 couvre tout pour un site classique. Besoin de plus d'heures de support, de contenu ou de nouvelles fonctions ? Vous montez de niveau quand vous voulez.",
    howEyebrow: "Comment ça marche",
    howTitle: "Honnête et sans surprises",
    howItems: [
      {
        t: "Sans frais de démarrage",
        d: "Vous ne payez rien d'avance pour la construction. On démarre, je construis votre site, et vous payez simplement votre premier mois.",
      },
      {
        t: "12 mois, puis libre",
        d: "Un an minimum — la construction est ainsi répartie équitablement. Ensuite résiliable chaque mois, sans petits caractères.",
      },
      {
        t: "Tout en un montant",
        d: "Construction, hébergement, maintenance, mises à jour et support sont compris dans votre prix mensuel. Jamais de facture inattendue.",
      },
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
      "Vous avez déjà un domaine ou un e-mail ? On le relie gratuitement. Prix fixes, transparents.",
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Bon à savoir",
    faqs: [
      { q: "La construction du site est-elle vraiment dans ces €49 ?", a: "Oui. Il n'y a pas de facture de construction séparée. Je construis votre site entièrement sur mesure et ce coût est réparti sur votre abonnement — d'où le minimum de 12 mois." },
      { q: "Pourquoi un minimum de 12 mois ?", a: "Parce que la construction représente des heures réelles qui ne sont pas facturées à part. L'année les répartit équitablement. Après ces 12 mois, vous êtes libre et résiliable chaque mois." },
      { q: "Et si j'ai besoin d'une boutique ou de sur-mesure ?", a: "Cela sort du tarif mensuel fixe. Boutiques, intégrations (compta, CRM), migrations ou système sur mesure se discutent à part — scope et prix sur demande." },
      { q: "Un logo ou de la photographie sont-ils inclus ?", a: "Vous avez vos propres photos ? Parfait, c'est inclus. Rien d'exploitable ? On organise un shooting à part. Je ne crée pas le logo/identité moi-même : je travaille avec des partenaires fixes." },
      { q: "À qui appartiennent mon site et mon domaine ?", a: "À vous. Vous restez toujours propriétaire de votre domaine, sans lock-in. Si vous arrêtez un jour, votre site peut partir avec vous." },
      { q: "Combien de temps avant que mon site soit en ligne ?", a: "La construction prend 1 à 2 semaines. Le timing dépend surtout de la libération de votre domaine et de la disponibilité du matériel photo." },
    ],
    ctaTitle: "Prêt à démarrer ?",
    ctaIntro:
      "Une courte discussion et j'en sais assez pour construire votre site. Sans frais de démarrage, sans surprises.",
    ctaButton: "Prendre contact",
  },
  en: {
    metaTitle: "Pricing — Studio VM",
    heroEyebrow: "Pricing",
    heroTitle: "One price. All included.",
    heroIntro:
      "No quotes with asterisks, no one-off build invoice. I build your website, host it, keep it secure and up to date — for one fixed monthly amount.",
    heroCta: "Start a chat",
    offerEyebrow: "The offer",
    offerTitle: "What a website costs",
    offerIntro:
      "For a regular website you pay one monthly price — build included, no setup fee. Webshops and custom work we discuss separately.",
    customLabel: "Or bigger plans?",
    subEyebrow: "Need more?",
    subTitle: "Upgrades for those who want more",
    subIntro:
      "The €49 package covers everything for a regular site. Need more support hours, content work or new features? You move up a level whenever you want.",
    howEyebrow: "How it works",
    howTitle: "Honest and without surprises",
    howItems: [
      {
        t: "No setup fee",
        d: "You pay nothing up front for the build. We start, I build your site, and you simply pay your first month.",
      },
      {
        t: "12 months, then free",
        d: "One year minimum — that spreads the build fairly. After that, cancel any month, no small print.",
      },
      {
        t: "Everything in one amount",
        d: "Build, hosting, maintenance, updates and support are all in your monthly price. Never an unexpected invoice.",
      },
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
      "Already have a domain or email? We connect it free of charge. Fixed prices, transparent.",
    faqEyebrow: "Questions that keep coming up",
    faqTitle: "Good to know",
    faqs: [
      { q: "Is building the site really in that €49?", a: "Yes. There's no separate build invoice. I build your site fully bespoke and that cost is spread across your subscription — which is why there's a 12-month minimum." },
      { q: "Why a 12-month minimum?", a: "Because the build is real hours that aren't billed separately. The year spreads them fairly. After those 12 months you're completely free and can cancel any month." },
      { q: "What if I need a webshop or something custom?", a: "That sits outside the fixed monthly rate. Webshops, integrations (accounting, CRM), migrations or a custom system we discuss separately — scope and price on request." },
      { q: "Is a logo or photography included?", a: "Working with your own photos? Perfect, that's included. Nothing usable? We arrange a shoot separately. I don't create the logo/brand identity myself; I work with fixed partners for that." },
      { q: "Who owns my website and domain?", a: "You do. You always stay owner of your domain, no lock-in. If you ever stop, your site can come with you." },
      { q: "How long until my site is online?", a: "The build is 1 to 2 weeks. Timing mostly depends on your domain release and whether photo material is ready." },
    ],
    ctaTitle: "Ready to start?",
    ctaIntro:
      "One short chat and I know enough to build your site. No setup fee, no surprises.",
    ctaButton: "Get in touch",
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
  const { subscription } = getPricing(locale);
  const flat = FLAT_OFFER[locale];
  const custom = CUSTOM_OFFER[locale];
  // Upgrades = abonnementen boven het €49-instappakket (Care).
  const upgrades = subscription.filter((t) => t.slug !== "care");

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 pb-12 pt-20 text-center sm:pb-14 sm:pt-24">
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
            href={localePath(locale, "/#contact")}
            className="group/btn mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            {c.heroCta}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </section>

      {/* Hoofd-aanbod: één vlakke maandprijs + webshop/maatwerk op aanvraag */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.offerEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.offerTitle}
            </h2>
            <p className="mt-4 text-muted">{c.offerIntro}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            {/* €49 all-in */}
            <div className="relative flex flex-col rounded-3xl border border-accent bg-accent/5 p-8 shadow-[0_0_0_1px_var(--accent)] sm:p-10">
              <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {flat.badge}
              </span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {flat.name}
              </h3>
              <div className="mt-5 flex items-baseline gap-2">
                <p className="text-5xl font-semibold tracking-tight">
                  {flat.price}
                </p>
                <span className="text-sm text-muted">{flat.priceNote}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-accent">{flat.terms}</p>
              <ul className="mt-7 grid flex-1 gap-2.5 sm:grid-cols-2">
                {flat.features.map((f) => (
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
                href={localePath(locale, flat.ctaHref)}
                className="group/btn mt-8 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md active:scale-[0.98]"
              >
                {flat.ctaLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </div>

            {/* Webshop & maatwerk — op aanvraag */}
            <div className="flex flex-col rounded-3xl border bg-card p-8 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.customLabel}
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                {custom.name}
              </h3>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {custom.price}
              </p>
              <p className="mt-3 text-sm text-muted">{custom.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {custom.features.map((f) => (
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
                href={localePath(locale, custom.ctaHref)}
                className="group/btn mt-8 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {custom.ctaLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.howEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.howTitle}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.howItems.map((p, i) => (
              <div key={p.t} className="rounded-2xl border bg-background p-6">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrades (Plus / Scale / Partner) */}
      <PricingSection
        eyebrow={c.subEyebrow}
        title={c.subTitle}
        intro={c.subIntro}
        tiers={upgrades}
        locale={locale}
        muted
      />

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
              {lead ?? " "}
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
        href={localePath(locale, "/#contact")}
        className={`group/btn mt-6 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
          tier.highlighted
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        {locale === "fr"
          ? "Prendre contact"
          : locale === "en"
            ? "Get in touch"
            : "Neem contact op"}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
          strokeWidth={2.5}
        />
      </Link>
    </div>
  );
}
