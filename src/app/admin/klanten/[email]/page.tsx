import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, ExternalLink, BarChart3 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import type { ScanResult } from "@/app/actions/scan";

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

export default async function AdminKlantDetail({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { email: raw } = await params;
  const email = decodeURIComponent(raw).toLowerCase().trim();

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("id, token, email, url, locale, scan, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) notFound();

  const latest = rows[0];
  const first = rows[rows.length - 1];

  const gradeColor = (s: number) =>
    s >= 75
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s >= 45
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-red-500/15 text-red-500";

  return (
    <>
      <Link
        href="/admin/klanten"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar klanten
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-all text-2xl font-semibold tracking-tight">
            {email}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {rows.length} scan{rows.length === 1 ? "" : "s"} · klant sinds{" "}
            {new Date(first.created_at).toLocaleDateString("nl-BE", {
              timeZone: "Europe/Brussels",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            Mail klant
          </a>
          <Link
            href={`/${latest.locale}/portail/${latest.token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Laatste portaal
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-accent">
        Alle scans
      </h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => {
          const sc = r.scan && r.scan.ok ? r.scan : null;
          const host = sc ? sc.host : r.url;
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {sc && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${gradeColor(
                        sc.score,
                      )}`}
                    >
                      {sc.grade} · {sc.score}
                    </span>
                  )}
                  <span className="truncate font-medium">{host}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {new Date(r.created_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}{" "}
                  · {r.locale.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/scans/${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Analyse
                </Link>
                <Link
                  href={`/${r.locale}/portail/${r.token}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                >
                  Portaal
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
