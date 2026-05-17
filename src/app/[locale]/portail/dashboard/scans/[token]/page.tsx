import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale } from "@/lib/i18n/config";
import { ScanReport } from "@/components/scan-report";
import type { ScanResult } from "@/app/actions/scan";

export const dynamic = "force-dynamic";

// Volledige scan-analyse, maar binnen het portaal (sidebar blijft) zodat
// de klant snel kan switchen. RLS laat de ingelogde klant enkel zijn
// eigen scans zien.
export default async function PortalScanDetail({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("scan_requests")
    .select("scan")
    .eq("token", token)
    .maybeSingle();
  const row = data as { scan: ScanResult | null } | null;
  if (!row || !row.scan || !row.scan.ok) notFound();

  return <ScanReport scan={row.scan} locale={locale} />;
}
