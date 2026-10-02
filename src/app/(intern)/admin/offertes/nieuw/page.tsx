import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Zap } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIE_LABEL, werfTekst, type Project } from "@/lib/projecten";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionTiers,
} from "@/lib/pricing";
import { OfferBuilder, type OfferPrefill } from "@/components/offer-builder";
import { createOffer, addClientScan } from "@/app/actions/portal-admin";
import { lookupVat } from "@/app/actions/quote";

export const dynamic = "force-dynamic";

export default async function NieuweOfferte({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const pick = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  const prefill: OfferPrefill = {
    client_email: pick("client_email"),
    client_name: pick("client_name"),
    client_company: pick("client_company"),
    client_address: pick("client_address"),
    vat_number: pick("vat_number"),
    base: pick("base"),
    sub: pick("sub"),
    valid_days: pick("valid_days"),
    title: pick("title"),
    amount: pick("amount"),
    body: pick("body"),
    internal_note: pick("internal_note"),
  };

  // 3D-offertes ontstaan in de project-cockpit (uren × tarief); hier tonen
  // we welke projecten nog een offerte nodig hebben.
  const { data: prData } = await getSupabaseAdmin()
    .from("projecten")
    .select("*")
    .is("offer_id", null)
    .in("status", ["aanvraag", "offerte"])
    .order("created_at", { ascending: false })
    .limit(50);
  const zonderOfferte = (prData as Project[] | null) ?? [];

  const catalog = offerCatalog();
  const subs = subscriptionTiers().map((s) => ({
    key: s.slug,
    slug: s.slug,
    name: s.name,
    cents: s.cents,
    desc: s.tagline,
  }));

  return (
    <>
      <Link
        href="/admin/offertes"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar offertes
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Nieuwe offerte
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Een offerte voor een 3D-model maak je in de project-cockpit: uren × het
        uurtarief van de categorie, extra lijnen en korting, in de taal van de
        klant. Kies hieronder het project, of maak eerst een project aan voor een
        klant die belde of mailde.
      </p>

      <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Projecten zonder offerte ({zonderOfferte.length})
          </p>
          <Link
            href="/admin/projecten/nieuw"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nieuw project
          </Link>
        </div>
        {zonderOfferte.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Alle lopende aanvragen hebben al een offerte.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {zonderOfferte.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/projecten/${p.id}`} className="group flex items-center gap-3 py-3 text-sm hover:opacity-80">
                  {p.categorie === "last-minute" && <Zap className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2.25} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.titel}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.client_email} · {CATEGORIE_LABEL[p.categorie].nl}
                      {werfTekst(p.werf) ? ` · ${werfTekst(p.werf)}` : ""}
                    </span>
                  </span>
                  <span className="text-xs text-accent">Offerte opmaken</span>
                  <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="mt-8 rounded-2xl border border-dashed p-5">
        <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">
          Vrije offerte met de oude websitepakketten (archief)
        </summary>
        <p className="mt-3 text-xs text-muted">
          Enkel nog voor uitzonderingen uit de websitetijd. Pakketten, abonnement
          en vastlegkorting komen uit de oude prijslijst.
        </p>
      <div className="mt-6">
        <OfferBuilder
          email=""
          emailEditable
          bases={catalog.bases}
          addons={catalog.addons}
          subs={subs}
          included={OFFER_INCLUDED}
          action={createOffer}
          lookupVat={lookupVat}
          scanAction={addClientScan}
          prefill={prefill}
        />
      </div>
      </details>
    </>
  );
}
