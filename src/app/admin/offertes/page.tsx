import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { resendOffer, deleteOffer } from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  client_email: string;
  offer_no: string | null;
  title: string;
  amount_cents: number | null;
  status: string;
  valid_until: string | null;
  viewed_at: string | null;
  created_at: string;
};

const STATUSES = ["alle", "open", "akkoord", "afgewezen"] as const;

export default async function AdminOffertes({
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
    .from("offers")
    .select(
      "id, client_email, offer_no, title, amount_cents, status, valid_until, viewed_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  const all = (data as Offer[]) ?? [];
  const offers = status === "alle" ? all : all.filter((o) => o.status === status);

  const eur = (c: number | null | undefined) =>
    c == null ? "—" : `€ ${(c / 100).toFixed(2)}`;
  const sum = (s: string) =>
    all
      .filter((o) => o.status === s)
      .reduce((t, o) => t + (o.amount_cents ?? 0), 0);
  const sBadge = (s: string) =>
    s === "akkoord"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s === "afgewezen"
        ? "bg-red-500/15 text-red-500"
        : "bg-accent/15 text-accent";

  const stats = [
    { k: "Open (waarde)", v: eur(sum("open")) },
    { k: "Akkoord (waarde)", v: eur(sum("akkoord")) },
    {
      k: "Conversie",
      v:
        all.length === 0
          ? "—"
          : `${Math.round(
              (all.filter((o) => o.status === "akkoord").length /
                all.length) *
                100,
            )}%`,
    },
    { k: "Totaal", v: String(all.length) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Offertes</h1>
        <Link
          href="/admin/offertes/nieuw"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          + Nieuwe offerte
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Alle offertes over alle klanten heen.
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

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/offertes${s === "alle" ? "" : `?status=${s}`}`}
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
        {offers.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Geen offertes in deze weergave.
          </p>
        )}
        {offers.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border bg-card p-5"
          >
            <Link
              href={`/admin/klanten/${encodeURIComponent(
                o.client_email,
              )}?tab=offertes`}
              className="min-w-0 flex-1 transition-opacity hover:opacity-80"
            >
              <p className="font-medium">
                {o.offer_no ? `${o.offer_no} · ` : ""}
                {o.title}{" "}
                <span className="text-muted">· {eur(o.amount_cents)}</span>
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted">
                {o.client_email}
                {o.valid_until ? ` · geldig tot ${o.valid_until}` : ""}
                {o.viewed_at ? " · bekeken" : " · niet bekeken"} ·{" "}
                {new Date(o.created_at).toLocaleDateString("nl-BE", {
                  timeZone: "Europe/Brussels",
                })}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  o.status,
                )}`}
              >
                {o.status}
              </span>
              <form action={resendOffer}>
                <input type="hidden" name="id" value={o.id} />
                <button
                  type="submit"
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover"
                >
                  Herverstuur
                </button>
              </form>
              <form action={deleteOffer}>
                <input type="hidden" name="id" value={o.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                >
                  Verwijder
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
