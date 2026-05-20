import { notFound } from "next/navigation";
import {
  Globe,
  Server,
  Calendar,
  Building,
  Network,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T, type Site } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    none: string;
    sub: string;
    domain: string;
    registrar: string;
    renewal: string;
    hosting: string;
    dns: string;
    daysLeft: string;
    expired: string;
    soon: string;
    safe: string;
    sites: string;
  }
> = {
  nl: {
    none: "Nog geen domein- of hosting-info. Zodra je site bij mij draait staat het hier.",
    sub: "Je domein, vervaldatum, hosting en DNS — transparant op één plek.",
    domain: "Domein",
    registrar: "Registrar",
    renewal: "Verloopt op",
    hosting: "Hosting",
    dns: "DNS",
    daysLeft: "d resterend",
    expired: "VERLOPEN",
    soon: "Bijna",
    safe: "Veilig",
    sites: "sites",
  },
  fr: {
    none: "Pas encore d'infos domaine/hébergement. Dès que votre site tourne chez moi, c'est ici.",
    sub: "Votre domaine, échéance, hébergement et DNS — au même endroit.",
    domain: "Domaine",
    registrar: "Registrar",
    renewal: "Expire le",
    hosting: "Hébergement",
    dns: "DNS",
    daysLeft: "j restant",
    expired: "EXPIRÉ",
    soon: "Bientôt",
    safe: "Sûr",
    sites: "sites",
  },
  en: {
    none: "No domain/hosting info yet. As soon as your site runs with me it shows here.",
    sub: "Your domain, renewal, hosting and DNS — transparent in one place.",
    domain: "Domain",
    registrar: "Registrar",
    renewal: "Renews on",
    hosting: "Hosting",
    dns: "DNS",
    daysLeft: "d left",
    expired: "EXPIRED",
    soon: "Soon",
    safe: "Safe",
    sites: "sites",
  },
};

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.round(ms / 86_400_000);
}

export default async function PortalDomain({
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
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });
  const sites = ((data as Site[]) ?? []).filter(
    (s) => s.domain || s.hosting || s.registrar || s.dns_note,
  );

  // Counters voor at-a-glance status
  const renewalsSoon = sites.filter((s) => {
    const d = daysUntil(s.domain_renewal);
    return d !== null && d < 30;
  }).length;
  const totalSites = sites.length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <Globe className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.domain}
            </h1>
            <p className="mt-0.5 text-sm text-muted">{l.sub}</p>
          </div>
        </div>
        {totalSites > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Globe className="h-3 w-3" strokeWidth={2.5} />
              {totalSites} {l.sites}
            </span>
            {renewalsSoon > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-3 w-3" strokeWidth={2.5} />
                {renewalsSoon}× {l.soon}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {sites.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
            <Globe
              className="mx-auto h-8 w-8 text-muted"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm text-muted">{l.none}</p>
          </div>
        )}
        {sites.map((s) => {
          const renewDays = daysUntil(s.domain_renewal);
          const renewWarn =
            renewDays !== null && renewDays >= 0 && renewDays < 30;
          const renewExpired = renewDays !== null && renewDays < 0;
          const renewSafe = renewDays !== null && renewDays >= 30;
          const rows = [
            { k: l.domain, v: s.domain, icon: Globe },
            { k: l.registrar, v: s.registrar, icon: Building },
            { k: l.hosting, v: s.hosting, icon: Server },
            { k: l.dns, v: s.dns_note, icon: Network },
          ].filter((r) => r.v);
          return (
            <div
              key={s.id}
              className={`overflow-hidden rounded-2xl bg-card shadow-sm ${
                renewExpired
                  ? "ring-2 ring-red-500/40"
                  : renewWarn
                    ? "ring-1 ring-amber-500/40"
                    : ""
              }`}
            >
              {/* Header-strip met naam + renewal-status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/30 px-5 py-3">
                <p className="font-semibold tracking-tight">{s.name}</p>
                {renewDays !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                      renewExpired
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : renewWarn
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-green-500/15 text-green-600 dark:text-green-400"
                    }`}
                  >
                    {renewExpired ? (
                      <>
                        <ShieldAlert className="h-3 w-3" strokeWidth={2.5} />
                        {l.expired}
                      </>
                    ) : renewWarn ? (
                      <>
                        <ShieldAlert className="h-3 w-3" strokeWidth={2.5} />
                        {renewDays}
                        {l.daysLeft}
                      </>
                    ) : (
                      renewSafe && (
                        <>
                          <ShieldCheck
                            className="h-3 w-3"
                            strokeWidth={2.5}
                          />
                          {renewDays}
                          {l.daysLeft}
                        </>
                      )
                    )}
                  </span>
                )}
              </div>

              <dl className="grid gap-x-8 gap-y-4 p-6 sm:grid-cols-2">
                {rows.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.k}>
                      <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        <Icon className="h-3 w-3" strokeWidth={2.5} />
                        {r.k}
                      </dt>
                      <dd className="mt-1 break-all text-sm">{r.v}</dd>
                    </div>
                  );
                })}
                {s.domain_renewal && (
                  <div>
                    <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                      <Calendar className="h-3 w-3" strokeWidth={2.5} />
                      {l.renewal}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {dt(s.domain_renewal, locale)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
