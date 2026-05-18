import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  setFormRead,
  deleteFormSubmission,
} from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  client_email: string;
  site_title: string;
  page: string;
  visitor_name: string;
  visitor_email: string;
  fields: { label: string; value: string }[] | null;
  is_read: boolean;
  created_at: string;
};

const VIEWS = ["nieuw", "alle"] as const;

export default async function AdminFormulieren({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const view = VIEWS.includes(sp.view as (typeof VIEWS)[number])
    ? (sp.view as string)
    : "nieuw";

  const { data } = await getSupabaseAdmin()
    .from("form_submissions")
    .select(
      "id, client_email, site_title, page, visitor_name, visitor_email, fields, is_read, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  const all = (data as Submission[]) ?? [];
  const unread = all.filter((s) => !s.is_read);
  const list = view === "nieuw" ? unread : all;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Formulieren
          </h1>
          <p className="mt-2 text-sm text-muted">
            Inzendingen via gepubliceerde klantsites.
          </p>
        </div>
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={`/admin/formulieren${v === "nieuw" ? "" : `?view=${v}`}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                view === v
                  ? "bg-foreground text-background"
                  : "hover:bg-card-hover"
              }`}
            >
              {v === "nieuw" ? `Nieuw (${unread.length})` : "Alle"}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {list.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            {view === "nieuw"
              ? "Geen ongelezen inzendingen."
              : "Nog geen inzendingen."}
          </p>
        )}
        {list.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl border bg-card p-5 ${
              s.is_read ? "" : "border-accent/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {!s.is_read && (
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
                  )}
                  {s.visitor_name || s.visitor_email || "Anonieme bezoeker"}
                  {s.visitor_email && (
                    <a
                      href={`mailto:${s.visitor_email}`}
                      className="ml-2 font-normal text-accent hover:underline"
                    >
                      {s.visitor_email}
                    </a>
                  )}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  <Link
                    href={`/admin/klanten/${encodeURIComponent(
                      s.client_email,
                    )}`}
                    className="hover:text-foreground"
                  >
                    {s.client_email}
                  </Link>{" "}
                  · {s.site_title || "site"}
                  {s.page ? ` · ${s.page}` : ""} ·{" "}
                  {new Date(s.created_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form
                  action={setFormRead}
                  className="contents"
                >
                  <input type="hidden" name="id" value={s.id} />
                  <input
                    type="hidden"
                    name="read"
                    value={s.is_read ? "0" : "1"}
                  />
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    {s.is_read ? "Markeer ongelezen" : "Markeer gelezen"}
                  </button>
                </form>
                <form action={deleteFormSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10">
                    Verwijder
                  </button>
                </form>
              </div>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 border-t pt-4 sm:grid-cols-2">
              {(s.fields ?? []).map((f, i) => (
                <div key={i} className="min-w-0">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {f.label || "—"}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                    {f.value || "—"}
                  </dd>
                </div>
              ))}
              {(s.fields ?? []).length === 0 && (
                <p className="text-sm text-muted">Lege inzending.</p>
              )}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
