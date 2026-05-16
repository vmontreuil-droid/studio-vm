import { notFound } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T, type DocItem } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<Locale, { none: string; sub: string; open: string }> = {
  nl: {
    none: "Nog geen documenten. Contracten, ontwerpen en bestanden verschijnen hier.",
    sub: "Contracten, ontwerpen, facturen en bestanden — alles op één plek.",
    open: "Openen",
  },
  fr: {
    none: "Aucun document. Contrats, maquettes et fichiers apparaîtront ici.",
    sub: "Contrats, maquettes, factures et fichiers — au même endroit.",
    open: "Ouvrir",
  },
  en: {
    none: "No documents yet. Contracts, designs and files will appear here.",
    sub: "Contracts, designs, invoices and files — all in one place.",
    open: "Open",
  },
};

export default async function PortalDocuments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("documents")
    .select("id, name, url, kind, created_at")
    .order("created_at", { ascending: false });
  const docs = (data as DocItem[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.documents}
      </h1>
      <p className="mt-3 text-sm text-muted">{l.sub}</p>

      <div className="mt-8 space-y-3">
        {docs.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
            {l.none}
          </p>
        )}
        {docs.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <span className="flex min-w-0 items-center gap-3">
              <FileText
                className="h-5 w-5 shrink-0 text-accent"
                strokeWidth={1.75}
              />
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.name}</span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  {d.kind} · {dt(d.created_at, locale)}
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent">
              {l.open}
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
