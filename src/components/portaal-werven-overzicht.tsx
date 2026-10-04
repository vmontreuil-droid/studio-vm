import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Project } from "@/lib/projecten";
import { werfPunten } from "@/lib/werf-punten";
import { WervenKaart } from "@/components/werven-kaart";

// Kaart met alle werven van de aangemelde klant, voor het portaaloverzicht.
// RLS beperkt de projecten tot die van de klant zelf. Zonder één werf met
// coördinaten verschijnt er niets.

/** Projecten → punten voor de werven-kaart (enkel geldige coördinaten). */
export { werfPunten };

const T: Record<Locale, { titel: string; aantal: (n: number) => string; alle: string }> = {
  nl: { titel: "Uw werven", aantal: (n) => `${n} ${n === 1 ? "werf" : "werven"} op de kaart`, alle: "Alle projecten" },
  fr: { titel: "Vos chantiers", aantal: (n) => `${n} chantier${n === 1 ? "" : "s"} sur la carte`, alle: "Tous les projets" },
  en: { titel: "Your sites", aantal: (n) => `${n} site${n === 1 ? "" : "s"} on the map`, alle: "All projects" },
  de: { titel: "Ihre Baustellen", aantal: (n) => `${n} ${n === 1 ? "Baustelle" : "Baustellen"} auf der Karte`, alle: "Alle Projekte" },
  es: { titel: "Sus obras", aantal: (n) => `${n} ${n === 1 ? "obra" : "obras"} en el mapa`, alle: "Todos los proyectos" },
};

export async function PortaalWervenOverzicht({ locale }: { locale: Locale }) {
  const t = T[locale];
  const sb = await getSupabaseServer();
  const { data } = await sb.from("projecten").select("*").order("created_at", { ascending: false });
  const punten = werfPunten((data as Project[] | null) ?? [], locale);
  if (!punten.length) return null;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <MapPinned className="h-5 w-5 text-accent" strokeWidth={1.75} />
            {t.titel}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t.aantal(punten.length)}</p>
        </div>
        <Link
          href={localePath(locale, "/portail/dashboard/projecten")}
          className="group inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          {t.alle}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>
      <WervenKaart punten={punten} taal={locale} />
    </section>
  );
}
