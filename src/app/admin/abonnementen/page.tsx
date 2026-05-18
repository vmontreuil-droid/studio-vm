import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  client_email: string;
  plan: string;
  price_cents: number;
  period: string;
  status: string;
  started_at: string;
};

const STATUSES = ["alle", "actief", "gepauzeerd", "gestopt"] as const;

// Maandwaarde: jaarabonnementen tellen we /12 mee in de MRR.
function monthlyCents(s: Sub): number {
  return /jaar|year|annu/i.test(s.period)
    ? Math.round(s.price_cents / 12)
    : s.price_cents;
}

export default async function AdminAbonnementen({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "alle";

  const { data } = await getSupabaseAdmin()
    .from("subscriptions")
    .select(
      "id, client_email, plan, price_cents, period, status, started_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  const all = (data as Sub[]) ?? [];
  const subs = status === "alle" ? all : all.filter((s) => s.status === status);

  const eur = (c: number) => `€ ${(c / 100).toFixed(2)}`;
  const active = all.filter((s) => s.status === "actief");
  const mrr = active.reduce((t, s) => t + monthlyCents(s), 0);
  const arr = mrr * 12;
  const byPlan = new Map<string, number>();
  for (const s of active)
    byPlan.set(s.plan, (byPlan.get(s.plan) ?? 0) + 1);
  const plans = [...byPlan.entries()].sort((a, b) => b[1] - a[1]);

  const sBadge = (s: string) =>
    s === "actief"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s === "gestopt"
        ? "bg-red-500/15 text-red-500"
        : "bg-accent/15 text-accent";

  const stats = [
    { k: "MRR", v: eur(mrr) },
    { k: "ARR", v: eur(arr) },
    { k: "Actieve abonnementen", v: String(active.length) },
    {
      k: "Gem. per klant",
      v: active.length === 0 ? "—" : eur(Math.round(mrr / active.length)),
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Abonnementen</h1>
      <p className="mt-2 text-sm text-muted">
        Terugkerende omzet over alle klanten heen.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 truncate text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      {plans.length > 0 && (
        <div className="mt-3 rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Actieve abonnees per plan
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {plans.map(([plan, n]) => (
              <span
                key={plan}
                className="rounded-full bg-card-hover px-3 py-1.5 text-sm"
              >
                {plan} <span className="text-muted">· {n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/abonnementen${s === "alle" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "hover:bg-card-hover"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {subs.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Geen abonnementen in deze weergave.
          </p>
        )}
        {subs.map((s) => (
          <Link
            key={s.id}
            href={`/admin/klanten/${encodeURIComponent(
              s.client_email,
            )}?tab=abonnement`}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {s.plan}{" "}
                <span className="text-muted">
                  · {eur(s.price_cents)} / {s.period}
                </span>
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted">
                {s.client_email} · sinds{" "}
                {new Date(s.started_at).toLocaleDateString("nl-BE")}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                s.status,
              )}`}
            >
              {s.status}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
