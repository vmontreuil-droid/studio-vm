import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt, badge, PORTAL_T, type Site } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    none: string;
    visit: string;
    lastDeploy: string;
    statusLabel: Record<string, string>;
  }
> = {
  nl: {
    none: "Nog geen website gekoppeld. Zodra ik er een voor je bouw, verschijnt ze hier — met live status en link.",
    visit: "Bekijk live site",
    lastDeploy: "Laatste update",
    statusLabel: {
      in_aanbouw: "in aanbouw",
      online: "online",
      onderhoud: "onderhoud",
      offline: "offline",
    },
  },
  fr: {
    none: "Aucun site lié pour l'instant. Dès que j'en construis un, il apparaît ici — avec statut et lien.",
    visit: "Voir le site",
    lastDeploy: "Dernière mise à jour",
    statusLabel: {
      in_aanbouw: "en construction",
      online: "en ligne",
      onderhoud: "maintenance",
      offline: "hors ligne",
    },
  },
  en: {
    none: "No website linked yet. As soon as I build one for you, it shows here — with live status and link.",
    visit: "Visit live site",
    lastDeploy: "Last update",
    statusLabel: {
      in_aanbouw: "in progress",
      online: "online",
      onderhoud: "maintenance",
      offline: "offline",
    },
  },
};

export default async function PortalMyWebsite({
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
  const sites = (data as Site[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.mywebsite}
      </h1>

      <div className="mt-8 space-y-4">
        {sites.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
            {l.none}
          </div>
        )}
        {sites.map((s) => (
          <div key={s.id} className="rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight">
                  {s.name}
                </p>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-xs text-accent hover:underline"
                  >
                    {s.url}
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                  </a>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  s.status === "online"
                    ? "actief"
                    : s.status === "offline"
                      ? "gestopt"
                      : s.status === "onderhoud"
                        ? "in_behandeling"
                        : "open",
                )}`}
              >
                {l.statusLabel[s.status] ?? s.status}
              </span>
            </div>
            {s.notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {s.notes}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] text-muted">
              {s.last_deploy && (
                <span>
                  {l.lastDeploy}: {dt(s.last_deploy, locale)}
                </span>
              )}
            </div>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {l.visit}
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
