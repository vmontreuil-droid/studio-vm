import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  adminUnpublishDesign,
  adminDeleteDesign,
} from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Design = {
  id: string;
  client_email: string;
  title: string;
  status: string;
  slug: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const VIEWS = ["alle", "online", "verstuurd", "concept"] as const;

export default async function AdminDesigns({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const view = VIEWS.includes(sp.view as (typeof VIEWS)[number])
    ? (sp.view as string)
    : "alle";

  const { data } = await getSupabaseAdmin()
    .from("builder_designs")
    .select(
      "id, client_email, title, status, slug, published, published_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(1000);
  const all = (data as Design[]) ?? [];
  const designs =
    view === "online"
      ? all.filter((d) => d.published)
      : view === "verstuurd"
        ? all.filter((d) => d.status === "verstuurd")
        : view === "concept"
          ? all.filter((d) => d.status === "concept")
          : all;

  const stats = [
    { k: "Totaal", v: String(all.length) },
    { k: "Online", v: String(all.filter((d) => d.published).length) },
    {
      k: "Verstuurd",
      v: String(all.filter((d) => d.status === "verstuurd").length),
    },
    {
      k: "Concept",
      v: String(all.filter((d) => d.status === "concept").length),
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Builder-ontwerpen
      </h1>
      <p className="mt-2 text-sm text-muted">
        Alle opgeslagen en gepubliceerde ontwerpen, over alle klanten heen.
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

      <div className="mt-6 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/admin/designs${v === "alle" ? "" : `?view=${v}`}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              view === v
                ? "bg-foreground text-background"
                : "hover:bg-card-hover"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {designs.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Geen ontwerpen in deze weergave.
          </p>
        )}
        {designs.map((d) => {
          const liveUrl = d.slug ? `https://${d.slug}.studio-vm.be` : null;
          return (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.title}</span>
                  {d.published ? (
                    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400">
                      online
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                        d.status === "verstuurd"
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          : "bg-accent/15 text-accent"
                      }`}
                    >
                      {d.status}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-muted">
                  <Link
                    href={`/admin/klanten/${encodeURIComponent(
                      d.client_email,
                    )}`}
                    className="hover:text-foreground"
                  >
                    {d.client_email}
                  </Link>{" "}
                  · bijgewerkt{" "}
                  {new Date(d.updated_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}
                </p>
                {liveUrl && (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                    {liveUrl.replace("https://", "")}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.published && (
                  <form action={adminUnpublishDesign}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                      Offline halen
                    </button>
                  </form>
                )}
                <form action={adminDeleteDesign}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10">
                    Verwijder
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
