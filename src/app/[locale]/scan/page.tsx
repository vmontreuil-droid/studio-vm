import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteScanner } from "@/components/site-scanner";
import { monitorConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const copy: Record<
  Locale,
  {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    title: string;
    lead: string;
    how: { t: string; d: string }[];
    howTitle: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
  }
> = {
  nl: {
    metaTitle: "Gratis site-scan — Studio VM",
    metaDesc:
      "Geef je huidige website-adres in en krijg meteen een eerlijke scan: snelheid, HTTPS, gedetecteerd platform, mobiel, SEO-basis.",
    eyebrow: "Gratis scan",
    title: "Hoe gezond is je huidige site?",
    lead: "Geen e-mail, geen account, geen verkooptrechter. Geef je adres in en ik haal je site live op vanaf mijn server en geef je een eerlijk rapport — inclusief wat ik eraan zou doen.",
    howTitle: "Wat ik check",
    how: [
      { t: "Snelheid", d: "Reactietijd (TTFB), HTML-gewicht, compressie, render-blokkerende scripts — waar bezoekers op afhaken." },
      { t: "Platform", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js... + hosting en wie de site bouwde — uit headers en HTML." },
      { t: "SEO-basis", d: "Titel, meta-omschrijving, Open Graph, één H1, koppenhiërarchie — waar Google op let." },
      { t: "Veiligheid", d: "HTTPS/TLS, security headers, Content-Security-Policy, X-Frame-Options, HSTS — beschermt jou én je bezoekers." },
      { t: "Mobiel & Core Web Vitals", d: "Viewport-meta, mobielvriendelijkheid en een inschatting van het Core-Web-Vitals-risico." },
      { t: "Vindbaarheid", d: "robots/noindex, sitemap, soft-404's, dode links, canonical — zodat Google je niet links laat liggen." },
      { t: "Cookies & GDPR", d: "Cookie-/consentbanner en externe trackers — laden zónder toestemming is een boeterisico." },
      { t: "Onderhoudslast", d: "Plugin-stapeling, inline-stijlen, verouderde libraries — verborgen kosten en risico's." },
      { t: "Afbeeldingen", d: "Alt-teksten, lazy-loading en responsieve beelden — voor snelheid én toegankelijkheid." },
    ],
    ctaTitle: "Liever dat ik er zelf naar kijk?",
    ctaText: "Een scan is een momentopname. Voor een grondige analyse + concreet plan: stuur een bericht.",
    ctaButton: "Vraag een grondige analyse",
  },
  fr: {
    metaTitle: "Scan de site gratuit — Studio VM",
    metaDesc:
      "Entrez l'adresse de votre site actuel et obtenez un scan honnête : vitesse, HTTPS, plateforme détectée, mobile, base SEO.",
    eyebrow: "Scan gratuit",
    title: "Quelle est la santé de votre site actuel ?",
    lead: "Pas d'e-mail, pas de compte, pas d'entonnoir commercial. Entrez votre adresse, je récupère votre site en direct depuis mon serveur et vous donne un rapport honnête — avec ce que je ferais.",
    howTitle: "Ce que je vérifie",
    how: [
      { t: "Vitesse", d: "Temps de réponse (TTFB), poids HTML, compression, scripts bloquants — ce qui fait fuir les visiteurs." },
      { t: "Plateforme", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js... + hébergement et qui a fait le site — via headers et HTML." },
      { t: "Base SEO", d: "Titre, meta-description, Open Graph, un seul H1, hiérarchie des titres — ce que Google regarde." },
      { t: "Sécurité", d: "HTTPS/TLS, headers de sécurité, Content-Security-Policy, X-Frame-Options, HSTS — vous protège, vous et vos visiteurs." },
      { t: "Mobile & Core Web Vitals", d: "Meta viewport, compatibilité mobile et estimation du risque Core Web Vitals." },
      { t: "Visibilité", d: "robots/noindex, sitemap, soft-404, liens morts, canonical — pour que Google ne vous ignore pas." },
      { t: "Cookies & RGPD", d: "Bannière de consentement et traceurs externes — charger sans accord est un risque d'amende." },
      { t: "Charge d'entretien", d: "Empilement de plugins, styles inline, librairies obsolètes — coûts et risques cachés." },
      { t: "Images", d: "Textes alt, lazy-loading et images responsives — pour la vitesse et l'accessibilité." },
    ],
    ctaTitle: "Vous préférez que je regarde moi-même ?",
    ctaText: "Un scan est un instantané. Pour une analyse approfondie + plan concret : envoyez un message.",
    ctaButton: "Demander une analyse approfondie",
  },
  en: {
    metaTitle: "Free site scan — Studio VM",
    metaDesc:
      "Enter your current website address and get an honest scan right away: speed, HTTPS, detected platform, mobile, SEO basics.",
    eyebrow: "Free scan",
    title: "How healthy is your current site?",
    lead: "No email, no account, no sales funnel. Enter your address and I fetch your site live from my server and give you an honest report — including what I'd do about it.",
    howTitle: "What I check",
    how: [
      { t: "Speed", d: "Response time (TTFB), HTML weight, compression, render-blocking scripts — what visitors bounce on." },
      { t: "Platform", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js... + hosting and who built it — from headers and HTML." },
      { t: "SEO basics", d: "Title, meta description, Open Graph, single H1, heading hierarchy — what Google looks at." },
      { t: "Security", d: "HTTPS/TLS, security headers, Content-Security-Policy, X-Frame-Options, HSTS — protects you and your visitors." },
      { t: "Mobile & Core Web Vitals", d: "Viewport meta, mobile-friendliness and a Core Web Vitals risk estimate." },
      { t: "Findability", d: "robots/noindex, sitemap, soft 404s, dead links, canonical — so Google doesn't skip you." },
      { t: "Cookies & GDPR", d: "Cookie/consent banner and external trackers — loading without consent is a fine risk." },
      { t: "Maintenance load", d: "Plugin stacking, inline styles, outdated libraries — hidden costs and risks." },
      { t: "Images", d: "Alt text, lazy-loading and responsive images — for speed and accessibility." },
    ],
    ctaTitle: "Rather have me look at it myself?",
    ctaText: "A scan is a snapshot. For a thorough analysis + concrete plan: send a message.",
    ctaButton: "Request a thorough analysis",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const c = copy[locale];
  return { title: c.metaTitle, description: c.metaDesc };
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.lead}
          </p>
          <div className="mt-10">
            <SiteScanner monitorEnabled={monitorConfigured} />
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.howTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {c.how.map((h) => (
              <div key={h.t} className="rounded-2xl border bg-background p-6">
                <h3 className="font-semibold tracking-tight">{h.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{h.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{c.ctaText}</p>
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
