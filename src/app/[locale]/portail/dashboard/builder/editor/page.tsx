import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale } from "@/lib/i18n/config";
import BuilderPage, {
  type BuilderSnapshot,
} from "@/app/[locale]/builder/page";

export const dynamic = "force-dynamic";

// De visuele builder binnen het portaal, gekoppeld aan één opgeslagen
// ontwerp (?d=<id>). Hydrateert van de server zodat de klant op elk
// toestel verder kan; autosave gebeurt clientzijde naar dat ontwerp.
export default async function PortalBuilderEditor({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { locale } = await params;
  const { d } = await searchParams;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  if (!d) redirect(`/${locale}/portail/dashboard/builder`);

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("builder_designs")
    .select("id, snapshot")
    .eq("id", d)
    .maybeSingle();
  const row = data as { id: string; snapshot: unknown } | null;
  if (!row) redirect(`/${locale}/portail/dashboard/builder`);

  const snap =
    row!.snapshot && Object.keys(row!.snapshot as object).length
      ? (row!.snapshot as BuilderSnapshot)
      : undefined;

  return <BuilderPage designId={row!.id} initialSnapshot={snap} />;
}
