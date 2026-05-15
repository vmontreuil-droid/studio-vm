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

  // Aanvragen per week (laatste 8 weken, week start maandag).
  const DAY = 86_400_000;
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(monday.getTime() - (7 - i) * 7 * DAY);
    return { start, count: 0 };
  });
  for (const r of quotes) {
    const t = new Date(r.created_at).getTime();
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (t >= weeks[i].start.getTime()) {
        weeks[i].count++;
        break;
      }
    }
  }
  const weekMax = Math.max(1, ...weeks.map((w) => w.count));

  const SOURCES: { key: string; label: string }[] = [
    { key: "builder", label: "Builder" },
    { key: "offerte-calculator", label: "Offerte" },
    { key: "contact", label: "Contact" },
  ];
  const known = new Set(SOURCES.map((s) => s.key));
  const bySource = SOURCES.map((s) => ({
    label: s.label,
    n: quotes.filter((r) => r.source === s.key).length,
  }));
  bySource.push({
    label: "Overig",
    n: quotes.filter((r) => !r.source || !known.has(r.source)).length,
  });
  const srcMax = Math.max(1, ...bySource.map((s) => s.n));

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

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Aanvragen per week
          </p>
          <div className="mt-5 flex h-32 items-end gap-2">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="font-mono text-[10px] text-muted">
                  {w.count}
                </span>
                <div
                  className="w-full rounded-t bg-accent/70"
                  style={{
                    height: `${Math.max(2, (w.count / weekMax) * 100)}%`,
                  }}
                />
                <span className="font-mono text-[9px] text-muted">
                  {w.start.toLocaleDateString("nl-BE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Per bron
          </p>
          <div className="mt-5 space-y-3">
            {bySource.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>{s.label}</span>
                  <span>{s.n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{ width: `${(s.n / srcMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
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
