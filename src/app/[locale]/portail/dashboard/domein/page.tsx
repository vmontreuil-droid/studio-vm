import { notFound } from "next/navigation";
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
  },
  fr: {
    none: "Pas encore d'infos domaine/hébergement. Dès que votre site tourne chez moi, c'est ici.",
    sub: "Votre domaine, échéance, hébergement et DNS — au même endroit.",
    domain: "Domaine",
    registrar: "Registrar",
    renewal: "Expire le",
    hosting: "Hébergement",
    dns: "DNS",
  },
  en: {
    none: "No domain/hosting info yet. As soon as your site runs with me it shows here.",
    sub: "Your domain, renewal, hosting and DNS — transparent in one place.",
    domain: "Domain",
    registrar: "Registrar",
    renewal: "Renews on",
    hosting: "Hosting",
    dns: "DNS",
  },
};

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

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.domain}
      </h1>
      <p className="mt-3 text-sm text-muted">{l.sub}</p>

      <div className="mt-8 space-y-4">
        {sites.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
            {l.none}
          </p>
        )}
        {sites.map((s) => {
          const rows = [
            { k: l.domain, v: s.domain },
            { k: l.registrar, v: s.registrar },
            {
              k: l.renewal,
              v: s.domain_renewal ? dt(s.domain_renewal, locale) : null,
            },
            { k: l.hosting, v: s.hosting },
            { k: l.dns, v: s.dns_note },
          ].filter((r) => r.v);
          return (
            <div key={s.id} className="rounded-2xl border bg-card p-6">
              <p className="font-semibold tracking-tight">{s.name}</p>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {rows.map((r) => (
                  <div key={r.k}>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {r.k}
                    </dt>
                    <dd className="mt-1 break-all text-sm">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
