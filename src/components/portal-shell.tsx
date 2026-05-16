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
  LogOut,
  Menu,
  X,
  PanelLeft,
  PanelLeftClose,
  ExternalLink,
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
  const items = [
    { href: base, label: t.overview, icon: LayoutDashboard, exact: true },
    { href: `${base}/mijn-website`, label: t.mywebsite, icon: Globe },
    { href: `${base}/scans`, label: t.scans, icon: Gauge },
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
    {
      href: `${base}/betalingen`,
      label: t.payments,
      icon: CreditCard,
    },
    { href: `${base}/abonnement`, label: t.subscription, icon: RefreshCcw },
    {
      href: `${base}/tickets`,
      label: t.tickets,
      icon: LifeBuoy,
      badge: counts.tickets,
    },
    { href: `${base}/account`, label: t.account, icon: UserRound },
  ];

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const path = usePathname();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("svm-portal-collapsed") === "1");
    } catch {}
  }, []);

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

  const toggleCollapse = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("svm-portal-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });

  const Inner = (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center gap-2 px-5 py-5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <p className="text-xl font-extrabold lowercase tracking-tighter">
            vm<span className="text-accent">.</span>
            <span className="ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-widest text-muted">
              {t.portal}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label="Sidebar"
          className="hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground md:inline-flex"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? path === href : path.startsWith(href);
          const n = "badge" in rest ? (rest.badge ?? 0) : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-card-hover font-medium text-foreground"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && n > 0 && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-medium text-accent">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t p-3">
        {!collapsed && (
          <p className="mb-1 truncate px-3 py-1 font-mono text-[10px] text-muted">
            {email}
          </p>
        )}
        <a
          href={`/${locale}`}
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
          {!collapsed && t.website}
        </a>
        <div
          className={`flex items-center gap-2 ${
            collapsed ? "flex-col" : ""
          }`}
        >
          <ThemeToggle />
          <form action={signOutAction} className={collapsed ? "" : "flex-1"}>
            <button
              type="submit"
              title={collapsed ? t.signout : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && t.signout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
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

      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed top-0 z-50 h-dvh shrink-0 border-r bg-card transition-[transform,width] duration-200 ease-out md:sticky ${
          collapsed ? "md:w-[68px]" : "md:w-64"
        } w-64 ${
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

      <main className="min-w-0 flex-1 px-5 pb-16 pt-20 sm:px-8 md:px-10 md:pt-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
