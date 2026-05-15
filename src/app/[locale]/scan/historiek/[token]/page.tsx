import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const C: Record<
  Locale,
  {
    eyebrow: string;
    title: (h: string) => string;
    lead: string;
    score: string;
    grade: string;
    stack: string;
    cert: string;
    days: string;
    none: string;
    history: string;
    when: string;
    cta: string;
    unsub: string;
    notFound: string;
  }
> = {
  nl: {
    eyebrow: "Monitoring",
    title: (h) => `Historiek van ${h}`,
    lead: "Elke week opnieuw gecontroleerd. Hieronder de evolutie van je score en de laatste meting.",
    score: "Score",
    grade: "Cijfer",
    stack: "Platform",
    cert: "Certificaat",
    days: "dagen",
    none: "Nog geen metingen — de eerste volgt automatisch.",
    history: "Verloop",
    when: "Wanneer",
    cta: "Laat dit oplossen",
    unsub: "Monitoring stoppen",
    notFound: "Deze monitoring-link bestaat niet (meer).",
  },
  fr: {
    eyebrow: "Suivi",
    title: (h) => `Historique de ${h}`,
    lead: "Vérifié chaque semaine. Ci-dessous l'évolution de votre score et la dernière mesure.",
    score: "Score",
    grade: "Note",
    stack: "Plateforme",
    cert: "Certificat",
    days: "jours",
    none: "Pas encore de mesures — la première suit automatiquement.",
    history: "Évolution",
    when: "Quand",
    cta: "Faites corriger ça",
    unsub: "Arrêter le suivi",
    notFound: "Ce lien de suivi n'existe pas (plus).",
  },
  en: {
    eyebrow: "Monitoring",
    title: (h) => `History of ${h}`,
    lead: "Re-checked every week. Below the evolution of your score and the latest measurement.",
    score: "Score",
    grade: "Grade",
    stack: "Platform",
    cert: "Certificate",
    days: "days",
    none: "No measurements yet — the first follows automatically.",
    history: "Trend",
    when: "When",
    cta: "Have this fixed",
    unsub: "Stop monitoring",
    notFound: "This monitoring link does not exist (anymore).",
  },
};

function hostOf(u: string) {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const w = 600;
  const h = 120;
  const max = 100;
  const step = w / (pts.length - 1);
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="var(--accent)" opacity="0.08" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (p / max) * h}
          r="3"
          fill="var(--accent)"
        />
      ))}
    </svg>
  );
}

export default async function MonitorHistory({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: locRaw, token } = await params;
  const locale: Locale = isValidLocale(locRaw) ? locRaw : DEFAULT_LOCALE;
  const t = C[locale];

  if (!monitorConfigured || !token) notFound();

  const db = getSupabaseAdmin();
  const { data: mon } = await db
    .from("monitors")
    .select("id, url, token")
    .eq("token", token)
    .maybeSingle();

  if (!mon) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="text-lg text-muted">{t.notFound}</p>
        <Link
          href={localePath(locale, "/scan")}
          className="mt-6 inline-block text-accent underline"
        >
          studio-vm.be/scan
        </Link>
      </div>
    );
  }

  const { data: scans } = await db
    .from("monitor_scans")
    .select("scanned_at, score, grade, stack, cert_days_left")
    .eq("monitor_id", mon.id)
    .order("scanned_at", { ascending: true })
    .limit(60);

  const rows = scans ?? [];
  const latest = rows[rows.length - 1];
  const host = hostOf(mon.url);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(
      locale === "en" ? "en-GB" : `${locale}-BE`,
      { day: "2-digit", month: "short", year: "numeric" },
    );

  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
          {t.eyebrow}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.title(host)}
        </h1>
        <p className="mt-4 max-w-xl text-muted">{t.lead}</p>

        {rows.length === 0 ? (
          <p className="mt-10 rounded-2xl border bg-card p-6 text-muted">
            {t.none}
          </p>
        ) : (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              {[
                [t.score, `${latest.score ?? "—"}/100`],
                [t.grade, latest.grade ?? "—"],
                [t.stack, latest.stack ?? "—"],
                [
                  t.cert,
                  latest.cert_days_left != null
                    ? `${latest.cert_days_left} ${t.days}`
                    : "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border bg-card p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {k}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                {t.history}
              </p>
              <div className="mt-4">
                <Spark
                  pts={rows.map((r) => r.score ?? 0).filter((n) => n > 0)}
                />
              </div>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {[...rows].reverse().slice(0, 12).map((r) => (
                    <tr key={r.scanned_at} className="border-t">
                      <td className="py-2 text-muted">
                        {fmtDate(r.scanned_at)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {r.grade} · {r.score}/100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={localePath(locale, "/#contact")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <a
            href={`/api/monitor/unsubscribe?token=${mon.token}`}
            className="text-sm text-muted underline"
          >
            {t.unsub}
          </a>
        </div>
      </div>
    </section>
  );
}
