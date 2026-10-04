import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileUp } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { aanvraagProfiel } from "@/lib/aanvraag-profiel";
import { Offerte3dFormulier } from "@/components/offerte-3d-formulier";

export const dynamic = "force-dynamic";

// Nieuw dossier (3D-model) indienen vanuit het klantenportaal: hetzelfde
// aanvraagformulier als /offerte, maar met de klantgegevens uit het account.
const L: Record<Locale, { titel: string; intro: string; terug: string }> = {
  nl: {
    titel: "Nieuw dossier indienen",
    intro:
      "Stuur de plannen van een nieuwe werf door. Uw gegevens zijn al ingevuld: u vult enkel de werf, uw machinesturing en de plannen in. U ontvangt een offerte op maat en volgt het dossier verder hier in uw portaal.",
    terug: "Alle projecten",
  },
  fr: {
    titel: "Soumettre un nouveau dossier",
    intro:
      "Envoyez les plans d'un nouveau chantier. Vos coordonnées sont déjà remplies : il vous suffit d'indiquer le chantier, votre système de guidage et les plans. Vous recevez un devis sur mesure et suivez ensuite le dossier ici, dans votre espace client.",
    terug: "Tous les projets",
  },
  en: {
    titel: "Submit a new project",
    intro:
      "Send in the plans for a new site. Your details are already filled in: you only need to add the site, your machine control system and the plans. You will receive a tailored quote and can follow the project here in your portal.",
    terug: "All projects",
  },
  de: {
    titel: "Neues Projekt einreichen",
    intro:
      "Senden Sie uns die Pläne einer neuen Baustelle. Ihre Angaben sind bereits ausgefüllt: Sie ergänzen nur die Baustelle, Ihre Maschinensteuerung und die Pläne. Sie erhalten ein individuelles Angebot und verfolgen das Projekt anschließend hier in Ihrem Portal.",
    terug: "Alle Projekte",
  },
  es: {
    titel: "Presentar un nuevo proyecto",
    intro:
      "Envíe los planos de una nueva obra. Sus datos ya están rellenados: solo tiene que indicar la obra, su sistema de control de maquinaria y los planos. Recibirá un presupuesto a medida y podrá seguir el proyecto aquí, en su portal.",
    terug: "Todos los proyectos",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: { absolute: `${L[locale].titel} — Studio VM` } };
}

export default async function NieuwDossierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  // Zonder Supabase of zonder sessie toont de portaal-layout het aanmeldscherm.
  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const profiel = user ? await aanvraagProfiel(user) : null;
  if (!profiel) return null;
  const l = L[locale];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={localePath(locale, "/portail/dashboard/projecten")}
        className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        {l.terug}
      </Link>

      <header>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          <FileUp className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
          {l.titel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{l.intro}</p>
      </header>

      <Offerte3dFormulier locale={locale} portaal={profiel} />
    </div>
  );
}
