"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Gauge,
  FileText,
  Receipt,
  CreditCard,
  RefreshCcw,
  LifeBuoy,
  UserRound,
  TrendingUp,
  ListChecks,
  FolderOpen,
  CalendarClock,
  Network,
  PenTool,
  Inbox,
  PanelLeft,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { PORTAL_T, type PortalCounts } from "@/lib/portal-shared";
import { ThemeToggle } from "@/components/theme-toggle";

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
    { project: string; admin: string; support: string }
  > = {
    nl: { project: "Project", admin: "Administratie", support: "Support & account" },
    fr: { project: "Projet", admin: "Administration", support: "Aide & compte" },
    en: { project: "Project", admin: "Billing", support: "Support & account" },
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
        { href: `${base}/voortgang`, label: t.progress, icon: TrendingUp },
        { href: `${base}/checklist`, label: t.checklist, icon: ListChecks },
        { href: `${base}/mijn-website`, label: t.mywebsite, icon: Globe },
        {
          href: `${base}/builder`,
          label:
            locale === "fr"
              ? "Mes maquettes"
              : locale === "en"
                ? "My drafts"
                : "Mijn ontwerpen",
          icon: PenTool,
        },
        { href: `${base}/domein`, label: t.domain, icon: Network },
        {
          href: `${base}/berichten`,
          label:
            locale === "fr"
              ? "Messages"
              : locale === "en"
                ? "Messages"
                : "Berichten",
          icon: Inbox,
        },
        { href: `${base}/scans`, label: t.scans, icon: Gauge },
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
        {
          href: `${base}/abonnement`,
          label: t.subscription,
          icon: RefreshCcw,
          badge: counts.sites,
          green: true,
        },
        { href: `${base}/documenten`, label: t.documents, icon: FolderOpen },
      ],
    },
    {
      title: g.support,
      entries: [
        {
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
          href: `/${locale}/voorwaarden`,
          label:
            locale === "fr"
              ? "Conditions"
              : locale === "en"
                ? "Terms"
                : "Voorwaarden",
          icon: ScrollText,
        },
        {
          href: `/${locale}/privacy`,
          label:
            locale === "fr"
              ? "Confidentialité"
              : "Privacy",
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
  const [rail, setRail] = useState(wide);
  useEffect(() => {
    if (wide) {
      setRail(true);
      return;
    }
    try {
      setRail(localStorage.getItem("vm_portal_rail") === "1");
    } catch {
      setRail(false);
    }
  }, [wide]);
  const toggleRail = () =>
    setRail((r) => {
      const n = !r;
      try {
        localStorage.setItem("vm_portal_rail", n ? "1" : "0");
      } catch {
        /* negeren */
      }
      return n;
    });

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
          aria-label="Balk in-/uitklappen"
          title="Balk in-/uitklappen"
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
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${lbl} ${
                          rest.green
                            ? "bg-green-600 text-white"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {n}
                      </span>
                    )}
                    {n > 0 && rail && (
                      <span
                        className={`absolute right-2 hidden h-1.5 w-1.5 rounded-full md:block ${
                          rest.green ? "bg-green-600" : "bg-accent"
                        }`}
                      />
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
          aria-label="Menu"
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
          aria-label="Sluiten"
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
        <div className={wide ? "w-full" : "mx-auto max-w-4xl"}>{children}</div>
      </main>
    </div>
  );
}
