import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";
import { ScanReport } from "@/components/scan-report";
import { requireAdmin } from "@/lib/admin-auth";
import { getOutreachConfig } from "@/lib/admin/outreach";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Row = { email: string; url: string; scan: ScanResult; created_at: string };

const C: Record<
  Locale,
  {
    backToPortal: string;
    backToAdmin: string;
    eyebrow: string;
    title: string;
    intro: string;
    meta: Record<string, string>;
    catLabel: Record<string, string>;
    cats: string;
    pitfalls: string;
    why: string;
    fix: string;
    none: string;
    nextTitle: string;
    quote: string;
    quoteD: string;
    talk: string;
    talkD: string;
    build: string;
    buildD: string;
    rescan: string;
    scannedOn: string;
  }
> = {
  nl: {
    backToPortal: "Terug naar je portaal",
    backToAdmin: "Terug naar admin",
    eyebrow: "Jouw analyse",
    title: "Volledige site-analyse",
    intro:
      "Dit is je persoonlijke, eerlijke rapport. Bewaar deze link — hij blijft geldig.",
    meta: {
      stack: "Stack",
      hosting: "Hosting",
      builtBy: "Gemaakt door",
      speed: "Reactietijd",
      cwv: "Core Web Vitals-risico",
    },
    catLabel: {
      speed: "Snelheid",
      seo: "SEO",
      mobile: "Mobiel",
      security: "Veiligheid",
      platform: "Platform",
    },
    cats: "Per categorie",
    pitfalls: "Waar de valkuilen zitten",
    why: "Waarom dit telt",
    fix: "Wat ik eraan doe",
    none: "Geen grote valkuilen gevonden — netjes.",
    nextTitle: "De volgende stap",
    quote: "Vraag je exacte offerte",
    quoteD: "Op basis van wat hier rood staat: een vaste prijs, vooraf.",
    talk: "Plan een gesprek",
    talkD: "Liever eerst overleggen? Stuur me kort je situatie.",
    build: "Bouw zelf je voorontwerp",
    buildD: "Klik je nieuwe site in elkaar; ik werk 'm af.",
    rescan: "Opnieuw scannen",
    scannedOn: "Gescand op",
  },
  fr: {
    backToPortal: "Retour à votre portail",
    backToAdmin: "Retour à l'admin",
    eyebrow: "Votre analyse",
    title: "Analyse complète du site",
    intro:
      "Voici votre rapport personnel et honnête. Gardez ce lien — il reste valable.",
    meta: {
      stack: "Stack",
      hosting: "Hébergement",
      builtBy: "Réalisé par",
      speed: "Temps de réponse",
      cwv: "Risque Core Web Vitals",
    },
    catLabel: {
      speed: "Vitesse",
      seo: "SEO",
      mobile: "Mobile",
      security: "Sécurité",
      platform: "Plateforme",
    },
    cats: "Par catégorie",
    pitfalls: "Où sont les pièges",
    why: "Pourquoi c'est important",
    fix: "Ce que j'y fais",
    none: "Aucun gros piège trouvé — propre.",
    nextTitle: "L'étape suivante",
    quote: "Demandez votre devis exact",
    quoteD: "Sur base de ce qui est en rouge ici : un prix fixe, à l'avance.",
    talk: "Planifier un échange",
    talkD: "Vous préférez d'abord en parler ? Décrivez votre situation.",
    build: "Construisez votre maquette",
    buildD: "Composez votre nouveau site ; je le finalise.",
    rescan: "Rescanner",
    scannedOn: "Scanné le",
  },
  en: {
    backToPortal: "Back to your portal",
    backToAdmin: "Back to admin",
    eyebrow: "Your analysis",
    title: "Full site analysis",
    intro:
      "This is your personal, honest report. Keep this link — it stays valid.",
    meta: {
      stack: "Stack",
      hosting: "Hosting",
      builtBy: "Built by",
      speed: "Response time",
      cwv: "Core Web Vitals risk",
    },
    catLabel: {
      speed: "Speed",
      seo: "SEO",
      mobile: "Mobile",
      security: "Security",
      platform: "Platform",
    },
    cats: "By category",
    pitfalls: "Where the pitfalls are",
    why: "Why it matters",
    fix: "What I'll do about it",
    none: "No major pitfalls found — clean.",
    nextTitle: "The next step",
    quote: "Get your exact quote",
    quoteD: "Based on what's red here: a fixed price, upfront.",
    talk: "Schedule a chat",
    talkD: "Rather talk first? Send me your situation briefly.",
    build: "Build your own draft",
    buildD: "Click your new site together; I finish it.",
    rescan: "Scan again",
    scannedOn: "Scanned on",
  },
};

export default async function ScanPortalPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = C[locale];

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("email, url, scan, created_at")
    .eq("token", token)
    .maybeSingle();
  const row = data as Row | null;
  if (!row || !row.scan || !row.scan.ok) notFound();
  const s = row.scan;

  // Outreach-tracking: als deze token gekoppeld is aan een prospect,
  // log de opening. Idempotent (overschrijft niet als al gelogd).
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    try {
      await getSupabaseAdmin()
        .from("prospect_outreach")
        .update({
          opened_at: new Date().toISOString(),
          status: "geopend",
          updated_at: new Date().toISOString(),
        })
        .eq("scan_token", token)
        .is("opened_at", null);
    } catch {
      /* niet kritisch, log enkel als het kan */
    }
  }
  const outreachCfg = await getOutreachConfig();
  const backHref = isAdmin
    ? "/admin/scans"
    : localePath(locale, `/portail/${token}`);
  const backLabel = isAdmin ? c.backToAdmin : c.backToPortal;

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {backLabel}
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{c.intro}</p>

          <div className="mt-10 flex flex-wrap items-center gap-6 rounded-2xl bg-card shadow-sm p-6">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent">
              <span className="text-3xl font-bold">{s.grade}</span>
              <span className="font-mono text-[10px] text-muted">
                {s.score}/100
              </span>
            </div>
            <div className="min-w-0">
              <a
                href={s.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all font-medium text-accent underline"
              >
                {s.finalUrl}
              </a>
              <p className="mt-1 font-mono text-xs text-muted">
                {c.scannedOn}{" "}
                {new Date(row.created_at).toLocaleString("nl-BE", {
                  timeZone: "Europe/Brussels",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <ScanReport scan={s} locale={locale} />
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.nextTitle}
          </h2>
          {outreachCfg.calLink && (
            <a
              href={outreachCfg.calLink}
              target="_blank"
              rel="noreferrer"
              className="mt-8 flex flex-col items-start rounded-2xl bg-accent p-6 text-white shadow-md transition-opacity hover:opacity-95 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <span className="block text-lg font-semibold">
                  {locale === "fr"
                    ? "Réservez 30 min — gratuit"
                    : locale === "en"
                      ? "Book a free 30-min call"
                      : "Boek een gratis videocall van 30 min"}
                </span>
                <span className="mt-1 block text-sm opacity-90">
                  {locale === "fr"
                    ? "Je parcours votre rapport en direct et propose un plan d'action."
                    : locale === "en"
                      ? "I walk you through your report live and propose an action plan."
                      : "Ik loop live door je rapport en stel een actieplan voor."}
                </span>
              </span>
              <ArrowRight
                className="mt-4 h-5 w-5 sm:mt-0"
                strokeWidth={2.5}
              />
            </a>
          )}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: c.quote, d: c.quoteD, href: "/offerte" },
              { t: c.talk, d: c.talkD, href: "/#contact" },
              { t: c.build, d: c.buildD, href: "/builder" },
            ].map((b) => (
              <Link
                key={b.t}
                href={localePath(locale, b.href)}
                className="group flex flex-col rounded-2xl bg-card shadow-sm p-6 transition-colors hover:bg-card-hover"
              >
                <span className="font-semibold tracking-tight">{b.t}</span>
                <span className="mt-2 flex-1 text-sm text-muted">{b.d}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  {b.t}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={localePath(locale, "/scan")}
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            {c.rescan}
          </Link>
        </div>
      </section>
    </main>
  );
}
