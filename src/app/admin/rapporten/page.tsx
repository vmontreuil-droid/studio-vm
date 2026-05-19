import Link from "next/link";
import { Download, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const eur = (c: number) =>
  (c < 0 ? "− € " : "€ ") +
  (Math.abs(c) / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const quarter = (iso: string) =>
  Math.floor(new Date(iso).getMonth() / 3); // 0..3

export default async function AdminRapporten({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { year: y } = await searchParams;
  const now = new Date();
  const year = Number(y) || now.getFullYear();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const db = getSupabaseAdmin();

  const [invR, purR, cnR] = await Promise.all([
    db
      .from("invoices")
      .select("amount_cents, status, issued_at")
      .gte("issued_at", from)
      .lte("issued_at", to)
      .limit(5000),
    db
      .from("purchase_invoices")
      .select("net_cents, vat_cents, status, invoice_date")
      .gte("invoice_date", from)
      .lte("invoice_date", to)
      .limit(5000),
    db
      .from("credit_notes")
      .select("amount_cents, vat_rate, issued_at")
      .gte("issued_at", from)
      .lte("issued_at", to)
      .limit(5000),
  ]);

  const invs =
    (invR.data as { amount_cents: number; status: string; issued_at: string }[] | null) ??
    [];
  const purs =
    (purR.data as
      | { net_cents: number; vat_cents: number; status: string; invoice_date: string }[]
      | null) ?? [];
  const cns =
    (cnR.data as { amount_cents: number; vat_rate: number; issued_at: string }[] | null) ??
    [];

  // Per kwartaal: verschuldigde btw (verkoop − credit) en aftrekbare
  // btw (aankoop). Verkoopfacturen worden als 21% behandeld.
  const Q = [0, 1, 2, 3].map((qi) => {
    const saleNet = invs
      .filter((i) => quarter(i.issued_at) === qi)
      .reduce((s, i) => s + i.amount_cents, 0);
    const saleVat = Math.round(saleNet * 0.21);
    const cnNet = cns
      .filter((c) => quarter(c.issued_at) === qi)
      .reduce((s, c) => s + c.amount_cents, 0);
    const cnVat = cns
      .filter((c) => quarter(c.issued_at) === qi)
      .reduce((s, c) => s + Math.round(c.amount_cents * (c.vat_rate / 100)), 0);
    const buyNet = purs
      .filter((p) => quarter(p.invoice_date) === qi)
      .reduce((s, p) => s + p.net_cents, 0);
    const buyVat = purs
      .filter((p) => quarter(p.invoice_date) === qi)
      .reduce((s, p) => s + p.vat_cents, 0);
    const verschuldigd = saleVat - cnVat;
    const aftrekbaar = buyVat;
    return {
      q: qi + 1,
      omzet: saleNet - cnNet,
      kosten: buyNet,
      verschuldigd,
      aftrekbaar,
      saldo: verschuldigd - aftrekbaar,
    };
  });

  const omzet = Q.reduce((s, q) => s + q.omzet, 0);
  const kosten = Q.reduce((s, q) => s + q.kosten, 0);
  const resultaat = omzet - kosten;
  const btwSaldo = Q.reduce((s, q) => s + q.saldo, 0);
  const debiteuren = invs
    .filter((i) => i.status === "open")
    .reduce((s, i) => s + Math.round(i.amount_cents * 1.21), 0);
  const crediteuren = purs
    .filter((p) => p.status === "open")
    .reduce((s, p) => s + p.net_cents + p.vat_cents, 0);

  const years = Array.from({ length: 5 }, (_, k) => now.getFullYear() - k);

  const kpi = [
    { k: "Omzet", v: eur(omzet), icon: TrendingUp, sub: "excl. btw" },
    { k: "Kosten", v: eur(kosten), icon: TrendingDown, sub: "aankoop excl. btw" },
    {
      k: "Brutoresultaat",
      v: eur(resultaat),
      icon: Scale,
      sub: "omzet − kosten",
    },
    {
      k: "Btw-saldo",
      v: eur(btwSaldo),
      icon: Scale,
      sub: btwSaldo >= 0 ? "te betalen" : "terug te vorderen",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Rapporten
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Boekjaar {year} — btw-voorbereiding, resultaat en
            accountant-export.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {years.map((yr) => (
            <Link
              key={yr}
              href={`/admin/rapporten?year=${yr}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                yr === year
                  ? "border-accent bg-accent/10 text-accent"
                  : "hover:bg-card-hover"
              }`}
            >
              {yr}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {s.k}
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-2 truncate text-2xl font-semibold">{s.v}</p>
              <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Btw per kwartaal — voorbereiding aangifte
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-5 py-3">Kwartaal</th>
                <th className="px-5 py-3 text-right">Omzet</th>
                <th className="px-5 py-3 text-right">Btw verschuldigd</th>
                <th className="px-5 py-3 text-right">Btw aftrekbaar</th>
                <th className="px-5 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Q.map((q) => (
                <tr key={q.q}>
                  <td className="px-5 py-3 font-medium">Q{q.q}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {eur(q.omzet)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    {eur(q.verschuldigd)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    {eur(q.aftrekbaar)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono font-semibold ${
                      q.saldo >= 0
                        ? "text-foreground"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {eur(q.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted">
          Indicatief (verkoop op 21%). De officiële btw-aangifte en
          Peppol/UBL-verzending verlopen via je accountant of Billit —
          dit scherm bereidt de cijfers voor.
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Nog te ontvangen (debiteuren)
          </p>
          <p className="mt-2 text-2xl font-semibold">{eur(debiteuren)}</p>
          <Link
            href="/admin/facturen?status=open"
            className="mt-1 inline-block text-xs text-muted hover:text-foreground"
          >
            Openstaande verkoopfacturen →
          </Link>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Nog te betalen (crediteuren)
          </p>
          <p className="mt-2 text-2xl font-semibold">{eur(crediteuren)}</p>
          <Link
            href="/admin/aankoopfacturen"
            className="mt-1 inline-block text-xs text-muted hover:text-foreground"
          >
            Openstaande aankoopfacturen →
          </Link>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Export voor de accountant ({year})
        </p>
        <p className="mt-1 text-sm text-muted">
          CSV-bestanden (Excel-compatibel) met alle lijnen van het
          boekjaar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { t: "verkoop", label: "Verkoopfacturen" },
            { t: "aankoop", label: "Aankoopfacturen" },
            { t: "credit", label: "Creditnota's" },
          ].map((x) => (
            <a
              key={x.t}
              href={`/api/admin/export?year=${year}&type=${x.t}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              {x.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
