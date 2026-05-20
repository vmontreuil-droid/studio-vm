import { notFound } from "next/navigation";
import {
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Video,
  ArrowRight,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";
import { buildActionPlan, type ActionItem } from "@/lib/health-check-actionplan";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type Hc = {
  id: string;
  email: string;
  website: string;
  locale: string;
  scan: ScanResult | null;
  scan_token: string;
  status: string;
  paid_at: string | null;
  action_plan: ActionItem[] | null;
};

const T: Record<
  Locale,
  {
    premium: string;
    paidOn: string;
    title: string;
    intro: string;
    score: string;
    actionPlan: string;
    actionIntro: string;
    prioLabel: Record<"kritiek" | "belangrijk" | "optioneel", string>;
    why: string;
    fix: string;
    impact: string;
    nextTitle: string;
    callTitle: string;
    callSub: string;
    callCta: string;
    print: string;
    catLabel: Record<string, string>;
  }
> = {
  nl: {
    premium: "✨ Site Health Check — Premium-rapport",
    paidOn: "Betaald op",
    title: "Je volledig rapport + persoonlijk actieplan",
    intro:
      "Dit is wat een gewone bezoeker NIET ziet bij de gratis scan. Per bevinding krijg je waarom het telt, wat het impact is, en exact wat je moet doen — geordend op prioriteit.",
    score: "Hoofdscore",
    actionPlan: "Je actieplan",
    actionIntro:
      "Punten op volgorde van impact. De kritieke eerst — daar verlies je nú al geld of vertrouwen. De belangrijke daarna. De optionele zijn quick wins.",
    prioLabel: {
      kritiek: "Kritiek",
      belangrijk: "Belangrijk",
      optioneel: "Quick win",
    },
    why: "Waarom dit telt",
    fix: "Wat je doet",
    impact: "Impact als je niets doet",
    nextTitle: "Liever niet zelf doen?",
    callTitle: "Plan een gratis 30-min videocall",
    callSub:
      "Ik loop het rapport live met je door, beantwoord vragen, en zeg eerlijk of je het zelf kan of beter laat doen.",
    callCta: "Boek je call",
    print: "Afdrukken / PDF",
    catLabel: {
      speed: "Snelheid",
      seo: "SEO",
      mobile: "Mobiel",
      security: "Veiligheid",
      platform: "Platform",
    },
  },
  fr: {
    premium: "✨ Site Health Check — Rapport Premium",
    paidOn: "Payé le",
    title: "Votre rapport complet + plan d'action personnel",
    intro:
      "Ce que le scan gratuit ne montre PAS. Pour chaque point : pourquoi c'est important, l'impact, et exactement quoi faire — par ordre de priorité.",
    score: "Score principal",
    actionPlan: "Votre plan d'action",
    actionIntro:
      "Points dans l'ordre d'impact. Les critiques d'abord — vous y perdez déjà de l'argent ou de la confiance. Puis les importants. Les optionnels sont des quick wins.",
    prioLabel: {
      kritiek: "Critique",
      belangrijk: "Important",
      optioneel: "Quick win",
    },
    why: "Pourquoi c'est important",
    fix: "Que faire",
    impact: "Impact si on ne fait rien",
    nextTitle: "Vous préférez ne pas le faire vous-même ?",
    callTitle: "Planifiez un appel vidéo de 30 min — gratuit",
    callSub:
      "Je passe le rapport en revue avec vous, réponds aux questions, et vous dis honnêtement si vous pouvez le faire vous-même.",
    callCta: "Réserver",
    print: "Imprimer / PDF",
    catLabel: {
      speed: "Vitesse",
      seo: "SEO",
      mobile: "Mobile",
      security: "Sécurité",
      platform: "Plateforme",
    },
  },
  en: {
    premium: "✨ Site Health Check — Premium Report",
    paidOn: "Paid on",
    title: "Your full report + personal action plan",
    intro:
      "What the free scan does NOT show. Per finding: why it matters, the impact, and exactly what to do — ordered by priority.",
    score: "Main score",
    actionPlan: "Your action plan",
    actionIntro:
      "Items in impact order. Criticals first — you're losing money or trust right now. Then the importants. Optionals are quick wins.",
    prioLabel: {
      kritiek: "Critical",
      belangrijk: "Important",
      optioneel: "Quick win",
    },
    why: "Why it matters",
    fix: "What to do",
    impact: "Impact if you do nothing",
    nextTitle: "Rather not do it yourself?",
    callTitle: "Book a free 30-min video call",
    callSub:
      "I walk through the report with you live, answer questions, and tell you honestly if you can do it yourself or better outsource.",
    callCta: "Book your call",
    print: "Print / PDF",
    catLabel: {
      speed: "Speed",
      seo: "SEO",
      mobile: "Mobile",
      security: "Security",
      platform: "Platform",
    },
  },
};

const PRINT_CSS = `@page { margin: 16mm 12mm; }
@media print {
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

const PRIO_COLOR: Record<ActionItem["priority"], string> = {
  kritiek:
    "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
  belangrijk:
    "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  optioneel:
    "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300",
};
const PRIO_ICON: Record<ActionItem["priority"], typeof AlertCircle> = {
  kritiek: AlertCircle,
  belangrijk: AlertTriangle,
  optioneel: CheckCircle2,
};

export default async function HealthCheckReport({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("health_checks")
    .select(
      "id, email, website, locale, scan, scan_token, status, paid_at, action_plan",
    )
    .eq("scan_token", token)
    .maybeSingle();
  const hc = data as Hc | null;
  if (!hc || !hc.scan || !hc.scan.ok) notFound();

  // Fall-back: als action_plan nog niet weggeschreven is, bouwen we
  // hem hier on-the-fly zodat de pagina sowieso werkt.
  let plan: ActionItem[] = hc.action_plan ?? [];
  if (plan.length === 0) {
    plan = buildActionPlan(hc.scan, locale);
  }
  const cfg = await getOutreachConfig();

  const s = hc.scan;
  const host = s.host;
  const d = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "nl" ? "nl-BE" : locale, {
          timeZone: "Europe/Brussels",
        })
      : "—";

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <section className="no-print border-b">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.premium}
          </p>
          <PrintButton label={t.print} />
        </div>
      </section>

      <div id="print-area">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-accent/10 to-transparent">
          <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              {t.premium}
            </div>
            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-muted">{t.intro}</p>

            <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent">
                <span className="text-3xl font-bold">{s.grade}</span>
                <span className="font-mono text-[10px] text-muted">
                  {s.score}/100
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {t.score} · {host}
                </p>
                <p className="mt-1 break-all font-medium">{s.finalUrl}</p>
                <p className="mt-1 text-xs text-muted">
                  {t.paidOn} {d(hc.paid_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Per-categorie scorelat */}
        <section className="border-b">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {s.categories.map((c) => (
                <div
                  key={c.cat}
                  className="rounded-xl bg-card p-4 shadow-sm"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {t.catLabel[c.cat] ?? c.cat}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold tracking-tight ${
                      c.score >= 75
                        ? "text-green-600 dark:text-green-400"
                        : c.score >= 45
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-500"
                    }`}
                  >
                    {c.score}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action plan */}
        <section className="border-b">
          <div className="mx-auto max-w-4xl px-6 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.actionPlan}
            </h2>
            <p className="mt-2 max-w-2xl text-muted">{t.actionIntro}</p>

            <ol className="mt-8 space-y-4">
              {plan.map((it, idx) => {
                const Icon = PRIO_ICON[it.priority];
                return (
                  <li
                    key={`${it.title}-${idx}`}
                    className="rounded-2xl bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-sm font-bold text-accent">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">
                            {it.title}
                          </h3>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                            {t.catLabel[it.cat] ?? it.cat}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${PRIO_COLOR[it.priority]}`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {t.prioLabel[it.priority]}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {t.why}
                        </p>
                        <p className="mt-1 text-sm">{it.why}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {t.fix}
                        </p>
                        <p className="mt-1 text-sm">{it.fix}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {t.impact}
                        </p>
                        <p className="mt-1 text-sm">{it.impact}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Call CTA */}
        {cfg.calLink && (
          <section className="no-print border-b">
            <div className="mx-auto max-w-4xl px-6 py-12">
              <a
                href={cfg.calLink}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-start gap-4 rounded-3xl bg-accent p-8 text-white shadow-md transition-opacity hover:opacity-95 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <Video className="h-8 w-8 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-80">
                      {t.nextTitle}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {t.callTitle}
                    </p>
                    <p className="mt-1 text-sm opacity-90">{t.callSub}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent">
                  {t.callCta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </a>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
