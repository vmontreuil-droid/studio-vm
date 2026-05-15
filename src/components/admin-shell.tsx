"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  Newspaper,
  History,
  Mail,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
} from "lucide-react";

export type AdminCounts = {
  nieuw: number;
  monitorsActief: number;
};

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/aanvragen", label: "Aanvragen", icon: Inbox, badge: "nieuw" },
  {
    href: "/admin/monitors",
    label: "Monitors",
    icon: Activity,
    badge: "monitorsActief",
  },
  { href: "/admin/journal", label: "Journal", icon: Newspaper },
  { href: "/admin/changelog", label: "Changelog", icon: History },
  { href: "/admin/newsletter", label: "Nieuwsbrief", icon: Mail },
] as const;

function Sidebar({
  counts,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  counts: AdminCounts;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
}) {
  const path = usePathname();

  return (
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
              admin
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Sidebar openklappen" : "Sidebar inklappen"}
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
          const badgeKey = "badge" in rest ? rest.badge : undefined;
          const n = badgeKey ? counts[badgeKey as keyof AdminCounts] : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
            Bekijk website
          </a>
        )}
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            title={collapsed ? "Uitloggen" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && "Uitloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  counts,
  children,
}: {
  counts: AdminCounts;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("svm-admin-collapsed") === "1");
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

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("svm-admin-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex min-h-dvh">
      {/* Mobiele topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-lg font-extrabold lowercase tracking-tighter">
          vm<span className="text-accent">.</span>
          <span className="ml-2 align-middle font-mono text-[9px] font-normal uppercase tracking-widest text-muted">
            admin
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

      {/* Sidebar */}
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
        <Sidebar
          counts={counts}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onNavigate={() => setOpen(false)}
        />
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 px-5 pb-16 pt-20 sm:px-8 md:pt-10 md:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
