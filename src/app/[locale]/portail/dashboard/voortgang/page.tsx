import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { PORTAL_T, PROGRESS_STEPS, type Progress } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const STEP_LABEL: Record<Locale, Record<string, string>> = {
  nl: {
    briefing: "Briefing",
    ontwerp: "Ontwerp",
    bouw: "Bouw",
    online: "Online",
    nazorg: "Nazorg",
  },
  fr: {
    briefing: "Briefing",
    ontwerp: "Design",
    bouw: "Construction",
    online: "En ligne",
    nazorg: "Suivi",
  },
  en: {
    briefing: "Briefing",
    ontwerp: "Design",
    bouw: "Build",
    online: "Live",
    nazorg: "Aftercare",
  },
};
const L: Record<Locale, { none: string; sub: string }> = {
  nl: {
    none: "Je project is nog niet gestart. Zodra we beginnen zie je hier elke stap.",
    sub: "Waar staat je project vandaag.",
  },
  fr: {
    none: "Votre projet n'a pas encore démarré. Dès qu'on commence, chaque étape s'affiche ici.",
    sub: "Où en est votre projet aujourd'hui.",
  },
  en: {
    none: "Your project hasn't started yet. As soon as we begin, every step shows here.",
    sub: "Where your project stands today.",
  },
};

export default async function PortalProgress({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];
  const lbl = STEP_LABEL[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("project_progress")
    .select("*")
    .maybeSingle();
  const p = data as Progress | null;
  const currentIdx = p
    ? PROGRESS_STEPS.indexOf(p.step as (typeof PROGRESS_STEPS)[number])
    : -1;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.progress}
      </h1>
      <p className="mt-3 text-sm text-muted">{l.sub}</p>

      {currentIdx < 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
          {l.none}
        </p>
      ) : (
        <>
          <ol className="mt-8 space-y-3">
            {PROGRESS_STEPS.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <li
                  key={s}
                  className={`flex items-center gap-4 rounded-2xl border p-5 ${
                    active ? "border-accent/50 bg-accent/5" : "bg-card"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : active
                          ? "bg-accent text-background"
                          : "bg-card-hover text-muted"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`font-medium ${
                      active ? "text-foreground" : done ? "" : "text-muted"
                    }`}
                  >
                    {lbl[s] ?? s}
                  </span>
                </li>
              );
            })}
          </ol>
          {p?.note && (
            <div className="mt-6 rounded-2xl border bg-card p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {p.note}
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
