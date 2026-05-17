import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { addClient } from "@/app/actions/portal-admin";
import type { ScanResult } from "@/app/actions/scan";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  email: string;
  url: string;
  scan: ScanResult;
  created_at: string;
};

type Client = {
  email: string;
  scans: number;
  lastAt: string;
  host: string;
  grade: string | null;
  score: number | null;
};

export default async function AdminKlanten({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("id, email, url, scan, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  const rows = (data as Row[]) ?? [];

  const byEmail = new Map<string, Client>();
  for (const r of rows) {
    const key = r.email?.toLowerCase().trim();
    if (!key) continue;
    const sc = r.scan && r.scan.ok ? r.scan : null;
    const existing = byEmail.get(key);
    if (existing) {
      existing.scans += 1;
      continue; // rows zijn al nieuw→oud gesorteerd, eerste = laatste
    }
    byEmail.set(key, {
      email: key,
      scans: 1,
      lastAt: r.created_at,
      host: sc ? sc.host : r.url,
      grade: sc ? sc.grade : null,
      score: sc ? sc.score : null,
    });
  }
  // Ook klanten die via de configurator binnenkwamen (geen scan) of
  // een abonnement hebben, horen hier — niet enkel scan-leads.
  const [{ data: subData }, { data: cfgData }] = await Promise.all([
    getSupabaseAdmin()
      .from("subscriptions")
      .select("client_email, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    getSupabaseAdmin()
      .from("quotes")
      .select("email, name, company, created_at, source")
      .in("source", ["offerte-configurator", "builder"])
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  for (const s of (subData as
    | { client_email: string; plan: string; created_at: string }[]
    | null) ?? []) {
    const key = s.client_email?.toLowerCase().trim();
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, {
      email: key,
      scans: 0,
      lastAt: s.created_at,
      host: `Abonnement ${s.plan}`,
      grade: null,
      score: null,
    });
  }
  for (const c of (cfgData as
    | {
        email: string;
        name: string;
        company: string | null;
        created_at: string;
        source: string | null;
      }[]
    | null) ?? []) {
    const key = c.email?.toLowerCase().trim();
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, {
      email: key,
      scans: 0,
      lastAt: c.created_at,
      host:
        c.company ||
        c.name ||
        (c.source === "builder" ? "Via builder" : "Via configurator"),
      grade: null,
      score: null,
    });
  }

  let clients = [...byEmail.values()];
  clients.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  if (sp.q) {
    const n = sp.q.toLowerCase();
    clients = clients.filter(
      (c) => c.email.includes(n) || c.host.toLowerCase().includes(n),
    );
  }

  const gradeColor = (s: number | null) =>
    s == null
      ? "bg-muted/15 text-muted"
      : s >= 75
        ? "bg-green-500/15 text-green-600 dark:text-green-400"
        : s >= 45
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "bg-red-500/15 text-red-500";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Klanten</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Zoek op e-mail of site…"
            className="rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Zoek
          </button>
        </form>
      </div>

      <p className="mt-2 text-sm text-muted">
        {clients.length} klant{clients.length === 1 ? "" : "en"} — automatisch
        uit scans, configurator-aanvragen en abonnementen.
      </p>

      <form
        action={addClient}
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:flex-row sm:items-center"
      >
        <UserPlus className="hidden h-4 w-4 shrink-0 text-accent sm:block" strokeWidth={2} />
        <input
          name="client_email"
          type="email"
          required
          placeholder="Klant toevoegen — e-mailadres"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Toevoegen &amp; openen
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {clients.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Nog geen klanten. Zodra iemand een scan met e-mail doet,
            verschijnt die hier automatisch.
          </p>
        )}
        {clients.map((c) => (
          <Link
            key={c.email}
            href={`/admin/klanten/${encodeURIComponent(c.email)}`}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {c.score != null && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${gradeColor(
                      c.score,
                    )}`}
                  >
                    {c.grade} · {c.score}
                  </span>
                )}
                <span className="truncate font-medium">{c.email}</span>
              </div>
              <p className="mt-1 truncate text-sm text-muted">{c.host}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {c.scans > 0
                  ? `${c.scans} scan${c.scans === 1 ? "" : "s"}`
                  : "via configurator / abonnement"}{" "}
                · laatst{" "}
                {new Date(c.lastAt).toLocaleDateString("nl-BE", {
                  timeZone: "Europe/Brussels",
                })}
              </p>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted"
              strokeWidth={2}
            />
          </Link>
        ))}
      </div>
    </>
  );
}
