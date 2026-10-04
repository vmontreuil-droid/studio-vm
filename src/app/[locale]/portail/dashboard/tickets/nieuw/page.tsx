import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import { MAX_ONDERWERP, isKlantSoort, isUuid } from "@/lib/tickets";
import { ticketSchema } from "@/lib/tickets-server";
import { NieuwTicketFormulier, type FormulierProject } from "@/components/tickets/nieuw-ticket-formulier";

export const dynamic = "force-dynamic";

const L: Record<Locale, { titel: string; intro: string; terug: string }> = {
  nl: {
    titel: "Nieuw ticket",
    intro: "Kies waarover het gaat en beschrijf uw vraag zo volledig mogelijk. Het hele gesprek blijft bij dit ticket.",
    terug: "Alle tickets",
  },
  fr: {
    titel: "Nouveau ticket",
    intro: "Choisissez le sujet et décrivez votre demande aussi complètement que possible. Toute la conversation reste dans ce ticket.",
    terug: "Tous les tickets",
  },
  en: {
    titel: "New ticket",
    intro: "Choose what it is about and describe your request as fully as possible. The whole conversation stays in this ticket.",
    terug: "All tickets",
  },
  de: {
    titel: "Neues Ticket",
    intro: "Wählen Sie das Thema und beschreiben Sie Ihr Anliegen bitte so vollständig wie möglich. Der gesamte Verlauf bleibt in diesem Ticket.",
    terug: "Alle Tickets",
  },
  es: {
    titel: "Nuevo ticket",
    intro: "Elija el tema y describa su solicitud de la forma más completa posible. Toda la conversación queda en este ticket.",
    terug: "Todos los tickets",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: { absolute: `${L[locale].titel} · ${PORTAL_T[locale].tickets} — Studio VM` } };
}

const een = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x);

export default async function NieuwTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ project?: string | string[]; soort?: string | string[]; onderwerp?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const sp = await searchParams;
  const l = L[locale];

  const sb = await getSupabaseServer();
  const [projRes, schema] = await Promise.all([
    sb.from("projecten").select("id, titel, status, categorie, merken").order("created_at", { ascending: false }),
    ticketSchema(),
  ]);
  const projecten = ((projRes.data as FormulierProject[] | null) ?? []).map((p) => ({
    ...p,
    merken: Array.isArray(p.merken) ? p.merken : [],
  }));

  const project = een(sp.project);
  const soort = een(sp.soort);
  const onderwerp = (een(sp.onderwerp) ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_ONDERWERP);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={localePath(locale, "/portail/dashboard/tickets")}
        className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        {l.terug}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{l.titel}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{l.intro}</p>
      </header>

      <section className="rounded-2xl border bg-card p-4 sm:p-6">
        <NieuwTicketFormulier
          locale={locale}
          projecten={projecten}
          standaardProjectId={isUuid(project) ? project : undefined}
          standaardSoort={isKlantSoort(soort) ? soort : undefined}
          standaardOnderwerp={onderwerp || undefined}
          bijlagenAan={schema.bijlagen}
          compact
        />
      </section>
    </div>
  );
}
