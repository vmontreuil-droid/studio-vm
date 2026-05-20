import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { startHealthCheck } from "@/app/actions/health-check";

export const dynamic = "force-dynamic";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    sub: string;
    bullets: string[];
    formTitle: string;
    name: string;
    email: string;
    website: string;
    cta: string;
    price: string;
    fine: string;
  }
> = {
  nl: {
    eyebrow: "Site Health Check — €99",
    title:
      "Krijg een eerlijk, concreet rapport van je website binnen 24 uur.",
    sub: "Ik scan je site, schrijf een rapport van 3-5 bladzijden over wat sterk is en wat kapot is, en bel je 30 min om alles door te lopen. Geen verkooppraat — wel duidelijkheid.",
    bullets: [
      "Volledige scan: snelheid, mobiel, SEO, veiligheid, platform",
      "Top-3 prioriteiten met concrete fix-stappen",
      "Persoonlijk rapport via je eigen klantenportaal",
      "30 min videocall met mij om alles uit te leggen",
      "Geen abonnement, geen vervolgverkoop",
    ],
    formTitle: "Start je Health Check",
    name: "Naam",
    email: "E-mailadres",
    website: "Jouw website",
    cta: "Betaal €99 en start",
    price: "Eenmalig, all-in",
    fine: "Veilige betaling via Mollie. Bancontact, kaart, overschrijving.",
  },
  fr: {
    eyebrow: "Site Health Check — 99€",
    title:
      "Recevez un rapport honnête et concret de votre site sous 24h.",
    sub: "Je scanne votre site, j'écris un rapport de 3-5 pages sur ce qui est solide et ce qui est cassé, et je vous appelle 30 min pour tout passer en revue. Pas de discours commercial — juste de la clarté.",
    bullets: [
      "Scan complet : vitesse, mobile, SEO, sécurité, plateforme",
      "Top-3 priorités avec étapes concrètes",
      "Rapport personnel via votre portail client",
      "Appel vidéo de 30 min avec moi pour tout expliquer",
      "Pas d'abonnement, pas de vente suivie",
    ],
    formTitle: "Lancez votre Health Check",
    name: "Nom",
    email: "Adresse e-mail",
    website: "Votre site",
    cta: "Payer 99€ et démarrer",
    price: "Unique, tout compris",
    fine: "Paiement sécurisé via Mollie. Bancontact, carte, virement.",
  },
  en: {
    eyebrow: "Site Health Check — €99",
    title:
      "Get an honest, concrete report on your website within 24 hours.",
    sub: "I scan your site, write a 3-5 page report on what's solid and what's broken, and call you for 30 min to go through everything. No sales pitch — just clarity.",
    bullets: [
      "Complete scan: speed, mobile, SEO, security, platform",
      "Top-3 priorities with concrete fix steps",
      "Personal report via your client portal",
      "30 min video call with me to explain it all",
      "No subscription, no follow-up sales pressure",
    ],
    formTitle: "Start your Health Check",
    name: "Name",
    email: "Email address",
    website: "Your website",
    cta: "Pay €99 and start",
    price: "One-off, all-in",
    fine: "Secure payment via Mollie. Bancontact, card, transfer.",
  },
};

export default async function SiteHealthCheck({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{t.sub}</p>
          <ul className="mt-10 space-y-3">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  strokeWidth={2}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="rounded-3xl bg-background p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t.formTitle}
            </h2>
            <form action={startHealthCheck} className="mt-6 space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.name}</span>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.email}</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.website}</span>
                <input
                  name="website"
                  required
                  placeholder="bv. monsite.be"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <div>
                  <p className="text-3xl font-bold tracking-tight">€99</p>
                  <p className="text-xs text-muted">{t.price}</p>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t.cta}
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-xs text-muted">{t.fine}</p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
