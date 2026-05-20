import Link from "next/link";
import { ArrowRight, Newspaper, History, Lightbulb, CalendarCheck } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  generateJournalBatch,
  generateChangelogBatch,
  generateEvergreen,
  createManualPost,
  scheduleAllConcepts,
  setStatus,
} from "@/app/actions/social";
import { CHANNEL_LABEL, type Channel } from "@/lib/social";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  locale: string;
  headline: string;
  link: string | null;
  channels: string[];
  scheduled_at: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["alle", "concept", "gepland", "gepost", "gearchiveerd"] as const;

export default async function AdminSocial({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; locale?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "alle";
  const loc = ["alle", "nl", "fr", "en"].includes(sp.locale ?? "")
    ? (sp.locale as string)
    : "alle";

  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select(
      "id, kind, locale, headline, link, channels, scheduled_at, status, created_at",
    )
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  const all = (data as Row[]) ?? [];
  const filtered = all.filter(
    (r) =>
      (status === "alle" || r.status === status) &&
      (loc === "alle" || r.locale === loc),
  );

  const now = Date.now();
  const stats = [
    { k: "Concept", v: all.filter((r) => r.status === "concept").length },
    { k: "Gepland", v: all.filter((r) => r.status === "gepland").length },
    {
      k: "Vandaag",
      v: all.filter(
        (r) =>
          r.status === "gepland" &&
          r.scheduled_at &&
          new Date(r.scheduled_at).toDateString() === new Date().toDateString(),
      ).length,
    },
    { k: "Gepost", v: all.filter((r) => r.status === "gepost").length },
  ];

  const sBadge = (s: string) =>
    s === "gepost"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s === "gearchiveerd"
        ? "bg-muted/15 text-muted"
        : s === "gepland"
          ? "bg-accent/15 text-accent"
          : "bg-sky-500/15 text-sky-600 dark:text-sky-400";
  const lBadge = "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase";
  const fmtDT = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("nl-BE", {
          timeZone: "Europe/Brussels",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
      <p className="mt-2 text-sm text-muted">
        Drietalige posts, geplukt uit je journal, changelog en evergreen-tips.
        Klik door op een post voor de per-kanaal teksten en de copy-knoppen.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Genereer in bulk
          </p>
          <p className="mt-1 text-sm text-muted">
            Posts worden automatisch verspreid over 2 slots/dag (≈ 9u en 15u
            Brussel) en als <em>gepland</em> opgeslagen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={generateJournalBatch}>
              <button className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                <Newspaper className="h-4 w-4" strokeWidth={2} /> Uit journal
              </button>
            </form>
            <form action={generateChangelogBatch}>
              <button className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                <History className="h-4 w-4" strokeWidth={2} /> Uit changelog
              </button>
            </form>
            <form action={generateEvergreen} className="flex items-center gap-2">
              <input
                type="number"
                name="count"
                defaultValue={4}
                min={1}
                max={8}
                className="w-16 rounded-full border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                aria-label="Aantal tips"
              />
              <button className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                <Lightbulb className="h-4 w-4" strokeWidth={2} /> Evergreen-tips
              </button>
            </form>
            <form action={scheduleAllConcepts}>
              <button className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                <CalendarCheck className="h-4 w-4" strokeWidth={2} /> Alle
                concepten plannen
              </button>
            </form>
          </div>
        </div>

        <details className="rounded-2xl border bg-card p-5">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted">
            Eigen post toevoegen
          </summary>
          <form action={createManualPost} className="mt-4 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="locale" defaultValue="nl" className={field}>
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
              <input
                type="datetime-local"
                name="scheduled_at"
                className={field}
                aria-label="Inplannen"
              />
            </div>
            <input
              name="hook"
              required
              placeholder="Hook (eerste regel, max 80)"
              className={field}
            />
            <textarea
              name="body"
              rows={3}
              placeholder="Body — 1 à 2 korte alinea's"
              className={field}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="cta" placeholder="CTA" className={field} />
              <input
                name="link"
                placeholder="https://… (volledige URL)"
                className={field}
              />
            </div>
            <input
              name="hashtags"
              placeholder="hashtags (komma- of spatie-gescheiden)"
              className={field}
            />
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              {(["facebook", "instagram", "linkedin", "bluesky", "mastodon"] as Channel[]).map(
                (c) => (
                  <label key={c} className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      name="channels"
                      value={c}
                      defaultChecked
                    />
                    {CHANNEL_LABEL[c]}
                  </label>
                ),
              )}
            </div>
            <button className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
              Opslaan
            </button>
          </form>
        </details>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/social${
              s === "alle" && loc === "alle"
                ? ""
                : `?${[
                    s === "alle" ? "" : `status=${s}`,
                    loc === "alle" ? "" : `locale=${loc}`,
                  ]
                    .filter(Boolean)
                    .join("&")}`
            }`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "hover:bg-card-hover"
            }`}
          >
            {s}
          </Link>
        ))}
        <span className="ml-auto inline-flex gap-1 text-xs">
          {(["alle", "nl", "fr", "en"] as const).map((L) => (
            <Link
              key={L}
              href={`/admin/social?${[
                status === "alle" ? "" : `status=${status}`,
                L === "alle" ? "" : `locale=${L}`,
              ]
                .filter(Boolean)
                .join("&")}`}
              className={`rounded-full border px-3 py-1 transition-colors ${
                loc === L ? "bg-card-hover" : "hover:bg-card-hover"
              }`}
            >
              {L.toUpperCase()}
            </Link>
          ))}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Niets in deze weergave. Genereer een batch hierboven of voeg een
            eigen post toe.
          </p>
        )}
        {filtered.map((r) => {
          const overdue =
            r.status === "gepland" &&
            r.scheduled_at &&
            new Date(r.scheduled_at).getTime() < now;
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              <Link
                href={`/admin/social/${r.id}`}
                className="min-w-0 flex-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`${lBadge} bg-accent/10 text-accent`}
                    title="taal"
                  >
                    {r.locale.toUpperCase()}
                  </span>
                  <span className="truncate font-medium">{r.headline}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-muted">
                  {r.kind} ·{" "}
                  {r.channels
                    .map((c) => CHANNEL_LABEL[c as Channel] ?? c)
                    .join(" · ")}{" "}
                  · ingepland {fmtDT(r.scheduled_at)}
                  {overdue && " · te laat"}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                    r.status,
                  )}`}
                >
                  {r.status}
                </span>
                {r.status === "gepland" && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="gepost" />
                    <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                      Markeer gepost
                    </button>
                  </form>
                )}
                <Link
                  href={`/admin/social/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover"
                >
                  Open <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
