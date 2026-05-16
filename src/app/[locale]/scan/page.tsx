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
      { t: "Snelheid", d: "Ik meet reactietijd (TTFB), HTML-gewicht, compressie en render-blokkerende scripts. Trage sites laten bezoekers afhaken vóór ze iets zien — je weet meteen of dat bij jou speelt." },
      { t: "Platform", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js… plus je hosting en wie de site bouwde. Geen oordeel, gewoon helder wat er onder de motorkap zit." },
      { t: "SEO-basis", d: "Titel, meta-omschrijving, Open Graph, één H1 en de koppenhiërarchie — precies waar Google naar kijkt. Kleine dingen met grote impact op je vindbaarheid." },
      { t: "Veiligheid", d: "HTTPS/TLS, security headers, Content-Security-Policy, X-Frame-Options en HSTS. Dit beschermt jou én je bezoekers; we tonen rustig wat er ontbreekt en waarom 't telt." },
      { t: "Mobiel & Core Web Vitals", d: "Viewport-meta, mobielvriendelijkheid en een inschatting van het Core-Web-Vitals-risico. De meerderheid surft mobiel — dit zegt of dat goed zit." },
      { t: "Vindbaarheid", d: "robots/noindex, sitemap, soft-404's, dode links en canonical. Zodat Google je niet per ongeluk overslaat — vaak een vergeten instelling, makkelijk recht te zetten." },
      { t: "Cookies & GDPR", d: "Cookie-/consentbanner en externe trackers. Laden zónder geldige toestemming is een boeterisico — we zeggen eerlijk of je veilig zit." },
      { t: "Onderhoudslast", d: "Plugin-stapeling, inline-stijlen en verouderde libraries. Dit zijn de verborgen kosten en risico's op termijn — goed om te weten vóór ze opspelen." },
      { t: "Afbeeldingen", d: "Alt-teksten, lazy-loading en responsieve beelden. Goed voor snelheid én toegankelijkheid; meestal in een paar ingrepen op te lossen." },
      { t: "Domein & e-mail", d: "SPF, DMARC en MX-records. Zonder SPF/DMARC kan iemand mails versturen die lijken te komen van jouw domein — phishing in jouw naam. We checken of dat dichtzit." },
      { t: "Structured data", d: "Schema.org / JSON-LD voor rich results in Google (sterren, FAQ, bedrijfsinfo). Aanwezig = je valt visueel meer op in de zoekresultaten." },
      { t: "Toegankelijkheid", d: "Alt-teksten, logische koppenstructuur en taal-attribuut. Beter voor screenreaders én voor SEO — en het hoeft je niets extra te kosten." },
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
      { t: "Vitesse", d: "Je mesure le temps de réponse (TTFB), le poids HTML, la compression et les scripts bloquants. Un site lent fait fuir avant même l'affichage — vous saurez tout de suite si c'est votre cas." },
      { t: "Plateforme", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js… plus l'hébergement et qui a fait le site. Pas de jugement, juste ce qu'il y a sous le capot." },
      { t: "Base SEO", d: "Titre, meta-description, Open Graph, un seul H1 et la hiérarchie des titres — exactement ce que Google regarde. De petits détails à fort impact." },
      { t: "Sécurité", d: "HTTPS/TLS, headers de sécurité, Content-Security-Policy, X-Frame-Options et HSTS. Cela vous protège, vous et vos visiteurs ; on montre calmement ce qui manque." },
      { t: "Mobile & Core Web Vitals", d: "Meta viewport, compatibilité mobile et estimation du risque Core Web Vitals. La majorité navigue sur mobile — ceci dit si c'est en ordre." },
      { t: "Visibilité", d: "robots/noindex, sitemap, soft-404, liens morts, canonical. Pour que Google ne vous saute pas par erreur — souvent un réglage oublié, vite corrigé." },
      { t: "Cookies & RGPD", d: "Bannière de consentement et traceurs externes. Charger sans accord valable est un risque d'amende — on vous dit honnêtement si c'est bon." },
      { t: "Charge d'entretien", d: "Empilement de plugins, styles inline, librairies obsolètes. Ce sont les coûts et risques cachés à terme — bon à savoir avant qu'ils ne surgissent." },
      { t: "Images", d: "Textes alt, lazy-loading et images responsives. Bon pour la vitesse et l'accessibilité ; généralement réglé en quelques interventions." },
      { t: "Domaine & e-mail", d: "SPF, DMARC et enregistrements MX. Sans SPF/DMARC, n'importe qui peut envoyer des mails au nom de votre domaine — du phishing en votre nom. On vérifie." },
      { t: "Données structurées", d: "Schema.org / JSON-LD pour les rich results Google (étoiles, FAQ, infos société). Présent = vous ressortez plus dans les résultats." },
      { t: "Accessibilité", d: "Textes alt, structure de titres logique et attribut de langue. Mieux pour les lecteurs d'écran et le SEO — sans coût supplémentaire." },
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
      { t: "Speed", d: "I measure response time (TTFB), HTML weight, compression and render-blocking scripts. Slow sites lose visitors before anything shows — you'll know at once if that's you." },
      { t: "Platform", d: "WordPress, Shopify, Squarespace, Wix, Webflow, Next.js… plus your hosting and who built it. No judgement, just what's under the hood." },
      { t: "SEO basics", d: "Title, meta description, Open Graph, single H1 and heading hierarchy — exactly what Google looks at. Small things, big impact on findability." },
      { t: "Security", d: "HTTPS/TLS, security headers, Content-Security-Policy, X-Frame-Options and HSTS. This protects you and your visitors; we calmly show what's missing and why it matters." },
      { t: "Mobile & Core Web Vitals", d: "Viewport meta, mobile-friendliness and a Core Web Vitals risk estimate. Most people browse on mobile — this tells you if that's solid." },
      { t: "Findability", d: "robots/noindex, sitemap, soft 404s, dead links, canonical. So Google doesn't skip you by accident — often a forgotten setting, easy to fix." },
      { t: "Cookies & GDPR", d: "Cookie/consent banner and external trackers. Loading without valid consent is a fine risk — we tell you honestly whether you're safe." },
      { t: "Maintenance load", d: "Plugin stacking, inline styles and outdated libraries. These are the hidden costs and risks over time — good to know before they bite." },
      { t: "Images", d: "Alt text, lazy-loading and responsive images. Good for speed and accessibility; usually fixed in a few steps." },
      { t: "Domain & email", d: "SPF, DMARC and MX records. Without SPF/DMARC anyone can send mail that looks like it's from your domain — phishing in your name. We check it's locked down." },
      { t: "Structured data", d: "Schema.org / JSON-LD for Google rich results (stars, FAQ, business info). Present = you stand out more in the results." },
      { t: "Accessibility", d: "Alt text, a logical heading structure and the language attribute. Better for screen readers and SEO — at no extra cost to you." },
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
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.howTitle}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
