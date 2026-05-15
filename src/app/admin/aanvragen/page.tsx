import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setStatus, setNote, deleteQuote } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

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

const STATUSES = ["nieuw", "in behandeling", "gewonnen", "verloren", "archief"];
const STATUS_COLOR: Record<string, string> = {
  nieuw: "bg-accent/15 text-accent",
  "in behandeling": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  gewonnen: "bg-green-500/15 text-green-600 dark:text-green-400",
  verloren: "bg-red-500/15 text-red-500",
  archief: "bg-muted/15 text-muted",
};

export default async function AdminAanvragen({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; src?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;

  const db = getSupabaseAdmin();
  let qy = db
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(400);
  if (sp.status && STATUSES.includes(sp.status))
    qy = qy.eq("status", sp.status);
  if (sp.src) qy = qy.eq("source", sp.src);
  const { data } = await qy;
  let rows = (data as Quote[]) ?? [];
  if (sp.q) {
    const n = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(n) ||
        r.email?.toLowerCase().includes(n) ||
        r.message?.toLowerCase().includes(n),
    );
  }

  const eur = (x: number | null) =>
    x == null ? "—" : "€ " + x.toLocaleString("nl-BE");
  const chip = (label: string, params: Record<string, string>) => {
    const u = new URLSearchParams(params).toString();
    const active =
      (params.status ?? "") === (sp.status ?? "") &&
      (params.src ?? "") === (sp.src ?? "");
    return (
      <a
        key={label}
        href={`/admin/aanvragen${u ? `?${u}` : ""}`}
        className={`rounded-full border px-3 py-1 text-xs ${
          active
            ? "border-accent text-accent"
            : "text-muted hover:text-foreground"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Aanvragen{" "}
          <span className="text-muted">({rows.length})</span>
        </h1>
        {rows.length > 0 && (
          <a
            href="/admin/aanvragen/export"
            className="rounded-full border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Exporteer CSV
          </a>
        )}
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2">
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
    </>
  );
}
