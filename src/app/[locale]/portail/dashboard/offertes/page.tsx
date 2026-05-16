import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { decideOffer } from "@/app/actions/portal-client";
import { eur, dt, badge, PORTAL_T, type Offer } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  { none: string; accept: string; reject: string; valid: string; proof: string }
> = {
  nl: {
    none: "Nog geen offerte. Zodra ik er een klaarzet, zie je 'm hier.",
    accept: "Aanvaarden",
    reject: "Afwijzen",
    valid: "Geldig tot",
    proof: "Bevestiging / PDF",
  },
  fr: {
    none: "Aucun devis pour l'instant.",
    accept: "Accepter",
    reject: "Refuser",
    valid: "Valable jusqu'au",
    proof: "Confirmation / PDF",
  },
  en: {
    none: "No quote yet.",
    accept: "Accept",
    reject: "Decline",
    valid: "Valid until",
    proof: "Confirmation / PDF",
  },
};

export default async function PortalOffers({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  const offers = (data as Offer[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.offers}
      </h1>
      <div className="mt-8 space-y-3">
        {offers.length === 0 && <p className="text-sm text-muted">{l.none}</p>}
        {offers.map((o) => (
          <div key={o.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{o.title}</p>
                {o.amount_cents != null && (
                  <p className="mt-1 font-mono text-sm">{eur(o.amount_cents)}</p>
                )}
                {o.valid_until && (
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {l.valid} {dt(o.valid_until, locale)}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  o.status,
                )}`}
              >
                {o.status}
              </span>
            </div>
            {o.body && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {o.body}
              </p>
            )}
            {o.status === "open" && (
              <div className="mt-4 flex gap-2">
                <form action={decideOffer.bind(null, o.id, "akkoord")}>
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                    {l.accept}
                  </button>
                </form>
                <form action={decideOffer.bind(null, o.id, "afgewezen")}>
                  <button className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                    {l.reject}
                  </button>
                </form>
              </div>
            )}
            {o.status === "akkoord" && (
              <Link
                href={`/${locale}/portail/dashboard/offertes/${o.id}/akkoord`}
                className="mt-4 inline-flex rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
              >
                {l.proof}
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
