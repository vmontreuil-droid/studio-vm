import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { eur, dt, badge, PORTAL_T, type Sub } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<Locale, { none: string; per: string; since: string }> = {
  nl: { none: "Geen lopend abonnement.", per: "/ maand", since: "sinds" },
  fr: { none: "Aucun abonnement en cours.", per: "/ mois", since: "depuis" },
  en: { none: "No active subscription.", per: "/ month", since: "since" },
};

export default async function PortalSubscription({
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
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  const subs = (data as Sub[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.subscription}
      </h1>
      <div className="mt-8 space-y-3">
        {subs.length === 0 && <p className="text-sm text-muted">{l.none}</p>}
        {subs.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
          >
            <div>
              <p className="font-semibold tracking-tight">{s.plan}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {eur(s.price_cents)} {l.per} · {l.since}{" "}
                {dt(s.started_at, locale)}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                s.status,
              )}`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
