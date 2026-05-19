import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  setOfferStatus,
  resendOffer,
  createOfferInvoice,
  createSlotInvoice,
  startSupportSubscription,
} from "@/app/actions/portal-admin";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type OfferItem = {
  label: string;
  desc?: string;
  cents: number;
  kind?: string;
};
type Offer = {
  id: string;
  client_email: string | null;
  offer_no: string | null;
  title: string;
  body: string | null;
  amount_cents: number | null;
  status: string;
  valid_until: string | null;
  created_at: string;
  viewed_at: string | null;
  items: OfferItem[] | null;
  vat_reverse: boolean | null;
  client_name: string | null;
  client_company: string | null;
  client_address: string | null;
  vat_number: string | null;
};

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const d = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString("nl-BE", {
        timeZone: "Europe/Brussels",
      })
    : "—";

const PRINT_CSS = `@page { margin: 18mm 14mm; }
@media print {
  html { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; }
  .no-print { display: none !important; }
  .doc { border: none !important; box-shadow: none !important; }
}`;

export default async function AdminOfferDoc({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;
  const { data } = await getSupabaseAdmin()
    .from("offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const o = data as Offer | null;
  if (!o) notFound();

  const items = o.items ?? [];
  const reverse = !!o.vat_reverse;
  const net = o.amount_cents ?? 0;
  const discount = items.reduce(
    (s, it) =>
      typeof it.cents === "number" && it.cents < 0 ? s - it.cents : s,
    0,
  );
  const gross = net + discount;
  const sub = items.find((it) => it.kind === "sub");
  const vat = reverse ? 0 : Math.round(net * 0.21);
  const incl = net + vat;
  const lockin = discount > 0;
  const deposit = lockin ? Math.round(incl * 0.3) : 0;
  const paragraphs = (o.body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/offertes"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Terug naar offertes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton label="Afdrukken / PDF" />
          {o.client_email && (
            <Link
              href={`/admin/klanten/${encodeURIComponent(
                o.client_email,
              )}?tab=offertes`}
              className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              Klantfiche
            </Link>
          )}
          <form action={resendOffer}>
            <input type="hidden" name="id" value={o.id} />
            <button className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
              Herverstuur
            </button>
          </form>
          {o.status !== "akkoord" && (
            <form action={setOfferStatus.bind(null, o.id, "akkoord")}>
              <button className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
                Op akkoord zetten
              </button>
            </form>
          )}
          {o.status !== "afgewezen" && (
            <form action={setOfferStatus.bind(null, o.id, "afgewezen")}>
              <button className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                Afwijzen
              </button>
            </form>
          )}
          {o.status === "akkoord" && (
            <>
              <form action={createOfferInvoice}>
                <input type="hidden" name="id" value={o.id} />
                <button className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
                  + Voorschotfactuur 30%
                </button>
              </form>
              <form action={createSlotInvoice}>
                <input type="hidden" name="id" value={o.id} />
                <button className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
                  + Slotfactuur 70%
                </button>
              </form>
              <form action={startSupportSubscription}>
                <input type="hidden" name="id" value={o.id} />
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                  Start support (livegang)
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div id="print-area" className="mt-6">
        <article className="doc rounded-2xl border bg-card p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
            <div>
              <p className="text-6xl font-extrabold lowercase leading-none tracking-tighter sm:text-7xl">
                vm<span className="text-accent">.</span>
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
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
              <p className="text-xs text-muted">{d(o.created_at)}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                  o.status === "akkoord"
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : o.status === "afgewezen"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-accent/15 text-accent"
                }`}
              >
                {o.status}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                Van
              </p>
              <p className="font-medium">Studio VM — Vincent Montreuil</p>
              <p className="text-muted">studio-vm.be</p>
            </div>
            <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                Voor
              </p>
              {o.client_company && (
                <p className="font-medium">{o.client_company}</p>
              )}
              {o.client_name && <p>{o.client_name}</p>}
              {o.client_address && (
                <p className="text-muted">{o.client_address}</p>
              )}
              {o.vat_number ? (
                <p className="font-mono text-xs text-muted">
                  {o.vat_number}
                </p>
              ) : (
                o.client_email && (
                  <p className="font-mono text-xs text-muted">
                    {o.client_email}
                  </p>
                )
              )}
            </div>
          </div>

          <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
            {o.title}
          </h2>

          {paragraphs.length > 0 && (
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
              {paragraphs.map((p, k) => (
                <p key={k} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                Wat je krijgt
              </p>
              <ul className="space-y-2.5">
                {items.map((it, k) => {
                  const neg = it.cents < 0;
                  return (
                    <li
                      key={k}
                      className="flex items-start justify-between gap-4 border-b pb-2.5 text-sm last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="font-medium">{it.label}</span>
                        {it.desc && (
                          <span className="mt-0.5 block text-xs text-muted">
                            {it.desc}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 whitespace-nowrap font-mono text-xs ${
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
                          ? "maandelijks"
                          : neg
                            ? `− ${eur(-it.cents)}`
                            : it.cents > 0
                              ? eur(it.cents)
                              : "inbegrepen"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {o.amount_cents != null && (
            <div className="mt-6 space-y-1.5 rounded-xl border bg-background p-5 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>Subtotaal (excl. btw)</span>
                <span className="shrink-0 whitespace-nowrap font-mono">
                  {eur(lockin ? gross : net)}
                </span>
              </div>
              {lockin && (
                <>
                  <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                    <span>Vastlegkorting (directe ondertekening) −7%</span>
                    <span className="shrink-0 whitespace-nowrap font-mono">
                      − {eur(discount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Na korting (excl. btw)</span>
                    <span className="shrink-0 whitespace-nowrap font-mono">
                      {eur(net)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-muted">
                <span>
                  {reverse
                    ? "Btw (0% — verlegd, intracommunautair)"
                    : "Btw 21%"}
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono">
                  {eur(vat)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                <span>Totaal incl. btw</span>
                <span className="shrink-0 whitespace-nowrap font-mono">
                  {eur(incl)}
                </span>
              </div>
              {sub && (
                <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                  <span>{sub.label}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">
                    maandelijks
                  </span>
                </div>
              )}
              {deposit > 0 && (
                <div className="-mx-1 mt-1 flex items-center justify-between rounded-lg bg-foreground px-3 py-2 font-semibold text-background">
                  <span>Voorschot 30% om te starten (incl. btw)</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">
                    {eur(deposit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {o.valid_until && (
            <p className="mt-4 text-xs text-muted">
              Geldig tot{" "}
              <strong className="text-foreground">
                {d(o.valid_until)}
              </strong>
              {o.viewed_at ? " · bekeken door klant" : " · nog niet bekeken"}
            </p>
          )}

          <div className="mt-6 rounded-xl border bg-background p-5 text-sm shadow-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              Voorwaarden
            </p>
            <p className="text-xs leading-relaxed text-muted">
              {lockin
                ? "Beslis je vóór de vervaldatum van deze offerte, dan liggen prijs en scope vast en geniet je van 7% korting + de eerste 2 maanden support gratis; daarna vervalt dit automatisch. "
                : ""}
              Betaling: 30% voorschot om te starten, de resterende 70%
              vóór de site live gaat. Alle betalingen verlopen
              uitsluitend via het beveiligde klantenportaal — geen
              uitzonderingen. Het onderhoudsabonnement heeft een
              minimumlooptijd van 1 jaar en wordt, zonder schriftelijke
              opzegging minstens 1 maand vóór het einde van de
              jaarperiode, telkens stilzwijgend met één jaar verlengd.
              Domein &amp; e-mail (overname/verlenging) zijn ten laste
              van de klant en worden, afhankelijk van het geval, op de
              slotfactuur verrekend. Volledige voorwaarden:
              studio-vm.be/nl/voorwaarden.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
