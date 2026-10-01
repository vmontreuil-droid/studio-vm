import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, MapPin, ArrowRight, FileUp } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { STATUS_LABEL, CATEGORIE_LABEL, werfTekst, statusKleur, type Project } from "@/lib/projecten";
import { dt } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const T: Record<Locale, { titel: string; intro: string; leeg: string; nieuw: string; open: string }> = {
  nl: { titel: "Projecten", intro: "Al uw aanvragen en modellen, met hun status.", leeg: "Nog geen projecten. Stuur uw plannen om te starten.", nieuw: "Nieuwe aanvraag", open: "Openen" },
  fr: { titel: "Projets", intro: "Toutes vos demandes et modèles, avec leur statut.", leeg: "Pas encore de projet. Envoyez vos plans pour commencer.", nieuw: "Nouvelle demande", open: "Ouvrir" },
  en: { titel: "Projects", intro: "All your requests and models, with their status.", leeg: "No projects yet. Send your plans to get started.", nieuw: "New request", open: "Open" },
  de: { titel: "Projekte", intro: "Alle Ihre Anfragen und Modelle mit ihrem Status.", leeg: "Noch keine Projekte. Senden Sie Ihre Pläne, um zu starten.", nieuw: "Neue Anfrage", open: "Öffnen" },
  es: { titel: "Proyectos", intro: "Todas sus solicitudes y modelos, con su estado.", leeg: "Todavía no hay proyectos. Envíe sus planos para empezar.", nieuw: "Nueva solicitud", open: "Abrir" },
};

export default async function ProjectenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const sb = await getSupabaseServer();
  const { data } = await sb.from("projecten").select("*").order("created_at", { ascending: false });
  const projecten = (data as Project[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <Boxes className="h-6 w-6 text-accent" strokeWidth={1.5} />
            {t.titel}
          </h1>
          <p className="mt-1 text-sm text-muted">{t.intro}</p>
        </div>
        <Link href={localePath(locale, "/offerte")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90">
          <FileUp className="h-4 w-4" strokeWidth={2} />
          {t.nieuw}
        </Link>
      </div>

      {projecten.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted">{t.leeg}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projecten.map((p) => (
            <li key={p.id}>
              <Link
                href={localePath(locale, `/portail/dashboard/projecten/${p.id}`)}
                className="group block rounded-2xl border bg-card p-5 transition-colors hover:border-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold tracking-tight">{p.titel}</h2>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusKleur(p.status)}`}>
                    {STATUS_LABEL[p.status][locale]}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="truncate">{werfTekst(p.werf)}</span>
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border px-2 py-0.5">{CATEGORIE_LABEL[p.categorie][locale]}</span>
                  {p.merken.slice(0, 3).map((m) => (
                    <span key={m} className="rounded-full border px-2 py-0.5 text-muted">{m}</span>
                  ))}
                  {p.merken.length > 3 && <span className="text-muted">+{p.merken.length - 3}</span>}
                  <span className="ml-auto font-mono text-muted">{dt(p.created_at, locale)}</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  {t.open}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
