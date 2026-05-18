import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { offerCatalog, OFFER_INCLUDED } from "@/lib/pricing";
import { OfferBuilder } from "@/components/offer-builder";
import { createOffer, addClientScan } from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export default async function NieuweOfferte() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const catalog = offerCatalog();

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
        Eén plek, alle toeters en bellen. De klant hoeft nog niet te
        bestaan — bij versturen wordt zijn portaal-login automatisch
        aangemaakt en krijgt hij een mail om met één klik te
        aanvaarden of af te wijzen. VIES-controle op het BTW-nummer
        gebeurt automatisch.
      </p>

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

      <div className="mt-6">
        <OfferBuilder
          email=""
          emailEditable
          bases={catalog.bases}
          addons={catalog.addons}
          subs={catalog.subs}
          included={OFFER_INCLUDED}
          action={createOffer}
        />
      </div>
    </>
  );
}
