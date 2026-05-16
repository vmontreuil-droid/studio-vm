import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { eur, PORTAL_T } from "@/lib/portal-shared";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  title: string;
  body: string | null;
  amount_cents: number | null;
  status: string;
  decided_at: string | null;
  created_at: string;
};

const L: Record<
  Locale,
  {
    title: string;
    sub: string;
    accepted: string;
    by: string;
    on: string;
    amount: string;
    print: string;
    back: string;
    notyet: string;
  }
> = {
  nl: {
    title: "Bevestiging van akkoord",
    sub: "Dit document bevestigt je aanvaarding van onderstaande offerte.",
    accepted: "Aanvaard",
    by: "Door",
    on: "Op",
    amount: "Bedrag",
    print: "Bewaar als PDF",
    back: "Terug naar offertes",
    notyet: "Deze offerte is nog niet aanvaard.",
  },
  fr: {
    title: "Confirmation d'acceptation",
    sub: "Ce document confirme votre acceptation du devis ci-dessous.",
    accepted: "Accepté",
    by: "Par",
    on: "Le",
    amount: "Montant",
    print: "Enregistrer en PDF",
    back: "Retour aux devis",
    notyet: "Ce devis n'a pas encore été accepté.",
  },
  en: {
    title: "Acceptance confirmation",
    sub: "This document confirms your acceptance of the quote below.",
    accepted: "Accepted",
    by: "By",
    on: "On",
    amount: "Amount",
    print: "Save as PDF",
    back: "Back to quotes",
    notyet: "This quote hasn't been accepted yet.",
  },
};

export default async function OfferAcceptance({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];
  const base = `/${locale}/portail/dashboard`;

  const sb = await getSupabaseServer();
  const [{ data }, { data: u }] = await Promise.all([
    sb
      .from("offers")
      .select("id, title, body, amount_cents, status, decided_at, created_at")
      .eq("id", id)
      .maybeSingle(),
    sb.auth.getUser(),
  ]);
  const o = data as OfferRow | null;
  if (!o) notFound();
  const email = u.user?.email ?? "";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleString(
      locale === "fr" ? "fr-BE" : locale === "en" ? "en-GB" : "nl-BE",
      { timeZone: "Europe/Brussels" },
    );

  return (
    <>
      <Link
        href={`${base}/offertes`}
        className="no-print inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {l.back}
      </Link>

      {o!.status !== "akkoord" ? (
        <p className="mt-8 rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
          {l.notyet}
        </p>
      ) : (
        <div className="mt-6 rounded-2xl border bg-card p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Studio VM · {t.offers}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {l.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{l.sub}</p>

          <div className="mt-8 rounded-xl border bg-background p-6">
            <p className="text-lg font-semibold tracking-tight">{o!.title}</p>
            {o!.body && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {o!.body}
              </p>
            )}
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {o!.amount_cents != null && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {l.amount}
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {eur(o!.amount_cents)}
                </dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {l.by}
              </dt>
              <dd className="mt-1 break-all text-sm">{email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {l.accepted} — {l.on}
              </dt>
              <dd className="mt-1 text-sm">
                {o!.decided_at ? fmtDate(o!.decided_at) : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <PrintButton label={l.print} />
          </div>
        </div>
      )}
    </>
  );
}
