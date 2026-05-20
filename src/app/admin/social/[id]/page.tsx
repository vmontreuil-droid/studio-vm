import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  CHANNEL_LABEL,
  CHANNEL_LIMIT,
  CHANNELS,
  type Channel,
  type Variants,
} from "@/lib/social";
import {
  updateVariant,
  setStatus,
  setSchedule,
  deletePost,
} from "@/app/actions/social";
import { CopyButton } from "@/components/admin/copy-button";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  locale: string;
  headline: string;
  link: string | null;
  channels: string[];
  variants: Variants;
  scheduled_at: string | null;
  status: string;
  posted_at: string | null;
  created_at: string;
};

export default async function AdminSocialDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;

  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const r = data as Row | null;
  if (!r) {
    return (
      <>
        <Link
          href="/admin/social"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Terug
        </Link>
        <p className="mt-6 text-sm text-muted">Post niet gevonden.</p>
      </>
    );
  }

  const dtLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const channels: Channel[] = (r.channels.filter((c) =>
    CHANNELS.includes(c as Channel),
  ) as Channel[]).length
    ? (r.channels as Channel[])
    : [...CHANNELS];

  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  const sBadge = (s: string) =>
    s === "gepost"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s === "gearchiveerd"
        ? "bg-muted/15 text-muted"
        : s === "gepland"
          ? "bg-accent/15 text-accent"
          : "bg-sky-500/15 text-sky-600 dark:text-sky-400";

  return (
    <>
      <Link
        href="/admin/social"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Terug naar Social
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold tracking-tight">
            {r.headline}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {r.kind} · {r.locale.toUpperCase()} · aangemaakt{" "}
            {new Date(r.created_at).toLocaleDateString("nl-BE", {
              timeZone: "Europe/Brussels",
            })}
            {r.link ? (
              <>
                {" · "}
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  bronlink
                </a>
              </>
            ) : null}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
            r.status,
          )}`}
        >
          {r.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <form
          action={setSchedule}
          className="flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="id" value={r.id} />
          <input
            type="datetime-local"
            name="scheduled_at"
            defaultValue={dtLocal(r.scheduled_at)}
            className={field}
            aria-label="Inplannen"
          />
          <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Plan opslaan
          </button>
        </form>
        <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
          {r.status !== "gepost" && (
            <form action={setStatus}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value="gepost" />
              <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
                Markeer als gepost
              </button>
            </form>
          )}
          {r.status !== "concept" && (
            <form action={setStatus}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value="concept" />
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-card-hover">
                → concept
              </button>
            </form>
          )}
          {r.status !== "gearchiveerd" && (
            <form action={setStatus}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value="gearchiveerd" />
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-card-hover">
                Archiveer
              </button>
            </form>
          )}
          <form action={deletePost} className="ml-auto">
            <input type="hidden" name="id" value={r.id} />
            <button className="rounded-full border px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">
              Verwijder
            </button>
          </form>
        </div>
      </div>

      <h2 className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
        Per kanaal
      </h2>
      <p className="mt-1 text-sm text-muted">
        Pas de tekst per kanaal aan en kopieer &#39;m met één klik.
      </p>

      <div className="mt-4 space-y-4">
        {channels.map((ch) => {
          const text = r.variants?.[ch]?.text ?? "";
          const limit = CHANNEL_LIMIT[ch];
          const over = text.length > limit;
          return (
            <div key={ch} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{CHANNEL_LABEL[ch]}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] ${
                      over ? "text-red-500" : "text-muted"
                    }`}
                  >
                    {text.length}/{limit}
                  </span>
                  <CopyButton text={text} />
                </div>
              </div>
              <form action={updateVariant} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="channel" value={ch} />
                <textarea
                  name="text"
                  defaultValue={text}
                  rows={ch === "bluesky" || ch === "mastodon" ? 4 : 8}
                  className={`${field} font-mono text-sm leading-relaxed`}
                />
                <div className="flex justify-end">
                  <button className="rounded-full border px-4 py-1.5 text-xs hover:bg-card-hover">
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
