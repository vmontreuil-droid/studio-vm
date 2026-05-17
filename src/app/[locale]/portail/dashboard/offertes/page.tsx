import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { decideOffer } from "@/app/actions/portal-client";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Offer,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    none: string;
    accept: string;
    reject: string;
    valid: string;
    proof: string;
    daysLeft: (n: number) => string;
    expired: string;
    reverse: string;
    vatExcl: string;
  }
> = {
  nl: {
    none: "Nog geen offerte. Zodra ik er een klaarzet, zie je 'm hier.",
    accept: "Aanvaarden",
    reject: "Afwijzen",
    valid: "Geldig tot",
    proof: "Bevestiging / PDF",
    daysLeft: (n) => (n === 1 ? "nog 1 dag" : `nog ${n} dagen`),
    expired: "vervallen",
    reverse: "BTW verlegd (intracommunautair, 0%)",
    vatExcl: "excl. 21% btw",
  },
  fr: {
    none: "Aucun devis pour l'instant.",
    accept: "Accepter",
    reject: "Refuser",
    valid: "Valable jusqu'au",
    proof: "Confirmation / PDF",
    daysLeft: (n) => (n === 1 ? "1 jour restant" : `${n} jours restants`),
    expired: "expiré",
    reverse: "TVA autoliquidée (intracommunautaire, 0%)",
    vatExcl: "hors 21% TVA",
  },
  en: {
    none: "No quote yet.",
    accept: "Accept",
    reject: "Decline",
    valid: "Valid until",
    proof: "Confirmation / PDF",
    daysLeft: (n) => (n === 1 ? "1 day left" : `${n} days left`),
    expired: "expired",
    reverse: "VAT reverse-charged (intra-EU, 0%)",
    vatExcl: "excl. 21% VAT",
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

  // Markeer als 'bekeken' (RLS staat update op eigen rijen toe).
  const unseen = offers
    .filter((o) => o.status === "open")
    .map((o) => o.id);
  if (unseen.length > 0) {
    await sb
      .from("offers")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", unseen)
      .is("viewed_at", null);
  }

  // force-dynamic pagina: serverklok is hier bewust de bron.
  // eslint-disable-next-line react-hooks/purity
  const todayMs = Date.now();
  const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - todayMs) / 86400000);

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
                <p className="font-semibold tracking-tight">
                  {o.offer_no ? (
                    <span className="mr-2 font-mono text-xs text-muted">
                      {o.offer_no}
                    </span>
                  ) : null}
                  {o.title}
                </p>
                {o.amount_cents != null && (
                  <p className="mt-1 font-mono text-sm">
                    {eur(o.amount_cents)}{" "}
                    <span className="text-[11px] text-muted">
                      {o.vat_reverse ? l.reverse : l.vatExcl}
                    </span>
                  </p>
                )}
                {o.items && o.items.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {o.items.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 border-b pb-1.5 last:border-0"
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{it.label}</span>
                          {it.desc ? (
                            <span className="mt-0.5 block text-muted">
                              {it.desc}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`shrink-0 font-mono ${
                            it.kind === "sub"
                              ? "text-amber-600 dark:text-amber-400"
                              : it.cents > 0
                                ? "text-muted"
                                : "text-accent"
                          }`}
                        >
                          {it.kind === "sub"
                            ? "maandelijks"
                            : it.cents > 0
                              ? eur(it.cents)
                              : "inbegrepen"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {o.valid_until && (
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {l.valid} {dt(o.valid_until, locale)}
                    {o.status === "open"
                      ? ` · ${
                          daysUntil(o.valid_until) >= 0
                            ? l.daysLeft(daysUntil(o.valid_until))
                            : l.expired
                        }`
                      : ""}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  o.status,
                )}`}
              >
                {statusLabel(o.status, locale)}
              </span>
            </div>
            {o.body &&
              (() => {
                const lines = o.body
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const rows = lines.map((line) => {
                  const m = line.match(/^([^:]{2,48}):\s*(.+)$/);
                  return m
                    ? { label: m[1], value: m[2] }
                    : { label: null, value: line };
                });
                return (
                  <div className="mt-4 overflow-hidden rounded-xl border bg-background">
                    <dl className="divide-y text-sm">
                      {rows.map((r, i) =>
                        r.label ? (
                          <div
                            key={i}
                            className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-4 py-2.5"
                          >
                            <dt className="text-muted">{r.label}</dt>
                            <dd className="text-right font-medium">
                              {r.value}
                            </dd>
                          </div>
                        ) : (
                          <p
                            key={i}
                            className="bg-card-hover px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted"
                          >
                            {r.value}
                          </p>
                        ),
                      )}
                    </dl>
                  </div>
                );
              })()}
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
