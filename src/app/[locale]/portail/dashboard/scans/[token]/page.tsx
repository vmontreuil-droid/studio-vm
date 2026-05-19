import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, siteUrl } from "@/lib/supabase/config";
import { isValidLocale } from "@/lib/i18n/config";
import { ScanReport } from "@/components/scan-report";
import { ShareScan } from "@/components/share-scan";
import type { ScanResult } from "@/app/actions/scan";

const SH: Record<
  string,
  { label: string; copied: string; mail: string; subject: string; hint: string }
> = {
  nl: {
    label: "Deel deze analyse",
    copied: "Gekopieerd!",
    mail: "Mail",
    subject: "Mijn website-analyse — Studio VM",
    hint: "Deel deze analyse met wie je wil — de link werkt zonder login.",
  },
  fr: {
    label: "Partager cette analyse",
    copied: "Copié !",
    mail: "E-mail",
    subject: "Mon analyse de site — Studio VM",
    hint: "Partagez cette analyse avec qui vous voulez — le lien fonctionne sans connexion.",
  },
  en: {
    label: "Share this analysis",
    copied: "Copied!",
    mail: "Email",
    subject: "My website analysis — Studio VM",
    hint: "Share this analysis with anyone — the link works without login.",
  },
};

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

  const sh = SH[locale] ?? SH.nl;
  const shareUrl = `${siteUrl}/${locale}/portail/scan/${token}`;

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted">{sh.hint}</p>
        <ShareScan
          url={shareUrl}
          label={sh.label}
          copied={sh.copied}
          mail={sh.mail}
          subject={sh.subject}
        />
      </div>
      <ScanReport scan={row.scan} locale={locale} />
    </>
  );
}
