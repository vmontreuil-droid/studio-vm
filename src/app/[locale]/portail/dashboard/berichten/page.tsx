import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

type SubRow = {
  id: string;
  site_title: string;
  page: string;
  visitor_name: string;
  visitor_email: string;
  fields: { label: string; value: string }[];
  created_at: string;
};

const L: Record<
  Locale,
  { title: string; none: string; from: string; reply: string; open: string }
> = {
  nl: {
    title: "Berichten",
    none: "Nog geen inzendingen via je website.",
    from: "Van",
    reply: "Antwoorden",
    open: "Bekijk bericht",
  },
  fr: {
    title: "Messages",
    none: "Aucune soumission via votre site.",
    from: "De",
    reply: "Répondre",
    open: "Voir le message",
  },
  en: {
    title: "Messages",
    none: "No submissions via your website yet.",
    from: "From",
    reply: "Reply",
    open: "View message",
  },
};

export default async function PortalBerichten({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("form_submissions")
    .select(
      "id, site_title, page, visitor_name, visitor_email, fields, created_at",
    )
    .order("created_at", { ascending: false });
  const rows = (data as SubRow[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {l.title}
      </h1>
      <div className="mt-8 space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {rows.map((s) => {
          const head =
            s.visitor_name ||
            s.visitor_email ||
            s.fields[0]?.value ||
            "—";
          return (
            <details
              key={s.id}
              className="group rounded-2xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 list-none">
                <div className="min-w-0">
                  <p className="truncate font-medium">{head}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {dt(s.created_at, locale)}
                    {s.site_title ? ` · ${s.site_title}` : ""}
                    {s.page ? ` · ${s.page}` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors group-hover:bg-card-hover">
                  {l.open}
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    strokeWidth={2}
                  />
                </span>
              </summary>
              <div className="mt-5 border-t pt-5">
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {s.fields.map((f, i) => (
                    <div key={i}>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {f.label || `#${i + 1}`}
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-sm">
                        {f.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
                {s.visitor_email && (
                  <a
                    href={`mailto:${s.visitor_email}`}
                    className="mt-5 inline-flex rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                  >
                    {l.reply} →
                  </a>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
