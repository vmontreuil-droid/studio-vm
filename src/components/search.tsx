"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search as SearchIcon } from "lucide-react";
// Enkel types: de zoekindex zelf (met alle kennisartikels) zit in de aparte
// chunk van het zoekvenster en komt pas binnen wanneer zoeken geopend wordt.
import type { SearchEntry } from "@/lib/search-index";
import type { Locale } from "@/lib/i18n/config";

const SearchDialog = dynamic(() => import("@/components/search-dialog").then((m) => m.SearchDialog), { ssr: false });

// Vooraf ophalen zodra de knop aangewezen of gefocust wordt: dan opent het venster meteen.
const laadVooraf = () => {
  void import("@/components/search-dialog");
};

export type SearchUi = {
  open: string;
  short: string;
  placeholder: string;
  close: string;
  none: (q: string) => string;
  nav: string;
  esc: string;
  action: string;
  theme: string;
  scan: string;
  offerte: string;
  lang: (name: string) => string;
  kinds: Record<SearchEntry["kind"], string>;
};

const UI: Record<Locale, SearchUi> = {
  nl: {
    open: "Zoeken",
    short: "Zoek",
    placeholder: "Zoek pagina's, realisaties of kennis...",
    close: "Sluiten",
    none: (q) => `Niets gevonden voor "${q}".`,
    nav: "↑↓ navigeren · Enter openen",
    esc: "Esc sluiten",
    action: "Actie",
    theme: "Wissel thema",
    scan: "Realisaties",
    offerte: "Offerte aanvragen",
    lang: (n) => `Schakel naar ${n}`,
    kinds: { Page: "Pagina", Werk: "Realisatie", Journal: "Kennis", Module: "Module" },
  },
  fr: {
    open: "Rechercher",
    short: "Recherche",
    placeholder: "Rechercher des pages, réalisations ou articles...",
    close: "Fermer",
    none: (q) => `Aucun résultat pour « ${q} ».`,
    nav: "↑↓ naviguer · Entrée ouvrir",
    esc: "Échap fermer",
    action: "Action",
    theme: "Basculer le thème",
    scan: "Réalisations",
    offerte: "Demander un devis",
    lang: (n) => `Passer en ${n}`,
    kinds: { Page: "Page", Werk: "Réalisation", Journal: "Savoir", Module: "Module" },
  },
  en: {
    open: "Search",
    short: "Search",
    placeholder: "Search pages, projects or articles...",
    close: "Close",
    none: (q) => `Nothing found for "${q}".`,
    nav: "↑↓ navigate · Enter open",
    esc: "Esc close",
    action: "Action",
    theme: "Toggle theme",
    scan: "Projects",
    offerte: "Request a quote",
    lang: (n) => `Switch to ${n}`,
    kinds: { Page: "Page", Werk: "Project", Journal: "Knowledge", Module: "Module" },
  },
  de: {
    open: "Suchen",
    short: "Suche",
    placeholder: "Seiten, Referenzen oder Artikel durchsuchen...",
    close: "Schließen",
    none: (q) => `Keine Ergebnisse für „${q}“.`,
    nav: "↑↓ navigieren · Enter öffnen",
    esc: "Esc schließen",
    action: "Aktion",
    theme: "Design wechseln",
    scan: "Referenzen",
    offerte: "Angebot anfordern",
    lang: (n) => `Wechseln zu ${n}`,
    kinds: { Page: "Seite", Werk: "Referenz", Journal: "Wissen", Module: "Modul" },
  },
  es: {
    open: "Buscar",
    short: "Buscar",
    placeholder: "Buscar páginas, proyectos o artículos...",
    close: "Cerrar",
    none: (q) => `No se encontraron resultados para «${q}».`,
    nav: "↑↓ navegar · Intro abrir",
    esc: "Esc cerrar",
    action: "Acción",
    theme: "Cambiar tema",
    scan: "Proyectos",
    offerte: "Solicitar presupuesto",
    lang: (n) => `Cambiar a ${n}`,
    kinds: { Page: "Página", Werk: "Proyecto", Journal: "Conocimientos", Module: "Módulo" },
  },
};

export function SearchTrigger({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ui = UI[locale] ?? UI.nl;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={laadVooraf}
        onFocus={laadVooraf}
        aria-label={ui.open}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      >
        <SearchIcon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline xl:hidden 2xl:inline">{ui.short}</span>
        <kbd className="hidden rounded bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline xl:hidden 2xl:inline">
          ⌘K
        </kbd>
      </button>
      {open && <SearchDialog locale={locale} ui={ui} onClose={() => setOpen(false)} />}
    </>
  );
}
