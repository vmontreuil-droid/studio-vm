import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";
import { ScanReport } from "@/components/scan-report";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  token: string;
  email: string;
  url: string;
  locale: string;
  scan: ScanResult;
  created_at: string;
};

export default async function AdminScanDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("id, token, email, url, locale, scan, created_at")
    .eq("id", id)
    .maybeSingle();
  const row = data as Row | null;
  if (!row) notFound();

  const locale: Locale = isValidLocale(row.locale)
    ? row.locale
    : DEFAULT_LOCALE;
  const s = row.scan;
  const ok = s && s.ok;

  return (
    <>
      <Link
        href="/admin/scans"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar scans
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {ok ? s.host : row.url}
          </h1>
          <p className="mt-1 text-sm text-muted">{row.email}</p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {new Date(row.created_at).toLocaleString("nl-BE", {
              timeZone: "Europe/Brussels",
            })}{" "}
            · {row.locale.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${row.email}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            Mail klant
          </a>
          <Link
            href={`/${row.locale}/portail/${row.token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Klantportaal
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {ok ? (
          <ScanReport scan={s} locale={locale} />
        ) : (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Deze scan bevat geen geldig rapport
            {s && s.ok === false ? `: ${s.error}` : "."}
          </p>
        )}
      </div>
    </>
  );
}
