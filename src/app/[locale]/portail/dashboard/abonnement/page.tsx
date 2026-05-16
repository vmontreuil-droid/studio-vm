import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Sub,
} from "@/lib/portal-shared";
import { subscriptionTiers } from "@/lib/pricing";
import { upgradeSubscription } from "@/app/actions/portal-client";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    none: string;
    per: string;
    since: string;
    change: string;
    current: string;
    pick: string;
    note: string;
    currentHead: string;
    ctaTitle: string;
    ctaText: string;
    ctaBtn: string;
  }
> = {
  nl: {
    none: "Geen lopend abonnement.",
    per: "/ maand",
    since: "sinds",
    change: "Wijzig je abonnement",
    current: "Huidig",
    pick: "Kies dit",
    note: "Wijziging is meteen actief; je maandfactuur wordt vanaf de volgende periode aangepast.",
    currentHead: "Jouw huidige abonnement",
    ctaTitle: "Nog geen website bij Studio VM?",
    ctaText:
      "Stel je website helemaal zelf samen — pakket, onderhoud, domein en e-mail — en zie meteen je vaste prijs.",
    ctaBtn: "Laat je website bij mij maken",
  },
  fr: {
    none: "Aucun abonnement en cours.",
    per: "/ mois",
    since: "depuis",
    change: "Changer d'abonnement",
    current: "Actuel",
    pick: "Choisir",
    note: "Le changement est immédiat ; votre facture mensuelle est adaptée dès la période suivante.",
    currentHead: "Votre abonnement actuel",
    ctaTitle: "Pas encore de site chez Studio VM ?",
    ctaText:
      "Composez votre site vous-même — forfait, maintenance, domaine et e-mail — et voyez votre prix fixe directement.",
    ctaBtn: "Faites votre site chez moi",
  },
  en: {
    none: "No active subscription.",
    per: "/ month",
    since: "since",
    change: "Change your subscription",
    current: "Current",
    pick: "Choose",
    note: "Change is effective immediately; your monthly invoice adjusts from the next period.",
    currentHead: "Your current subscription",
    ctaTitle: "No website with Studio VM yet?",
    ctaText:
      "Build your website yourself — package, maintenance, domain and email — and see your fixed price right away.",
    ctaBtn: "Have your website made by me",
  },
};

export default async function PortalSubscription({
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
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  const subs = (data as Sub[]) ?? [];
  const current = subs.find((s) => s.status === "actief") ?? subs[0];
  const tiers = subscriptionTiers();
  const currentCents = current?.price_cents ?? -1;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.subscription}
      </h1>
      {subs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-6">
          <p className="text-sm text-muted">{l.none}</p>
          <p className="mt-4 text-lg font-semibold tracking-tight">
            {l.ctaTitle}
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted">{l.ctaText}</p>
          <Link
            href={localePath(locale, "/offerte")}
            className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {l.ctaBtn} →
          </Link>
        </div>
      ) : (
        <h2 className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
          {l.currentHead}
        </h2>
      )}
      <div className="mt-4 space-y-3">
        {subs.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
          >
            <div>
              <p className="font-semibold tracking-tight">{s.plan}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {eur(s.price_cents)} {l.per} · {l.since}{" "}
                {dt(s.started_at, locale)}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                s.status,
              )}`}
            >
              {statusLabel(s.status, locale)}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        {l.change}
      </h2>
      <p className="mt-2 text-sm text-muted">{l.note}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tr) => {
          const isCurrent = tr.cents === currentCents;
          return (
            <div
              key={tr.slug}
              className={`flex flex-col rounded-2xl border p-5 ${
                isCurrent ? "border-accent/50 bg-accent/5" : "bg-card"
              }`}
            >
              <p className="font-semibold tracking-tight">{tr.name}</p>
              <p className="mt-1 font-mono text-sm">
                {eur(tr.cents)} {l.per}
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-xs text-muted">
                {tr.features.slice(0, 4).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="mt-4 rounded-full bg-accent/15 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-accent">
                  {l.current}
                </span>
              ) : (
                <form action={upgradeSubscription.bind(null, tr.slug)} className="mt-4">
                  <button className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                    {l.pick}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
