import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured, leadsConfigured } from "@/lib/supabase/config";
import { ADMIN_COOKIE, isValidAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Quote = {
  id: string;
  created_at: string;
  locale: string;
  name: string;
  email: string;
  message: string | null;
  base: string;
  modules: string[];
  plan: string;
  est_low: number | null;
  est_high: number | null;
  monthly: number | null;
  status: string;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Offerte-aanvragen
      </h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}

export default async function AdminQuotes({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  if (!adminConfigured) {
    return (
      <Shell>
        <p className="text-muted">
          Admin nog niet geconfigureerd. Zet <code>ADMIN_PASSWORD</code> +
          Supabase-keys in Vercel en pas{" "}
          <code>supabase/migrations/0002_quotes.sql</code> toe.
        </p>
      </Shell>
    );
  }

  const jar = await cookies();
  if (!isValidAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <Shell>
        <form
          action="/api/admin/login"
          method="post"
          className="max-w-sm space-y-3"
        >
          <label className="block text-sm font-medium">Wachtwoord</label>
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {e && (
            <p className="text-sm text-red-500">Onjuist wachtwoord.</p>
          )}
          <button
            type="submit"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
          >
            Inloggen
          </button>
        </form>
      </Shell>
    );
  }

  let rows: Quote[] = [];
  if (leadsConfigured) {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (data as Quote[]) ?? [];
  }

  const eur = (n: number | null) =>
    n == null ? "—" : "€ " + n.toLocaleString("nl-BE");

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">{rows.length} aanvragen</p>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-full border px-4 py-2 text-xs">
            Uitloggen
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted">Nog geen aanvragen.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((q) => (
            <li key={q.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {q.name}{" "}
                  <a
                    href={`mailto:${q.email}`}
                    className="font-normal text-accent underline"
                  >
                    {q.email}
                  </a>
                </p>
                <span className="font-mono text-xs text-muted">
                  {new Date(q.created_at).toLocaleString("nl-BE")} ·{" "}
                  {q.locale.toUpperCase()} · {q.status}
                </span>
              </div>
              <div className="mt-2 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                <span>
                  <span className="text-muted">Pakket:</span>{" "}
                  <strong>{q.base}</strong>
                </span>
                <span>
                  <span className="text-muted">Onderhoud:</span> {q.plan}
                  {q.monthly ? ` (${eur(q.monthly)}/m)` : ""}
                </span>
                <span>
                  <span className="text-muted">Modules:</span>{" "}
                  {q.modules?.length ? q.modules.join(", ") : "—"}
                </span>
                <span>
                  <span className="text-muted">Richtprijs:</span>{" "}
                  {eur(q.est_low)} – {eur(q.est_high)}
                </span>
              </div>
              {q.message && (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">
                  {q.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
