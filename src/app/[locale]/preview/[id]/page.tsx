import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale } from "@/lib/i18n/config";
import { BuilderRender } from "@/components/builder-render";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voorbeeld — Studio VM",
  robots: { index: false, follow: false },
};

// Publieke, alleen-lezen voorbeeldweergave van een builder-ontwerp,
// deelbaar via een link. Geen login: we lezen serverzijde met de
// service-role (bypassed RLS) en tonen enkel de visuele render.
export default async function DesignPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { locale, id } = await params;
  const { p } = await searchParams;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) notFound();
  if (!/^[0-9a-f-]{16,40}$/i.test(id)) notFound();

  const { data } = await getSupabaseAdmin()
    .from("builder_designs")
    .select("title, snapshot")
    .eq("id", id)
    .maybeSingle();
  const row = data as { title: string; snapshot: unknown } | null;
  if (!row || !row.snapshot) notFound();

  const snap = row.snapshot as Parameters<typeof BuilderRender>[0]["snap"];
  const pageIndex = Number.parseInt(p ?? "0", 10);

  // Schone, los-staande weergave — exact zoals de gepubliceerde site
  // (geen studio-vm-chrome, geen debuglabels). Zo komt de deel-link
  // overeen met wat de klant in de builder ziet.
  return (
    <main>
      <BuilderRender
        snap={snap}
        live
        pageIndex={Number.isFinite(pageIndex) ? pageIndex : 0}
      />
    </main>
  );
}
