import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setStatus, setNote, deleteQuote } from "@/app/actions/admin";
import { BuilderRender } from "@/components/builder-render";

export const dynamic = "force-dynamic";

const STATUSES = ["nieuw", "in behandeling", "gewonnen", "verloren", "archief"];
const STATUS_COLOR: Record<string, string> = {
  nieuw: "bg-accent/15 text-accent",
  "in behandeling": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  gewonnen: "bg-green-500/15 text-green-600 dark:text-green-400",
  verloren: "bg-red-500/15 text-red-500",
  archief: "bg-muted/15 text-muted",
};

type Block = { kind: string; data: Record<string, unknown> };
type SnapPage = { name: string; blocks: Block[] };
type Snapshot = {
  theme?: string;
  font?: string;
  radius?: string;
  colors?: { bg?: string; fg?: string; accent?: string };
  tagline?: string;
  aboutText?: string;
  ctaText?: string;
  sections?: string[];
  pages?: SnapPage[];
  imageCount?: number;
};

type Quote = {
  id: string;
  created_at: string;
  locale: string;
  name: string;
  email: string;
  message: string | null;
  notes: string | null;
  base: string;
  modules: string[] | null;
  plan: string;
  est_low: number | null;
  est_high: number | null;
  monthly: number | null;
  status: string;
  source: string | null;
  snapshot: Snapshot | null;
};

const eur = (x: number | null) =>
  x == null ? "—" : "€ " + x.toLocaleString("nl-BE");

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function QuoteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;

  const { data } = await getSupabaseAdmin()
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const q = data as Quote;
  const snap = q.snapshot;
  const isBuilder = q.source === "builder";

  const { data: logData } = await getSupabaseAdmin()
    .from("quote_status_log")
    .select("from_status, to_status, created_at")
    .eq("quote_id", q.id)
    .order("created_at", { ascending: false });
  const history = (logData as
    | { from_status: string | null; to_status: string; created_at: string }[]
    | null) ?? [];

  const replyMailto = `mailto:${q.email}?subject=${encodeURIComponent(
    "Re: je aanvraag bij Studio VM",
  )}&body=${encodeURIComponent(`Dag ${q.name},\n\n`)}`;

  return (
    <>
      <Link
        href="/admin/aanvragen"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Terug naar aanvragen
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{q.name}</h1>
          <p className="mt-1 text-sm">
            <a href={`mailto:${q.email}`} className="text-accent underline">
              {q.email}
            </a>
            <span className="ml-2 font-mono text-xs text-muted">
              {new Date(q.created_at).toLocaleString("nl-BE", {
                timeZone: "Europe/Brussels",
              })}{" "}
              ·{" "}
              {q.locale.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBuilder && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">
              BUILDER
            </span>
          )}
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] ${
              STATUS_COLOR[q.status] ?? "bg-muted/15 text-muted"
            }`}
          >
            {q.status}
          </span>
          <a
            href={replyMailto}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            Beantwoord
          </a>
        </div>
      </div>

      {/* Acties */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
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
            Status bewaren
          </button>
        </form>
        <form action={deleteQuote}>
          <input type="hidden" name="id" value={q.id} />
          <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-card-hover">
            Verwijder aanvraag
          </button>
        </form>
      </div>

      {/* Offerte-details */}
      {!isBuilder && (
        <dl className="mt-4 grid gap-x-8 gap-y-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <Field label="Pakket" value={q.base} />
          <Field label="Onderhoud" value={q.plan} />
          <Field
            label="Modules"
            value={q.modules?.length ? q.modules.join(", ") : "—"}
          />
          <Field
            label="Richtprijs"
            value={`${eur(q.est_low)} – ${eur(q.est_high)}`}
          />
          {q.monthly != null && (
            <Field label="Maandelijks" value={`${eur(q.monthly)}/m`} />
          )}
        </dl>
      )}

      {/* tijdelijke diagnose: wat zit er in snapshot? */}
      {isBuilder && (
        <p className="mt-4 rounded-lg border border-dashed bg-card p-3 font-mono text-[11px] text-muted">
          diagnose · snapshot:{" "}
          {snap
            ? `keys=[${Object.keys(snap as object).join(", ")}] · pages=${
                Array.isArray((snap as { pages?: unknown[] }).pages)
                  ? (snap as { pages: unknown[] }).pages.length
                  : "—"
              }`
            : "NULL (geen ontwerp opgeslagen)"}
        </p>
      )}

      {/* Builder-ontwerp */}
      {snap && (
        <div className="mt-4 rounded-2xl border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Builder-ontwerp
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Thema" value={snap.theme} />
            <Field label="Font" value={snap.font} />
            <Field label="Hoeken" value={snap.radius} />
            <Field
              label="Foto's aangeleverd"
              value={snap.imageCount ? String(snap.imageCount) : "0"}
            />
            {snap.colors && (
              <Field
                label="Kleuren"
                value={[
                  snap.colors.bg,
                  snap.colors.fg,
                  snap.colors.accent,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
            {snap.pages && (
              <Field
                label="Menu"
                value={snap.pages.map((p) => p.name).join(" · ")}
              />
            )}
            {!snap.pages && (
              <Field
                label="Secties"
                value={snap.sections?.length ? snap.sections.join(", ") : "—"}
              />
            )}
          </dl>

          {snap.pages && <BuilderRender snap={snap} />}
          {snap.aboutText && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Over-tekst
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">
                {snap.aboutText}
              </p>
            </div>
          )}
          {snap.ctaText && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Oproep-tekst
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">
                {snap.ctaText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statushistoriek */}
      {history.length > 0 && (
        <div className="mt-4 rounded-2xl border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Statushistoriek
          </p>
          <ol className="mt-4 space-y-3">
            {history.map((h, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-[11px] text-muted">
                  {new Date(h.created_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}
                </span>
                <span className="text-muted">
                  {h.from_status ? (
                    <>
                      <span className="line-through">{h.from_status}</span>
                      {" → "}
                    </>
                  ) : null}
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      STATUS_COLOR[h.to_status] ?? "bg-muted/15 text-muted"
                    }`}
                  >
                    {h.to_status}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Bericht — niet voor builder-leads met visueel ontwerp (dubbel) */}
      {q.message && !(isBuilder && snap?.pages) && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Bericht
          </p>
          <pre className="mt-1 whitespace-pre-wrap rounded-2xl border bg-card p-5 font-sans text-sm">
            {q.message}
          </pre>
        </div>
      )}

      {/* Interne notitie */}
      <form action={setNote} className="mt-4">
        <input type="hidden" name="id" value={q.id} />
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Interne notitie
        </label>
        <textarea
          name="notes"
          defaultValue={q.notes ?? ""}
          rows={4}
          placeholder="Enkel zichtbaar voor jou…"
          className="mt-1 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <button className="mt-2 rounded-full border px-4 py-2 text-xs hover:bg-card-hover">
          Notitie bewaren
        </button>
      </form>
    </>
  );
}
