"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  Newspaper,
  History,
  Clock,
  Gauge,
  Users,
  Mail,
  MailOpen,
  FileText,
  Receipt,
  Repeat,
  Headphones,
  Palette,
  Globe,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  Search,
  Settings,
  FolderArchive,
  FileMinus,
  Package,
  ReceiptText,
  Truck,
  Landmark,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export type AdminCounts = {
  nieuw: number;
  monitorsActief: number;
  scans: number;
  klanten: number;
  offertesOpen: number;
  facturenOpen: number;
  ticketsOpen: number;
  formNieuw: number;
};

// Billit-stijl: gegroepeerde navigatie i.p.v. één lange lijst, zoals een
// echt boekhoud-/facturatieprogramma. Elke route blijft behouden.
const groups: {
  title: string;
  items: readonly {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    badge?: keyof AdminCounts;
  }[];
}[] = [
  {
    title: "Overzicht",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Verkoop",
    items: [
      { href: "/admin/offertes", label: "Offertes", icon: FileText, badge: "offertesOpen" },
      { href: "/admin/facturen", label: "Facturen", icon: Receipt, badge: "facturenOpen" },
      { href: "/admin/creditnotas", label: "Creditnota's", icon: FileMinus },
      { href: "/admin/abonnementen", label: "Abonnementen", icon: Repeat },
      { href: "/admin/producten", label: "Producten", icon: Package },
      { href: "/admin/klanten", label: "Klanten", icon: Users, badge: "klanten" },
    ],
  },
  {
    title: "Aankoop",
    items: [
      { href: "/admin/aankoopfacturen", label: "Aankoopfacturen", icon: ReceiptText },
      { href: "/admin/leveranciers", label: "Leveranciers", icon: Truck },
    ],
  },
  {
    title: "Bank",
    items: [
      { href: "/admin/bank", label: "Bank", icon: Landmark },
    ],
  },
  {
    title: "Opvolging",
    items: [
      { href: "/admin/aanvragen", label: "Aanvragen", icon: Inbox, badge: "nieuw" },
      { href: "/admin/formulieren", label: "Formulieren", icon: MailOpen, badge: "formNieuw" },
      { href: "/admin/tickets", label: "Tickets", icon: Headphones, badge: "ticketsOpen" },
    ],
  },
  {
    title: "Sites & tools",
    items: [
      { href: "/admin/sites", label: "Sites Studio-vm", icon: Globe },
      { href: "/admin/scans", label: "Scans", icon: Gauge, badge: "scans" },
      { href: "/admin/monitors", label: "Monitors", icon: Activity, badge: "monitorsActief" },
      { href: "/admin/designs", label: "Ontwerpen", icon: Palette },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/journal", label: "Journal", icon: Newspaper },
      { href: "/admin/changelog", label: "Changelog", icon: History },
      { href: "/admin/now", label: "/now", icon: Clock },
      { href: "/admin/newsletter", label: "Nieuwsbrief", icon: Mail },
    ],
  },
  {
    title: "Boekhouding",
    items: [
      { href: "/admin/documenten", label: "Documenten", icon: FolderArchive },
      { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
    ],
  },
];

const flatItems = groups.flatMap((g) => g.items);

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
    <div className="flex h-full flex-col text-slate-300">
      <div
        className={`flex items-center gap-2 px-5 py-5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <p className="text-xl font-extrabold lowercase tracking-tighter text-white">
            vm<span className="text-accent">.</span>
            <span className="ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-widest text-slate-500">
              admin
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Sidebar openklappen" : "Sidebar inklappen"}
          className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, exact, badge }) => {
                const active = exact
                  ? path === href
                  : path.startsWith(href);
                const n = badge ? counts[badge] : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "bg-white/10 font-medium text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active ? "text-accent" : ""
                      }`}
                      strokeWidth={2}
                    />
                    {!collapsed && <span className="flex-1">{label}</span>}
                    {!collapsed && n > 0 && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-medium text-accent">
                        {n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-3">
        {!collapsed && (
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
            Bekijk website
          </a>
        )}
        <div
          className={`flex items-center gap-2 ${
            collapsed ? "flex-col" : ""
          }`}
        >
          <ThemeToggle />
          <form
            action="/api/admin/logout"
            method="post"
            className={collapsed ? "" : "flex-1"}
          >
            <button
              type="submit"
              title={collapsed ? "Uitloggen" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-300 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && "Uitloggen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Snelzoeker over alle admin-secties — zoals de zoekbalk bovenaan Billit.
function AdminSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setOpen(false);
    setQ("");
  }, [path]);

  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return flatItems
      .filter((i) => i.label.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q]);

  return (
    <div className="relative w-full max-w-sm">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={2}
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Zoek in admin…"
        className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
      />
      {open && hits.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          {hits.map((h) => {
            const Icon = h.icon;
            return (
              <Link
                key={h.href}
                href={h.href}
                className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-card-hover"
              >
                <Icon className="h-4 w-4 text-muted" strokeWidth={2} />
                {h.label}
              </Link>
            );
          })}
        </div>
      )}
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
  const path = usePathname();
  // Klantfiche: full-bleed, tab-rail tegen de sidebar (geen centrering).
  const wide =
    path.startsWith("/admin/klanten/") && path !== "/admin/klanten";
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
    <div className="flex min-h-dvh bg-background">
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

      {/* Sidebar — donker navy, zoals een boekhoudprogramma */}
      <aside
        className={`fixed top-0 z-50 h-dvh shrink-0 bg-[#0f172a] transition-[transform,width] duration-200 ease-out md:sticky ${
          collapsed ? "md:w-[68px]" : "md:w-64"
        } w-64 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Sluiten"
          className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:text-white md:hidden"
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

      {/* Werkblad */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bovenbalk met snelzoeker — desktop */}
        <header className="sticky top-0 z-20 hidden items-center gap-4 border-b bg-background/80 px-6 py-3 backdrop-blur md:flex md:px-8">
          <AdminSearch />
          <div className="ml-auto flex items-center gap-3 text-xs text-muted">
            <span className="font-mono uppercase tracking-widest">
              Studio-vm BV
            </span>
          </div>
        </header>

        <main
          className={
            wide
              ? "min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 md:pt-6"
              : "min-w-0 flex-1 px-5 pb-16 pt-20 sm:px-8 md:px-10 md:pt-8"
          }
        >
          {wide ? (
            children
          ) : (
            <div className="mx-auto max-w-6xl">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
