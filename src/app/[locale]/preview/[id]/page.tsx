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
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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
  const t =
    locale === "fr"
      ? { eb: "Aperçu", made: "Construit avec le builder de Studio VM" }
      : locale === "en"
        ? { eb: "Preview", made: "Built with the Studio VM builder" }
        : { eb: "Voorbeeld", made: "Gemaakt met de Studio VM-builder" };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {t.eb}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {row.title || "—"}
        </h1>
        <p className="mt-1 text-xs text-muted">{t.made}</p>
      </div>
      <BuilderRender snap={snap} />
    </main>
  );
}
