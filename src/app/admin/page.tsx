import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const db = getSupabaseAdmin();
  const [{ data: q }, { data: m }, subsR] = await Promise.all([
    db
      .from("quotes")
      .select("id, name, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    db.from("monitors").select("id, active").limit(500),
    db
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
  ]);
  const quotes = q ?? [];
  const monitors = m ?? [];
  const subscribers = subsR.count ?? 0;

  const stats = [
    { k: "Aanvragen", v: quotes.length },
    { k: "Nieuw", v: quotes.filter((r) => r.status === "nieuw").length },
    { k: "Builder", v: quotes.filter((r) => r.source === "builder").length },
    {
      k: "Monitors actief",
      v: monitors.filter((r) => r.active).length,
    },
    { k: "Abonnees", v: subscribers },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 text-3xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Recentste aanvragen
        </h2>
        <Link
          href="/admin/aanvragen"
          className="text-xs text-muted hover:text-foreground"
        >
          Alle aanvragen →
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border bg-card">
        {quotes.length === 0 && (
          <li className="p-5 text-sm text-muted">Nog geen aanvragen.</li>
        )}
        {quotes.slice(0, 6).map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
          >
            <span>
              <strong>{r.name}</strong>{" "}
              <span className="text-muted">· {r.email}</span>
            </span>
            <span className="font-mono text-xs text-muted">
              {r.source === "builder" && (
                <span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-accent">
                  BUILDER
                </span>
              )}
              {r.status} ·{" "}
              {new Date(r.created_at).toLocaleDateString("nl-BE")}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
