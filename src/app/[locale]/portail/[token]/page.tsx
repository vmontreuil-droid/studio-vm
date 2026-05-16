import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, BarChart3, FileText, MousePointerClick, MessageCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Row = { email: string; url: string; scan: ScanResult; created_at: string };

const C: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    scannedOn: string;
    cards: {
      analyse: { t: string; d: string };
      offerte: { t: string; d: string };
      builder: { t: string; d: string };
      contact: { t: string; d: string };
    };
    open: string;
  }
> = {
  nl: {
    eyebrow: "Jouw klantenportaal",
    title: "Welkom in je portaal",
    intro:
      "Hier staat alles voor jou klaar — je volledige, eerlijke site-analyse, een offerte op maat en de manier om aan de slag te gaan. Bewaar deze link; hij blijft geldig.",
    scannedOn: "Gescand op",
    cards: {
      analyse: {
        t: "Mijn volledige analyse",
        d: "Score, valkuilen, alle bevindingen, technologie, security, SEO én het herbouwplan met prijs.",
      },
      offerte: {
        t: "Mijn offerte op maat",
        d: "Een vaste prijs vooraf, gebaseerd op wat in jouw analyse rood staat.",
      },
      builder: {
        t: "Bouw je voorontwerp",
        d: "Klik je nieuwe site visueel in elkaar; ik werk 'm af.",
      },
      contact: {
        t: "Plan een gesprek",
        d: "Liever eerst overleggen? Stuur me kort je situatie.",
      },
    },
    open: "Openen",
  },
  fr: {
    eyebrow: "Votre portail client",
    title: "Bienvenue dans votre portail",
    intro:
      "Tout est prêt pour vous ici — votre analyse de site complète et honnête, un devis sur mesure et la façon de démarrer. Gardez ce lien ; il reste valable.",
    scannedOn: "Scanné le",
    cards: {
      analyse: {
        t: "Mon analyse complète",
        d: "Score, pièges, toutes les constatations, technologie, sécurité, SEO et le plan de reconstruction avec prix.",
      },
      offerte: {
        t: "Mon devis sur mesure",
        d: "Un prix fixe à l'avance, basé sur ce qui est en rouge dans votre analyse.",
      },
      builder: {
        t: "Construisez votre maquette",
        d: "Composez visuellement votre nouveau site ; je le finalise.",
      },
      contact: {
        t: "Planifier un échange",
        d: "Vous préférez d'abord en parler ? Décrivez votre situation.",
      },
    },
    open: "Ouvrir",
  },
  en: {
    eyebrow: "Your client portal",
    title: "Welcome to your portal",
    intro:
      "Everything is ready for you here — your complete, honest site analysis, a tailored quote and the way to get started. Keep this link; it stays valid.",
    scannedOn: "Scanned on",
    cards: {
      analyse: {
        t: "My full analysis",
        d: "Score, pitfalls, all findings, technology, security, SEO and the rebuild plan with pricing.",
      },
      offerte: {
        t: "My tailored quote",
        d: "A fixed price upfront, based on what's red in your analysis.",
      },
      builder: {
        t: "Build your own draft",
        d: "Visually click your new site together; I finish it.",
      },
      contact: {
        t: "Schedule a chat",
        d: "Rather talk first? Send me your situation briefly.",
      },
    },
    open: "Open",
  },
};

export default async function PortalHome({
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

  const cards = [
    {
      ...c.cards.analyse,
      href: `/portail/scan/${token}`,
      icon: BarChart3,
      primary: true,
    },
    { ...c.cards.offerte, href: "/offerte", icon: FileText, primary: false },
    {
      ...c.cards.builder,
      href: "/builder",
      icon: MousePointerClick,
      primary: false,
    },
    { ...c.cards.contact, href: "/#contact", icon: MessageCircle, primary: false },
  ];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{c.intro}</p>

          <div className="mt-10 flex flex-wrap items-center gap-6 rounded-2xl border bg-card p-6">
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
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((b) => {
              const Icon = b.icon;
              return (
                <Link
                  key={b.t}
                  href={localePath(locale, b.href)}
                  className={`group flex flex-col rounded-2xl border p-6 transition-colors ${
                    b.primary
                      ? "border-accent/40 bg-accent/5 hover:bg-accent/10"
                      : "bg-card hover:bg-card-hover"
                  }`}
                >
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
                  <span className="mt-4 text-lg font-semibold tracking-tight">
                    {b.t}
                  </span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {b.d}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {c.open}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
