"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  FileText,
  Receipt,
  CreditCard,
  LifeBuoy,
  UserRound,
  FolderOpen,
  CalendarClock,
  PanelLeft,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { PORTAL_T, nieuweAntwoorden, type PortalCounts } from "@/lib/portal-shared";
import { ThemeToggle } from "@/components/theme-toggle";

// Onthouden voorkeur voor de ingeklapte zijbalk (desktop).
const RAIL_SLEUTEL = "vm_portal_rail";
const RAIL_GEBEURTENIS = "vm-portal-rail";
// Zonder localStorage (geblokkeerd, privévenster) onthoudt dit de keuze
// voor de rest van het bezoek.
let railGeheugen = false;
function leesRail(): boolean {
  try {
    return localStorage.getItem(RAIL_SLEUTEL) === "1";
  } catch {
    return railGeheugen;
  }
}
function zetRail(n: boolean) {
  railGeheugen = n;
  try {
    localStorage.setItem(RAIL_SLEUTEL, n ? "1" : "0");
  } catch {
    /* negeren */
  }
  window.dispatchEvent(new Event(RAIL_GEBEURTENIS));
}
function volgRail(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(RAIL_GEBEURTENIS, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(RAIL_GEBEURTENIS, cb);
  };
}

export function PortalShell({
  locale,
  email,
  counts,
  signOutAction,
  children,
}: {
  locale: Locale;
  email: string;
  counts: PortalCounts;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const t = PORTAL_T[locale];
  const base = `/${locale}/portail/dashboard`;
  const G: Record<
    Locale,
    {
      project: string;
      admin: string;
      support: string;
      toggle: string;
      close: string;
      menu: string;
    }
  > = {
    nl: { project: "3D-modellen", admin: "Administratie", support: "Support & account", toggle: "Zijbalk in- of uitklappen", close: "Sluiten", menu: "Menu" },
    fr: { project: "Modèles 3D", admin: "Administration", support: "Aide & compte", toggle: "Réduire ou déplier la barre latérale", close: "Fermer", menu: "Menu" },
    en: { project: "3D models", admin: "Billing", support: "Support & account", toggle: "Collapse or expand sidebar", close: "Close", menu: "Menu" },
    de: { project: "3D-Modelle", admin: "Verwaltung", support: "Support & Konto", toggle: "Seitenleiste ein- oder ausklappen", close: "Schließen", menu: "Menü" },
    es: { project: "Modelos 3D", admin: "Administración", support: "Soporte y cuenta", toggle: "Contraer o expandir la barra lateral", close: "Cerrar", menu: "Menú" },
  };
  const g = G[locale];
  const groups: {
    title: string | null;
    entries: {
      href: string;
      label: string;
      icon: typeof LayoutDashboard;
      exact?: boolean;
      badge?: number;
      green?: boolean;
      /** Tekst voor schermlezers bij de teller (bv. "1 nieuw antwoord"). */
      srBadge?: string;
    }[];
  }[] = [
    {
      title: null,
      entries: [
        { href: base, label: t.overview, icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: g.project,
      entries: [
        {
          href: `${base}/projecten`,
          label: { nl: "Projecten", fr: "Projets", en: "Projects", de: "Projekte", es: "Proyectos" }[locale],
          icon: Boxes,
          badge: counts.projecten,
        },
      ],
    },
    {
      title: g.admin,
      entries: [
        {
          href: `${base}/offertes`,
          label: t.offers,
          icon: FileText,
          badge: counts.offers,
        },
        {
          href: `${base}/facturen`,
          label: t.invoices,
          icon: Receipt,
          badge: counts.invoices,
        },
        { href: `${base}/betalingen`, label: t.payments, icon: CreditCard },
        { href: `${base}/documenten`, label: t.documents, icon: FolderOpen },
      ],
    },
    {
      title: g.support,
      entries: [
        // Nieuw antwoord van de studio → groene teller met het aantal
        // ongelezen tickets; anders de gewone teller met de open tickets.
        (counts.ticketsOngelezen ?? 0) > 0
          ? {
              href: `${base}/tickets`,
              label: t.tickets,
              icon: LifeBuoy,
              badge: counts.ticketsOngelezen,
              green: true,
              srBadge: nieuweAntwoorden(counts.ticketsOngelezen ?? 0, locale),
            }
          : {
              href: `${base}/tickets`,
              label: t.tickets,
              icon: LifeBuoy,
              badge: counts.tickets,
            },
        {
          href: `${base}/afspraak`,
          label: t.appointment,
          icon: CalendarClock,
        },
        { href: `${base}/account`, label: t.account, icon: UserRound },
        {
          href: `/${locale}/portail/dashboard/voorwaarden`,
          label: {
            nl: "Voorwaarden",
            fr: "Conditions",
            en: "Terms",
            de: "AGB",
            es: "Condiciones",
          }[locale],
          icon: ScrollText,
        },
        {
          href: `/${locale}/portail/dashboard/privacy`,
          label: {
            nl: "Privacy",
            fr: "Confidentialité",
            en: "Privacy",
            de: "Datenschutz",
            es: "Privacidad",
          }[locale],
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const [open, setOpen] = useState(false);
  const path = usePathname();
  // De visuele builder heeft de volle breedte nodig (klant moet
  // overzicht hebben); de sidebar blijft uiteraard staan.
  const wide = path.includes("/builder/editor");

  // Inklapbare admin-balk (desktop): enkel icoontjes. PortalShell zit
  // in de layout en blijft staan bij client-navigatie, dus we reageren
  // op het pad: in de builder-editor ALTIJD ingeklapt (max scherm om te
  // bouwen); daarbuiten de onthouden voorkeur (standaard uitgeklapt).
  // De voorkeur komt via useSyncExternalStore uit localStorage (server en
  // hydratie: uitgeklapt), zonder setState in een effect.
  const opgeslagen = useSyncExternalStore(volgRail, leesRail, () => false);
  // In de builder mag de knop de balk tijdelijk openklappen; bij elke
  // nieuwe intrede in de builder klapt hij weer in.
  const [builderOpen, setBuilderOpen] = useState(false);
  const [vorigWide, setVorigWide] = useState(wide);
  if (vorigWide !== wide) {
    setVorigWide(wide);
    setBuilderOpen(false);
  }
  const rail = wide ? !builderOpen : opgeslagen;
  const toggleRail = () => {
    const n = !rail;
    zetRail(n);
    if (wide) setBuilderOpen(!n);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // `lbl` = klasse die labels/teksten op desktop verbergt wanneer de
  // balk ingeklapt is (mobiele drawer toont altijd alles).
  const lbl = rail ? "md:hidden" : "";
  const rowJustify = rail ? "md:justify-center" : "";

  const Inner = (
    <div className="flex h-full flex-col">
      <div
        className={`flex px-5 py-6 ${
          rail
            ? "md:flex-col md:items-center md:gap-3 md:px-2 md:pb-4 md:pt-5"
            : "items-center gap-2"
        }`}
      >
        <p
          className={`font-extrabold lowercase leading-none tracking-tighter ${
            rail ? "text-3xl md:text-2xl" : "text-3xl"
          }`}
        >
          vm<span className="text-accent">.</span>
          <span
            className={`ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-widest text-muted ${lbl}`}
          >
            {t.portal}
          </span>
        </p>
        <button
          type="button"
          onClick={toggleRail}
          aria-label={g.toggle}
          title={g.toggle}
          className={`hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground md:block ${
            rail ? "md:mt-1" : "ml-auto"
          }`}
        >
          <PanelLeft className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {group.title && (
              <p
                className={`px-3 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-widest text-muted/70 ${lbl}`}
              >
                {group.title}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.entries.map(({ href, label, icon: Icon, ...rest }) => {
                const active = rest.exact
                  ? path === href
                  : path.startsWith(href);
                const n = rest.badge ?? 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    title={label}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${rowJustify} ${
                      active
                        ? "bg-card-hover font-medium text-foreground"
                        : "text-muted hover:bg-card-hover hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={2}
                    />
                    <span className={`flex-1 ${lbl}`}>{label}</span>
                    {n > 0 && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${lbl} ${
                          rest.green
                            ? "bg-emerald-500 font-semibold text-emerald-950"
                            : "bg-accent/15 font-medium text-accent"
                        }`}
                      >
                        {rest.srBadge ? (
                          <>
                            <span aria-hidden>{n}</span>
                            <span className="sr-only">{rest.srBadge}</span>
                          </>
                        ) : (
                          n
                        )}
                      </span>
                    )}
                    {n > 0 && rail && (
                      <span
                        className={`absolute right-2 hidden h-1.5 w-1.5 rounded-full md:block ${
                          rest.green ? "bg-emerald-500" : "bg-accent"
                        }`}
                      >
                        {/* Ingeklapte balk: label en teller zijn verborgen, dus hier voor schermlezers. */}
                        {rest.srBadge && (
                          <span className="sr-only">{`${label} · ${rest.srBadge}`}</span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t p-3">
        <p
          className={`mb-1 truncate px-3 py-1 font-mono text-[10px] text-muted ${lbl}`}
        >
          {email}
        </p>
        <a
          href={`/${locale}`}
          title={t.website}
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground ${rowJustify}`}
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className={lbl}>{t.website}</span>
        </a>
        <div
          className={`flex items-center gap-2 ${
            rail ? "md:flex-col md:gap-1" : ""
          }`}
        >
          <ThemeToggle />
          <form action={signOutAction} className="flex-1">
            <button
              type="submit"
              title={t.signout}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${rowJustify}`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className={lbl}>{t.signout}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Mobiele topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-lg font-extrabold lowercase tracking-tighter">
          vm<span className="text-accent">.</span>
          <span className="ml-2 align-middle font-mono text-[9px] font-normal uppercase tracking-widest text-muted">
            {t.portal}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={g.menu}
          className="rounded-lg border p-2 text-foreground"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Mobiele backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar — altijd volledig zichtbaar op desktop */}
      <aside
        className={`fixed top-0 z-50 h-dvh w-64 shrink-0 border-r bg-card transition-all duration-200 ease-out md:sticky ${
          rail ? "md:w-16" : "md:w-64"
        } ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={g.close}
          className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-muted hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        {Inner}
      </aside>

      <main
        className={
          wide
            ? "min-w-0 flex-1 pb-16 pt-16 md:pt-0"
            : "min-w-0 flex-1 px-5 pb-16 pt-20 sm:px-8 md:px-10 md:pt-10"
        }
      >
        <div className={wide ? "w-full" : "mx-auto w-full max-w-7xl"}>{children}</div>
      </main>
    </div>
  );
}
