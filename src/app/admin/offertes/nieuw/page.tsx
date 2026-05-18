import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

const field =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

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
      <p className="mt-2 text-sm text-muted">
        Eén plek, alle toeters en bellen. Vul het BTW-nummer in en klik
        “Gegevens ophalen” — bedrijf en adres worden via VIES ingevuld.
        Alles blijft daarna vrij wijzigbaar, ook het abonnement. De
        klant hoeft nog niet te bestaan; bij versturen wordt zijn
        portaal-login automatisch aangemaakt.
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
          prefill={prefill}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-dashed bg-card/50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Optioneel — analyse meesturen (zonder de klant te mailen)
        </p>
        <p className="mt-1 text-sm text-muted">
          Scant de huidige site en koppelt de volledige analyse aan
          dezelfde klant-e-mail. Ze verschijnt in zijn portaal naast
          de offerte — jij beslist zelf wanneer je hem contacteert.
        </p>
        <form
          action={addClientScan}
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            name="client_email"
            type="email"
            required
            placeholder="klant@bedrijf.be"
            className={field}
          />
          <input
            name="url"
            required
            placeholder="huidige website (bv. klant.be)"
            className={field}
          />
          <button className="rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:bg-card-hover">
            Scan toevoegen
          </button>
        </form>
      </div>
    </>
  );
}
