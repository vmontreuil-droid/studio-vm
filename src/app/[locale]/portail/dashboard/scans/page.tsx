import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T, type ScanRow } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    none: string;
    analysis: string;
    expand: string;
    tech: string;
    hosting: string;
    builtBy: string;
    speed: string;
    cwv: string;
    perCat: string;
    pitfalls: string;
    noPitfalls: string;
    full: string;
  }
> = {
  nl: {
    none: "Nog geen scans op dit adres.",
    analysis: "Analyse",
    expand: "Klik om de analyse te bekijken",
    tech: "Technologie",
    hosting: "Hosting",
    builtBy: "Gemaakt met",
    speed: "Reactietijd",
    cwv: "CWV-risico",
    perCat: "Per categorie",
    pitfalls: "Valkuilen",
    noPitfalls: "Geen grote valkuilen gevonden.",
    full: "Open volledige analyse",
  },
  fr: {
    none: "Aucun scan sur cette adresse.",
    analysis: "Analyse",
    expand: "Cliquez pour voir l'analyse",
    tech: "Technologie",
    hosting: "Hébergement",
    builtBy: "Construit avec",
    speed: "Temps de réponse",
    cwv: "Risque CWV",
    perCat: "Par catégorie",
    pitfalls: "Pièges",
    noPitfalls: "Aucun piège majeur trouvé.",
    full: "Ouvrir l'analyse complète",
  },
  en: {
    none: "No scans on this address yet.",
    analysis: "Analysis",
    expand: "Click to view the analysis",
    tech: "Technology",
    hosting: "Hosting",
    builtBy: "Built with",
    speed: "Response time",
    cwv: "CWV risk",
    perCat: "Per category",
    pitfalls: "Pitfalls",
    noPitfalls: "No major pitfalls found.",
    full: "Open full analysis",
  },
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function PortalScans({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("scan_requests")
    .select("token, url, scan, created_at")
    .order("created_at", { ascending: false });
  const scans = (data as ScanRow[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.scans}
      </h1>
      <div className="mt-8 space-y-3">
        {scans.length === 0 && <p className="text-sm text-muted">{l.none}</p>}
        {scans.map((s) => {
          const ok = s.scan && s.scan.ok ? s.scan : null;
          return (
            <details
              key={s.token}
              className="group rounded-2xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 list-none">
                <div className="min-w-0">
                  <p className="font-medium">
                    {ok ? `${ok.grade} · ${ok.score}/100` : "—"}{" "}
                    <span className="text-muted">
                      · {ok ? ok.host : s.url}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {dt(s.created_at, locale)} · {l.expand}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors group-hover:bg-card-hover">
                  {l.analysis}
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    strokeWidth={2}
                  />
                </span>
              </summary>

              {ok && (
                <div className="mt-5 border-t pt-5">
                  <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    <Fact
                      label="Site"
                      value={
                        <a
                          href={ok.finalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-accent underline"
                        >
                          {ok.finalUrl}
                        </a>
                      }
                    />
                    <Fact
                      label="Score"
                      value={`${ok.grade} — ${ok.score}/100`}
                    />
                    <Fact label={l.tech} value={ok.stack} />
                    <Fact label={l.hosting} value={ok.hosting ?? "—"} />
                    <Fact label={l.builtBy} value={ok.builtBy ?? "—"} />
                    <Fact
                      label={l.speed}
                      value={`${ok.responseMs} ms · ${ok.htmlKb} KB · ${l.cwv} ${ok.cwvRisk}`}
                    />
                    <Fact
                      label={l.perCat}
                      value={ok.categories
                        .map((c) => `${c.cat} ${c.score}`)
                        .join(" · ")}
                    />
                  </dl>
                  <div className="mt-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.pitfalls}
                    </p>
                    {ok.pitfalls.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {ok.pitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        {l.noPitfalls}
                      </p>
                    )}
                  </div>
                  <Link
                    href={localePath(locale, `/portail/scan/${s.token}`)}
                    className="mt-5 inline-flex rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                  >
                    {l.full} →
                  </Link>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </>
  );
}
