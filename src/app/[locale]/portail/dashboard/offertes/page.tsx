import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Package,
  Languages,
  MailCheck,
  CalendarCheck,
  Newspaper,
  Lock,
  Search,
  Camera,
  ShieldCheck,
  PenLine,
  LayoutDashboard,
  Smartphone,
  Share2,
  BarChart3,
  Mail,
  RefreshCw,
  CreditCard,
  Tag,
  Repeat,
  Check,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { decideOffer } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";
import { PrintButton } from "@/components/print-button";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Offer,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

type Doc = Offer & {
  client_name?: string | null;
  client_company?: string | null;
  client_address?: string | null;
  vat_number?: string | null;
  created_at: string;
};

function lineIcon(label: string): LucideIcon {
  const s = label.toLowerCase();
  if (s.includes("korting")) return Tag;
  if (s.includes("abonnement") || /\b(care|plus|scale|partner)\b/.test(s))
    return Repeat;
  if (s.includes("basispakket") || s.includes("aanbetaling")) return Package;
  if (s.includes("taal")) return Languages;
  if (s.includes("formulier")) return MailCheck;
  if (s.includes("reservatie") || s.includes("afspra")) return CalendarCheck;
  if (s.includes("blog") || s.includes("nieuws-cms")) return Newspaper;
  if (s.includes("leden")) return Lock;
  if (s.includes("seo")) return Search;
  if (s.includes("foto")) return Camera;
  if (s.includes("cookie") || s.includes("gdpr")) return ShieldCheck;
  if (s.includes("tekst") || s.includes("copywriting")) return PenLine;
  if (s.includes("admin") || s.includes("cms")) return LayoutDashboard;
  if (s.includes("mobile") || s.includes("dark mode")) return Smartphone;
  if (s.includes("open graph") || s.includes("sitemap")) return Share2;
  if (s.includes("analytics") || s.includes("structured data"))
    return BarChart3;
  if (s.includes("newsletter") || s.includes("nieuwsbrief")) return Mail;
  if (s.includes("ronde") || s.includes("revisie")) return RefreshCw;
  if (s.includes("mollie") || s.includes("stripe") || s.includes("betaal"))
    return CreditCard;
  return Check;
}

const L: Record<
  Locale,
  {
    none: string;
    accept: string;
    reject: string;
    proof: string;
    print: string;
    daysLeft: (n: number) => string;
    expired: string;
    expiredNote: string;
    reverse: string;
    vat: string;
    subtotal: string;
    inclVat: string;
    valid: string;
    forWhom: string;
    from: string;
    whatYouGet: string;
    included: string;
    monthly: string;
    deposit: string;
    payToStart: string;
  }
> = {
  nl: {
    none: "Nog geen offerte. Zodra ik er een klaarzet, zie je 'm hier.",
    accept: "Goedkeuren",
    reject: "Afwijzen",
    proof: "Bevestiging / PDF",
    print: "Afdrukken / PDF",
    daysLeft: (n) => (n === 1 ? "nog 1 dag geldig" : `nog ${n} dagen geldig`),
    expired: "vervallen",
    expiredNote:
      "Deze offerte is vervallen — vraag gerust een nieuwe aan.",
    reverse: "Btw (0% — verlegd, intracommunautair)",
    vat: "Btw 21%",
    subtotal: "Subtotaal (excl. btw)",
    inclVat: "Totaal incl. btw",
    valid: "Geldig tot",
    forWhom: "Voor",
    from: "Van",
    whatYouGet: "Wat je krijgt",
    included: "inbegrepen",
    monthly: "per maand",
    deposit: "Voorschot 30% om te starten (incl. btw)",
    payToStart: "Betaal je voorschot via Mollie →",
  },
  fr: {
    none: "Aucun devis pour l'instant.",
    accept: "Approuver",
    reject: "Refuser",
    proof: "Confirmation / PDF",
    print: "Imprimer / PDF",
    daysLeft: (n) =>
      n === 1 ? "valable encore 1 jour" : `valable encore ${n} jours`,
    expired: "expiré",
    expiredNote: "Ce devis a expiré — demandez-en un nouveau.",
    reverse: "TVA (0% — autoliquidée, intracommunautaire)",
    vat: "TVA 21%",
    subtotal: "Sous-total (HTVA)",
    inclVat: "Total TVAC",
    valid: "Valable jusqu'au",
    forWhom: "Pour",
    from: "De",
    whatYouGet: "Ce que vous obtenez",
    included: "inclus",
    monthly: "par mois",
    deposit: "Acompte 30% pour démarrer (TVAC)",
    payToStart: "Payer l'acompte via Mollie →",
  },
  en: {
    none: "No quote yet.",
    accept: "Approve",
    reject: "Decline",
    proof: "Confirmation / PDF",
    print: "Print / PDF",
    daysLeft: (n) => (n === 1 ? "1 day left" : `${n} days left`),
    expired: "expired",
    expiredNote: "This quote has expired — request a new one.",
    reverse: "VAT (0% — reverse-charged, intra-EU)",
    vat: "VAT 21%",
    subtotal: "Subtotal (excl. VAT)",
    inclVat: "Total incl. VAT",
    valid: "Valid until",
    forWhom: "For",
    from: "From",
    whatYouGet: "What you get",
    included: "included",
    monthly: "per month",
    deposit: "30% deposit to start (incl. VAT)",
    payToStart: "Pay your deposit via Mollie →",
  },
};

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
  .no-print { display: none !important; }
  .offer-doc { border: none !important; box-shadow: none !important; page-break-after: always; }
}`;

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
  const offers = (data as Doc[]) ?? [];

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

  // eslint-disable-next-line react-hooks/purity
  const todayMs = Date.now();
  const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - todayMs) / 86400000);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.offers}
      </h1>

      <div id="print-area" className="mt-8 space-y-8">
        {offers.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {offers.map((o) => {
          const amount = o.amount_cents ?? 0;
          const vat = o.vat_reverse ? 0 : Math.round(amount * 0.21);
          const incl = amount + vat;
          const items = o.items ?? [];
          const hasLockin = items.some(
            (it) => typeof it.cents === "number" && it.cents < 0,
          );
          const subItem = items.find((it) => it.kind === "sub");
          const deposit = hasLockin ? Math.round(incl * 0.3) : 0;
          const expired =
            !!o.valid_until && daysUntil(o.valid_until) < 0;
          const paragraphs = (o.body ?? "")
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <article
              key={o.id}
              className="offer-doc rounded-2xl border bg-card p-6 sm:p-9"
            >
              {/* Briefhoofd */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                <div>
                  <p className="text-3xl font-extrabold lowercase tracking-tighter">
                    vm<span className="text-accent">.</span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    Studio VM · studio-vm.be
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    Offerte
                  </p>
                  <p className="mt-1 font-semibold tracking-tight">
                    {o.offer_no ?? "—"}
                  </p>
                  <p className="text-xs text-muted">
                    {dt(o.created_at, locale)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                      o.status,
                    )}`}
                  >
                    {statusLabel(o.status, locale)}
                  </span>
                </div>
              </div>

              {/* Van / Voor */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-background p-4 text-sm">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {l.from}
                  </p>
                  <p className="font-medium">Studio VM — Vincent Montreuil</p>
                  <p className="text-muted">studio-vm.be</p>
                </div>
                {(o.client_name ||
                  o.client_company ||
                  o.client_address ||
                  o.vat_number) && (
                  <div className="rounded-xl border bg-background p-4 text-sm">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.forWhom}
                    </p>
                    {o.client_company && (
                      <p className="font-medium">{o.client_company}</p>
                    )}
                    {o.client_name && <p>{o.client_name}</p>}
                    {o.client_address && (
                      <p className="text-muted">{o.client_address}</p>
                    )}
                    {o.vat_number && (
                      <p className="font-mono text-xs text-muted">
                        {o.vat_number}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
                {o.title}
              </h2>

              {/* Toelichting */}
              {paragraphs.length > 0 && (
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Lijnen */}
              {items.length > 0 && (
                <div className="mt-7">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {l.whatYouGet}
                  </p>
                  <ul className="space-y-2.5">
                    {items.map((it, i) => {
                      const Icon = lineIcon(it.label);
                      const neg =
                        typeof it.cents === "number" && it.cents < 0;
                      return (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-4 border-b pb-2.5 text-sm last:border-0"
                        >
                          <span className="flex min-w-0 gap-3">
                            <Icon
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                it.kind === "sub"
                                  ? "text-orange-600 dark:text-orange-400"
                                  : neg
                                    ? "text-green-700 dark:text-green-400"
                                    : it.cents > 0
                                      ? "text-muted"
                                      : "text-accent"
                              }`}
                              strokeWidth={2}
                            />
                            <span className="min-w-0">
                              <span className="font-medium">
                                {it.label}
                              </span>
                              {it.desc && (
                                <span className="mt-0.5 block text-xs text-muted">
                                  {it.desc}
                                </span>
                              )}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 font-mono text-xs ${
                              it.kind === "sub"
                                ? "text-orange-600 dark:text-orange-400"
                                : neg
                                  ? "text-green-700 dark:text-green-400"
                                  : it.cents > 0
                                    ? "text-muted"
                                    : "text-accent"
                            }`}
                          >
                            {it.kind === "sub"
                              ? l.monthly
                              : neg
                                ? `− ${eur(-it.cents)}`
                                : it.cents > 0
                                  ? eur(it.cents)
                                  : l.included}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Totalen */}
              {o.amount_cents != null && (
                <div className="mt-6 rounded-xl border bg-background p-5 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>{l.subtotal}</span>
                    <span className="font-mono">{eur(amount)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-muted">
                    <span>{o.vat_reverse ? l.reverse : l.vat}</span>
                    <span className="font-mono">{eur(vat)}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                    <span>{l.inclVat}</span>
                    <span className="font-mono">{eur(incl)}</span>
                  </div>
                  {subItem && (
                    <div className="mt-2 flex items-center justify-between text-orange-600 dark:text-orange-400">
                      <span>{subItem.label}</span>
                      <span className="font-mono">{l.monthly}</span>
                    </div>
                  )}
                  {deposit > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-foreground px-3 py-2 font-semibold text-background">
                      <span>{l.deposit}</span>
                      <span className="font-mono">{eur(deposit)}</span>
                    </div>
                  )}
                </div>
              )}

              {o.valid_until && (
                <p className="mt-4 text-xs text-muted">
                  {l.valid}{" "}
                  <strong className="text-foreground">
                    {dt(o.valid_until, locale)}
                  </strong>
                  {o.status === "open" && !expired
                    ? ` · ${l.daysLeft(daysUntil(o.valid_until))}`
                    : ""}
                </p>
              )}

              {/* Acties */}
              <div className="no-print mt-7 flex flex-wrap items-center gap-2 border-t pt-6">
                <PrintButton label={l.print} />
                {o.status === "open" && !expired && (
                  <>
                    <form
                      action={decideOffer.bind(null, o.id, "akkoord")}
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <SubmitButton className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                        {l.accept}
                      </SubmitButton>
                    </form>
                    <form
                      action={decideOffer.bind(null, o.id, "afgewezen")}
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <SubmitButton className="rounded-full border px-4 py-2.5 text-sm transition-colors hover:bg-card-hover">
                        {l.reject}
                      </SubmitButton>
                    </form>
                  </>
                )}
                {o.status === "open" && expired && (
                  <span className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white">
                    {l.expiredNote}
                  </span>
                )}
                {o.status === "akkoord" && (
                  <>
                    <Link
                      href={`/${locale}/portail/dashboard/facturen`}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {l.payToStart}
                    </Link>
                    <Link
                      href={`/${locale}/portail/dashboard/offertes/${o.id}/akkoord`}
                      className="rounded-full border px-4 py-2.5 text-sm transition-colors hover:bg-card-hover"
                    >
                      {l.proof}
                    </Link>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
