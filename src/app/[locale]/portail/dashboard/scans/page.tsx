import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T, type ScanRow } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<Locale, { none: string; analysis: string }> = {
  nl: { none: "Nog geen scans op dit adres.", analysis: "Volledige analyse" },
  fr: { none: "Aucun scan sur cette adresse.", analysis: "Analyse complète" },
  en: { none: "No scans on this address yet.", analysis: "Full analysis" },
};

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
        {scans.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {scans.map((s) => {
          const ok = s.scan && s.scan.ok ? s.scan : null;
          return (
            <div
              key={s.token}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {ok ? `${ok.grade} · ${ok.score}/100` : "—"}{" "}
                  <span className="text-muted">· {ok ? ok.host : s.url}</span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {dt(s.created_at, locale)}
                </p>
              </div>
              <Link
                href={localePath(locale, `/portail/scan/${s.token}`)}
                className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
              >
                {l.analysis} →
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
