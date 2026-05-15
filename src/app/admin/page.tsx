import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { ADMIN_COOKIE, isValidAdmin } from "@/lib/admin-auth";
import {
  setStatus,
  setNote,
  deleteQuote,
  setMonitorActive,
  deleteMonitor,
} from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Quote = {
  id: string;
  created_at: string;
  locale: string;
  name: string;
  email: string;
  message: string | null;
  notes: string | null;
  base: string;
  modules: string[];
  plan: string;
  est_low: number | null;
  est_high: number | null;
  status: string;
  source: string | null;
};

type Monitor = {
  id: string;
  token: string;
  locale: string;
  url: string;
  email: string;
  active: boolean;
  last_scan_at: string | null;
};

const STATUSES = [
  "nieuw",
  "in behandeling",
  "gewonnen",
  "verloren",
  "archief",
];
const STATUS_COLOR: Record<string, string> = {
  nieuw: "bg-accent/15 text-accent",
  "in behandeling": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  gewonnen: "bg-green-500/15 text-green-600 dark:text-green-400",
  verloren: "bg-red-500/15 text-red-500",
  archief: "bg-muted/15 text-muted",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">{children}</main>
  );
}

export default async function AdminHub({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; status?: string; q?: string; src?: string }>;
}) {
  const sp = await searchParams;

  if (!adminConfigured) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-4 text-muted">
          Nog niet geconfigureerd. Zet <code>ADMIN_PASSWORD</code> +
          Supabase-keys en pas migraties 0002–0004 toe.
        </p>
      </Shell>
    );
  }

  const jar = await cookies();
  if (!isValidAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <form
          action="/api/admin/login"
          method="post"
          className="mt-6 max-w-sm space-y-3"
        >
          <input
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Wachtwoord"
            className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {sp.e && (
            <p className="text-sm text-red-500">Onjuist wachtwoord.</p>
          )}
          <button className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
            Inloggen
          </button>
        </form>
      </Shell>
    );
  }

  const db = getSupabaseAdmin();
  let qy = db
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (sp.status && STATUSES.includes(sp.status))
    qy = qy.eq("status", sp.status);
  if (sp.src) qy = qy.eq("source", sp.src);
  const { data: qData } = await qy;
  let rows = (qData as Quote[]) ?? [];
  if (sp.q) {
    const needle = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(needle) ||
        r.email?.toLowerCase().includes(needle) ||
        r.message?.toLowerCase().includes(needle),
    );
  }

  const { data: mData } = await db
    .from("monitors")
    .select("id, token, locale, url, email, active, last_scan_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const monitors = (mData as Monitor[]) ?? [];

  const all = qData as Quote[] | null;
  const counts = {
    total: all?.length ?? 0,
    nieuw: all?.filter((r) => r.status === "nieuw").length ?? 0,
    builder: all?.filter((r) => r.source === "builder").length ?? 0,
    monitors: monitors.length,
  };

  const eur = (n: number | null) =>
    n == null ? "—" : "€ " + n.toLocaleString("nl-BE");
  const Stat = ({ k, v }: { k: string; v: number }) => (
    <div className="rounded-2xl border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {k}
      </p>
      <p className="mt-1 text-2xl font-semibold">{v}</p>
    </div>
  );
  const chip = (label: string, params: Record<string, string>) => {
    const u = new URLSearchParams(params).toString();
    const active =
      (params.status ?? "") === (sp.status ?? "") &&
      (params.src ?? "") === (sp.src ?? "");
    return (
      <a
        key={label}
        href={`/admin${u ? `?${u}` : ""}`}
        className={`rounded-full border px-3 py-1 text-xs ${
          active ? "border-accent text-accent" : "text-muted hover:text-foreground"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-full border px-4 py-2 text-xs">
            Uitloggen
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Aanvragen" v={counts.total} />
        <Stat k="Nieuw" v={counts.nieuw} />
        <Stat k="Builder" v={counts.builder} />
        <Stat k="Monitors" v={counts.monitors} />
      </div>

      <form className="mt-8 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Zoek naam / e-mail / tekst…"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
        />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        {sp.src && <input type="hidden" name="src" value={sp.src} />}
        <button className="rounded-full border px-4 py-2 text-xs">
          Zoeken
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {chip("Alles", {})}
        {STATUSES.map((s) => chip(s, { status: s }))}
        {chip("· builder", { src: "builder" })}
        {chip("· offerte", { src: "offerte-calculator" })}
        {chip("· contact", { src: "contact" })}
      </div>

      <ul className="mt-6 space-y-4">
        {rows.length === 0 && (
          <li className="rounded-2xl border bg-card p-6 text-muted">
            Geen aanvragen voor deze filter.
          </li>
        )}
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
                {q.source === "builder" && (
                  <span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-accent">
                    BUILDER
                  </span>
                )}
                {new Date(q.created_at).toLocaleString("nl-BE")} ·{" "}
                {q.locale.toUpperCase()}
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 ${
                    STATUS_COLOR[q.status] ?? "bg-muted/15 text-muted"
                  }`}
                >
                  {q.status}
                </span>
              </span>
            </div>

            {q.source !== "builder" && (
              <div className="mt-2 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                <span>
                  <span className="text-muted">Pakket:</span>{" "}
                  <strong>{q.base}</strong> · {q.plan}
                </span>
                <span>
                  <span className="text-muted">Richtprijs:</span>{" "}
                  {eur(q.est_low)} – {eur(q.est_high)}
                </span>
                {q.modules?.length > 0 && (
                  <span className="sm:col-span-2">
                    <span className="text-muted">Modules:</span>{" "}
                    {q.modules.join(", ")}
                  </span>
                )}
              </div>
            )}

            {q.message && (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-background p-3 font-sans text-sm">
                {q.message}
              </pre>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <form action={setStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={q.id} />
                <select
                  name="status"
                  defaultValue={q.status}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                  Status
                </button>
              </form>
              <form action={deleteQuote}>
                <input type="hidden" name="id" value={q.id} />
                <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-card-hover">
                  Verwijder
                </button>
              </form>
            </div>

            <form action={setNote} className="mt-3">
              <input type="hidden" name="id" value={q.id} />
              <textarea
                name="notes"
                defaultValue={q.notes ?? ""}
                rows={2}
                placeholder="Interne notitie…"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button className="mt-1 rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                Notitie bewaren
              </button>
            </form>
          </li>
        ))}
      </ul>

      {monitors.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
            Monitors ({monitors.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {monitors.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2 text-sm"
              >
                <span>
                  <strong>{m.url}</strong>{" "}
                  <span className="text-muted">· {m.email}</span>
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      m.active
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-muted/15 text-muted"
                    }`}
                  >
                    {m.active ? "actief" : "inactief"}
                  </span>
                  {m.last_scan_at && (
                    <span className="ml-2 font-mono text-[10px] text-muted">
                      laatste scan{" "}
                      {new Date(m.last_scan_at).toLocaleDateString("nl-BE")}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <a
                    href={`/${m.locale}/scan/historiek/${m.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-3 py-1 text-xs text-muted hover:text-foreground"
                  >
                    Historiek
                  </a>
                  <form action={setMonitorActive}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={m.active ? "0" : "1"}
                    />
                    <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                      {m.active ? "Deactiveer" : "Activeer"}
                    </button>
                  </form>
                  <form action={deleteMonitor}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="rounded-full border px-3 py-1 text-xs text-red-500 hover:bg-card-hover">
                      Verwijder
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
