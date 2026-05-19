import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setInvoiceStatus } from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Invoice = {
  id: string;
  client_email: string;
  number: string;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  offer_id: string | null;
  description: string | null;
};

const STATUSES = ["alle", "open", "betaald", "vervallen"] as const;

export default async function AdminFacturen({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "alle";

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("invoices")
    .select(
      "id, client_email, number, amount_cents, status, issued_at, due_at, paid_at, offer_id, description",
    )
    .order("issued_at", { ascending: false })
    .limit(1000);
  const all = (data as Invoice[]) ?? [];
  const offerIds = [
    ...new Set(all.map((i) => i.offer_id).filter(Boolean)),
  ] as string[];
  const reverseByOffer = new Map<string, boolean>();
  if (offerIds.length > 0) {
    const { data: offs } = await db
      .from("offers")
      .select("id, vat_reverse")
      .in("id", offerIds);
    for (const o of (offs as {
      id: string;
      vat_reverse: boolean | null;
    }[]) ?? [])
      reverseByOffer.set(o.id, !!o.vat_reverse);
  }
  const inclOf = (i: Invoice) =>
    i.offer_id && reverseByOffer.get(i.offer_id)
      ? i.amount_cents
      : Math.round(i.amount_cents * 1.21);
  const invoices =
    status === "alle" ? all : all.filter((i) => i.status === status);

  const eur = (c: number) =>
    "€ " +
    (c / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const sum = (s: string) =>
    all
      .filter((i) => i.status === s)
      .reduce((t, i) => t + i.amount_cents, 0);
  const now = new Date();
  const ymThis = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paidThisMonth = all
    .filter(
      (i) =>
        i.status === "betaald" &&
        (i.paid_at ?? i.issued_at).startsWith(ymThis),
    )
    .reduce((t, i) => t + i.amount_cents, 0);
  const sBadge = (s: string) =>
    s === "betaald"
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : s === "vervallen"
        ? "bg-red-500/15 text-red-600 dark:text-red-400"
        : "bg-accent/15 text-accent";
  const isOverdue = (i: Invoice) =>
    i.status === "open" &&
    i.due_at != null &&
    new Date(i.due_at).getTime() < now.getTime();
  const d = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("nl-BE") : "—";

  const stats = [
    { k: "Openstaand", v: eur(sum("open")), tone: "text-accent" },
    {
      k: "Betaald (deze maand)",
      v: eur(paidThisMonth),
      tone: "text-green-600 dark:text-green-400",
    },
    {
      k: "Vervallen",
      v: eur(sum("vervallen")),
      tone: "text-red-600 dark:text-red-400",
    },
    { k: "Aantal facturen", v: String(all.length), tone: "" },
  ];
  const count = (s: string) =>
    s === "alle" ? all.length : all.filter((i) => i.status === s).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Facturen
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Alle verkoopfacturen over alle klanten heen.
          </p>
        </div>
      </div>

      {/* KPI-strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-xl bg-card shadow-sm p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className={`mt-1 truncate text-xl font-semibold ${s.tone}`}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar + tabel */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-3">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/facturen${s === "alle" ? "" : `?status=${s}`}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === s
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
              }`}
            >
              {s} · {count(s)}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Nummer</th>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium">Uitgereikt</th>
                <th className="px-4 py-3 font-medium">Vervalt</th>
                <th className="px-4 py-3 text-right font-medium">
                  Excl. btw
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Incl. btw
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    Geen facturen in deze weergave.
                  </td>
                </tr>
              )}
              {invoices.map((i) => {
                const overdue = isOverdue(i);
                const deposit = /voorschot\s*30%/i.test(
                  i.description ?? "",
                );
                return (
                  <tr
                    key={i.id}
                    className={`group transition-colors hover:bg-card-hover ${
                      overdue ? "bg-red-500/[0.04]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/facturen/${i.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {i.number}
                      </Link>
                      {deposit && (
                        <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-accent">
                          voorschot
                        </span>
                      )}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">
                      {i.client_email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {d(i.issued_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {i.status === "betaald" && i.paid_at ? (
                        <span className="text-green-700 dark:text-green-400">
                          betaald {d(i.paid_at)}
                        </span>
                      ) : i.due_at ? (
                        <span
                          className={
                            overdue
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-muted"
                          }
                        >
                          {d(i.due_at)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted">
                      {eur(i.amount_cents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium">
                      {eur(inclOf(i))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                          i.status,
                        )}`}
                      >
                        {overdue ? "te laat" : i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                        {i.status !== "betaald" && (
                          <form
                            action={setInvoiceStatus.bind(
                              null,
                              i.id,
                              "betaald",
                            )}
                          >
                            <button className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-400">
                              Betaald
                            </button>
                          </form>
                        )}
                        {i.status === "open" && (
                          <form
                            action={setInvoiceStatus.bind(
                              null,
                              i.id,
                              "vervallen",
                            )}
                          >
                            <button className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-card-hover">
                              Vervallen
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
