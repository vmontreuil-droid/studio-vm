import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setInvoiceStatus } from "@/app/actions/portal-admin";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type Inv = {
  id: string;
  client_email: string | null;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  offer_id: string | null;
};
type OfferRef = {
  client_name: string | null;
  client_company: string | null;
  client_address: string | null;
  vat_number: string | null;
  vat_reverse: boolean | null;
  title: string | null;
  offer_no: string | null;
  amount_cents: number | null;
  items:
    | { label: string; desc?: string; cents: number; kind?: string }[]
    | null;
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

export default async function AdminInvoiceDoc({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const i = data as Inv | null;
  if (!i) notFound();

  let ref: OfferRef | null = null;
  if (i.offer_id) {
    const { data: o } = await db
      .from("offers")
      .select(
        "client_name, client_company, client_address, vat_number, vat_reverse, title, offer_no, amount_cents, items",
      )
      .eq("id", i.offer_id)
      .maybeSingle();
    ref = (o as OfferRef) ?? null;
  }
  const reverse = !!ref?.vat_reverse;
  const amount = i.amount_cents;
  const vat = reverse ? 0 : Math.round(amount * 0.21);
  const incl = amount + vat;
  const paid = i.status === "betaald";
  const isDeposit = /voorschot\s*30%/i.test(i.description ?? "");

  // Volledige offerte-opbouw (zoals in het portaal): alle lijnen +
  // offerte-totaal, daarna deze (voorschot)factuur apart.
  const oItems = ref?.items ?? [];
  const oNet = ref?.amount_cents ?? 0;
  const oDiscount = oItems.reduce(
    (s, it) =>
      typeof it.cents === "number" && it.cents < 0 ? s - it.cents : s,
    0,
  );
  const oGross = oNet + oDiscount;
  const oSub = oItems.find((it) => it.kind === "sub");
  const oVat = reverse ? 0 : Math.round(oNet * 0.21);
  const oIncl = oNet + oVat;
  const showDetail = oItems.length > 0 && oNet > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/facturen"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Terug naar facturen
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton label="Afdrukken / PDF" />
          {i.client_email && (
            <Link
              href={`/admin/klanten/${encodeURIComponent(
                i.client_email,
              )}?tab=facturen`}
              className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              Klantfiche
            </Link>
          )}
          {i.status !== "betaald" && (
            <form action={setInvoiceStatus.bind(null, i.id, "betaald")}>
              <button className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
                Markeer betaald
              </button>
            </form>
          )}
          {i.status === "open" && (
            <form action={setInvoiceStatus.bind(null, i.id, "vervallen")}>
              <button className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                Markeer vervallen
              </button>
            </form>
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
                Factuur
              </p>
              <p className="mt-1 font-semibold tracking-tight">
                {i.number}
              </p>
              <p className="text-xs text-muted">{d(i.issued_at)}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                  paid
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : i.status === "vervallen"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-accent/15 text-accent"
                }`}
              >
                {i.status}
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
              {ref?.client_company && (
                <p className="font-medium">{ref.client_company}</p>
              )}
              {ref?.client_name && <p>{ref.client_name}</p>}
              {ref?.client_address && (
                <p className="text-muted">{ref.client_address}</p>
              )}
              {ref?.vat_number ? (
                <p className="font-mono text-xs text-muted">
                  {ref.vat_number}
                </p>
              ) : (
                i.client_email && (
                  <p className="font-mono text-xs text-muted">
                    {i.client_email}
                  </p>
                )
              )}
            </div>
          </div>

          {i.description && (
            <h2 className="mt-7 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {i.description}
              {isDeposit && (
                <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                  voorschot 30%
                </span>
              )}
            </h2>
          )}

          {showDetail && (
            <>
              <div className="mt-7">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Volledige offerte
                  {ref?.offer_no ? ` · ${ref.offer_no}` : ""}
                </p>
                <ul className="space-y-2.5">
                  {oItems.map((it, k) => {
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

              <div className="mt-6 space-y-1.5 rounded-xl border bg-background p-5 text-sm shadow-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>Subtotaal (excl. btw)</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">
                    {eur(oDiscount > 0 ? oGross : oNet)}
                  </span>
                </div>
                {oDiscount > 0 && (
                  <>
                    <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                      <span>Vastlegkorting (directe ondertekening) −7%</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">
                        − {eur(oDiscount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span>Na korting (excl. btw)</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">
                        {eur(oNet)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-muted">
                  <span>{reverse ? "Btw (0% — verlegd)" : "Btw 21%"}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">
                    {eur(oVat)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                  <span>Totaal offerte (incl. btw)</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">
                    {eur(oIncl)}
                  </span>
                </div>
                {oSub && (
                  <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                    <span>{oSub.label}</span>
                    <span className="shrink-0 whitespace-nowrap font-mono">
                      maandelijks
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-6 rounded-xl border-2 border-accent bg-background p-5 text-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent">
              {isDeposit
                ? "Deze voorschotfactuur — nu te betalen"
                : "Deze factuur — nu te betalen"}
            </p>
            <div className="flex items-center justify-between text-muted">
              <span>Subtotaal (excl. btw)</span>
              <span className="font-mono">{eur(amount)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-muted">
              <span>
                {reverse
                  ? "Btw (0% — verlegd, intracommunautair)"
                  : "Btw 21%"}
              </span>
              <span className="font-mono">{eur(vat)}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-base font-semibold">
              <span>Totaal incl. btw</span>
              <span className="font-mono">{eur(incl)}</span>
            </div>
            {i.due_at && !paid && (
              <p className="mt-3 text-xs text-muted">
                Te betalen tegen{" "}
                <strong className="text-foreground">
                  {d(i.due_at)}
                </strong>
              </p>
            )}
            {paid && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                <span className="inline-flex -rotate-3 items-center gap-2 rounded-lg border-2 border-green-600 px-4 py-2 text-base font-extrabold uppercase tracking-widest text-green-600">
                  ✓ Betaald
                </span>
                {i.paid_at && (
                  <span className="text-sm text-muted">
                    Betaald op{" "}
                    <strong className="text-foreground">
                      {d(i.paid_at)}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border bg-background p-5 text-sm shadow-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              Voorwaarden
            </p>
            <p className="text-xs leading-relaxed text-muted">
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
