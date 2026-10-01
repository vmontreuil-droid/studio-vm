import Link from "next/link";
import {
  CircleAlert,
  CheckCircle2,
  FileText,
  Plus,
  Receipt,
  Inbox,
  HardHat,
  CalendarClock,
  Wallet,
  Clock,
  Headphones,
  ArrowRight,
  Zap,
  Layers,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { Gauge } from "@/components/gauge";
import { ChartCard } from "@/components/charts";
import {
  STAPPEN,
  STATUS_LABEL,
  CATEGORIE_LABEL,
  statusKleur,
  werfTekst,
  type Project,
  type ProjectStatus,
} from "@/lib/projecten";
import { UURTARIEF_CENT, MINIMUM_UREN } from "@/lib/tarieven";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function weekBuckets<T>(rows: T[], at: (r: T) => string) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weeks = Array.from({ length: 12 }, (_, i) => ({
    start: new Date(monday.getTime() - (11 - i) * 7 * DAY),
    count: 0,
  }));
  for (const r of rows) {
    const t = new Date(at(r)).getTime();
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (t >= weeks[i].start.getTime()) {
        weeks[i].count++;
        break;
      }
    }
  }
  return weeks;
}

// Dagen tot de leverdatum (negatief = te laat), op kalenderdagen.
function dagenTot(datum: string | null, vandaag: Date): number | null {
  if (!datum) return null;
  const d = new Date(`${datum}T00:00:00`);
  return Math.round((d.getTime() - vandaag.getTime()) / DAY);
}

function deadlineTekst(n: number | null): string {
  if (n === null) return "geen datum";
  if (n < 0) return `${-n} d te laat`;
  if (n === 0) return "vandaag";
  if (n === 1) return "morgen";
  return `nog ${n} d`;
}

function deadlineKleur(n: number | null): string {
  if (n === null) return "text-muted";
  if (n < 0) return "text-red-500 font-semibold";
  if (n <= 3) return "text-amber-500 font-semibold";
  return "text-muted";
}

const ACTIEF: ProjectStatus[] = ["aanvraag", "offerte", "akkoord", "productie", "geleverd"];

export default async function AdminDashboard() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const db = getSupabaseAdmin();
  const [
    { data: prR },
    { data: offR },
    { data: invR },
    { data: formR },
    { data: purR },
    { data: cnR },
    { data: bankR },
    { data: tkR },
  ] = await Promise.all([
    db
      .from("projecten")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("offers")
      .select("id, client_email, title, amount_cents, status, created_at, valid_until")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("invoices")
      .select("id, client_email, number, amount_cents, status, issued_at")
      .order("issued_at", { ascending: false })
      .limit(500),
    db
      .from("form_submissions")
      .select("id, client_email, visitor_name, visitor_email, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("purchase_invoices")
      .select("net_cents, vat_cents, total_cents, status, invoice_date")
      .limit(2000),
    db
      .from("credit_notes")
      .select("amount_cents, vat_rate, issued_at")
      .limit(2000),
    db
      .from("bank_transactions")
      .select("amount_cents, status, booked_at")
      .limit(2000),
    db
      .from("tickets")
      .select("id, client_email, subject, status, created_at")
      .neq("status", "gesloten")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type Off = {
    id: string;
    client_email: string;
    title: string;
    amount_cents: number | null;
    status: string;
    created_at: string;
    valid_until: string | null;
  };
  type Inv = {
    id: string;
    client_email: string;
    number: string;
    amount_cents: number;
    status: string;
    issued_at: string;
  };
  type Form = {
    id: string;
    client_email: string;
    visitor_name: string;
    visitor_email: string;
    is_read: boolean;
    created_at: string;
  };
  type Ticket = {
    id: string;
    client_email: string;
    subject: string | null;
    status: string;
    created_at: string;
  };
  const projecten = (prR as Project[] | null) ?? [];
  const offers = (offR as Off[] | null) ?? [];
  const invoices = (invR as Inv[] | null) ?? [];
  const forms = (formR as Form[] | null) ?? [];
  const tickets = (tkR as Ticket[] | null) ?? [];

  const eur = (c: number) =>
    `€ ${(c / 100).toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const now = new Date();
  const vandaag = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ymThis = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ---- Projecten ----
  const invById = new Map(invoices.map((i) => [i.id, i]));
  const isBetaald = (p: Project) =>
    p.invoice_id ? invById.get(p.invoice_id)?.status === "betaald" : false;
  const actief = projecten.filter((p) => ACTIEF.includes(p.status));
  const nieuw = projecten.filter((p) => p.status === "aanvraag");
  const lopend = projecten.filter((p) => p.status === "akkoord" || p.status === "productie");
  const metDeadline = actief
    .filter((p) => p.status !== "geleverd" && p.leverdatum)
    .map((p) => ({ p, n: dagenTot(p.leverdatum, vandaag) }))
    .sort((a, b) => (a.n ?? 9999) - (b.n ?? 9999));
  const binnen7 = metDeadline.filter((d) => d.n !== null && d.n <= 7);
  const teFactureren = projecten.filter(
    (p) => (p.status === "geleverd" || p.status === "afgesloten") && !isBetaald(p),
  );
  const tarief = (p: Project) => UURTARIEF_CENT[p.categorie] ?? UURTARIEF_CENT.normaal;
  const urenVan = (p: Project) =>
    Math.max(Number(p.gewerkte_uren ?? p.geschatte_uren ?? 0), MINIMUM_UREN);
  const werkvoorraadUren = lopend.reduce(
    (t, p) => t + Number(p.geschatte_uren ?? 0),
    0,
  );
  const werkvoorraadWaarde = lopend.reduce(
    (t, p) => t + Math.round(Math.max(Number(p.geschatte_uren ?? 0), MINIMUM_UREN) * tarief(p)),
    0,
  );
  const teFacturerenWaarde = teFactureren
    .filter((p) => !p.invoice_id)
    .reduce((t, p) => t + Math.round(urenVan(p) * tarief(p)), 0);

  // Wat er vandaag te doen is, in volgorde van dringendheid.
  type Taak = { kleur: string; tekst: string; sub: string; href: string };
  const taken: Taak[] = [
    ...metDeadline
      .filter((d) => d.n !== null && d.n < 0)
      .map(({ p, n }) => ({
        kleur: "bg-red-500",
        tekst: `Te laat: ${p.titel}`,
        sub: `${deadlineTekst(n)} · ${p.client_email}`,
        href: `/admin/projecten/${p.id}`,
      })),
    ...nieuw.map((p) => ({
      kleur: p.categorie === "last-minute" ? "bg-red-500" : "bg-accent",
      tekst: `Offerte opmaken: ${p.titel}`,
      sub: `${CATEGORIE_LABEL[p.categorie].nl} · ${werfTekst(p.werf) || p.client_email}`,
      href: `/admin/projecten/${p.id}`,
    })),
    ...projecten
      .filter((p) => p.status === "akkoord")
      .map((p) => ({
        kleur: "bg-blue-500",
        tekst: `Starten: ${p.titel}`,
        sub: `akkoord ontvangen · ${deadlineTekst(dagenTot(p.leverdatum, vandaag))}`,
        href: `/admin/projecten/${p.id}`,
      })),
    ...metDeadline
      .filter((d) => d.n !== null && d.n >= 0 && d.n <= 3 && d.p.status !== "akkoord")
      .map(({ p, n }) => ({
        kleur: "bg-amber-500",
        tekst: `Leveren: ${p.titel}`,
        sub: `${deadlineTekst(n)} · ${STATUS_LABEL[p.status].nl}`,
        href: `/admin/projecten/${p.id}`,
      })),
    ...teFactureren
      .filter((p) => !p.invoice_id)
      .map((p) => ({
        kleur: "bg-emerald-500",
        tekst: `Factureren: ${p.titel}`,
        sub: `geleverd · ${urenVan(p)} u × ${eur(tarief(p))}`,
        href: `/admin/projecten/${p.id}`,
      })),
    ...tickets.slice(0, 5).map((t) => ({
      kleur: "bg-violet-500",
      tekst: `Ticket: ${t.subject || "zonder onderwerp"}`,
      sub: `${t.client_email} · ${t.status}`,
      href: "/admin/tickets",
    })),
  ].slice(0, 10);

  // Pijplijn per status.
  const perStatus = STAPPEN.map((s) => ({
    s,
    n: projecten.filter((p) => p.status === s).length,
  }));
  const pijplijnMax = Math.max(1, ...perStatus.map((x) => x.n));

  // Vraag per machinesturing (merk = eerste woord van de keuze).
  const merkTeller = new Map<string, number>();
  for (const p of projecten) {
    const gezien = new Set<string>();
    for (const m of p.merken ?? []) {
      const merk = m.replace(/^Ander:\s*/i, "Ander").split(/[\s—(]/)[0] || m;
      if (gezien.has(merk)) continue;
      gezien.add(merk);
      merkTeller.set(merk, (merkTeller.get(merk) ?? 0) + 1);
    }
  }
  const merken = [...merkTeller.entries()]
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const merkMax = Math.max(1, ...merken.map((m) => m.n));

  const perCategorie = (["vroegtijdig", "normaal", "last-minute"] as const).map((c) => ({
    c,
    n: projecten.filter((p) => p.categorie === c).length,
  }));
  const catTotaal = Math.max(1, perCategorie.reduce((t, x) => t + x.n, 0));
  const catKleur = { vroegtijdig: "bg-emerald-500", normaal: "bg-accent", "last-minute": "bg-red-500" } as const;

  const aanvraagWeeks = weekBuckets(projecten, (r) => r.created_at);

  // ---- Geld ----
  const openInvoiceTotal = invoices
    .filter((i) => i.status === "open")
    .reduce((t, i) => t + i.amount_cents, 0);
  const paidThisMonth = invoices
    .filter((i) => i.status === "betaald" && i.issued_at.startsWith(ymThis))
    .reduce((t, i) => t + i.amount_cents, 0);
  const revMonths = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("nl-BE", { month: "short" }),
      value: Math.round(
        invoices
          .filter((i) => i.status === "betaald" && i.issued_at.startsWith(ym))
          .reduce((t, i) => t + i.amount_cents, 0) / 100,
      ),
    };
  });
  // Verlopen offertes tellen niet meer als "open".
  const vandaagYmd = `${vandaag.getFullYear()}-${String(vandaag.getMonth() + 1).padStart(2, "0")}-${String(vandaag.getDate()).padStart(2, "0")}`;
  const openOfferValue = offers
    .filter((o) => o.status === "open" && (!o.valid_until || o.valid_until >= vandaagYmd))
    .reduce((t, o) => t + (o.amount_cents ?? 0), 0);
  const unreadForms = forms.filter((f) => !f.is_read).length;
  const collectionRate =
    paidThisMonth + openInvoiceTotal > 0
      ? Math.round((paidThisMonth / (paidThisMonth + openInvoiceTotal)) * 100)
      : 0;

  // ---- Boekhouding ----
  type Pur = {
    net_cents: number;
    vat_cents: number;
    total_cents: number;
    status: string;
    invoice_date: string;
  };
  type Cn = { amount_cents: number; vat_rate: number; issued_at: string };
  type Bank = { amount_cents: number; status: string; booked_at: string };
  const purchases = (purR as Pur[] | null) ?? [];
  const creditNotes = (cnR as Cn[] | null) ?? [];
  const bankTx = (bankR as Bank[] | null) ?? [];
  const costThisMonth = purchases
    .filter((p) => (p.invoice_date ?? "").startsWith(ymThis))
    .reduce((t, p) => t + p.total_cents, 0);
  const vatDeductible = purchases.reduce((t, p) => t + p.vat_cents, 0);
  const yr = String(now.getFullYear());
  const vatDue =
    Math.round(
      invoices
        .filter((i) => i.issued_at.startsWith(yr))
        .reduce((t, i) => t + i.amount_cents, 0) * 0.21,
    ) -
    creditNotes
      .filter((c) => (c.issued_at ?? "").startsWith(yr))
      .reduce((t, c) => t + Math.round(c.amount_cents * (c.vat_rate / 100)), 0);
  const vatBalance = vatDue - vatDeductible;
  const bankOpen = bankTx.filter((b) => b.status === "open").length;
  const costMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: Math.round(
        purchases
          .filter((p) => (p.invoice_date ?? "").startsWith(ym))
          .reduce((t, p) => t + p.total_cents, 0) / 100,
      ),
    };
  });

  const kpis = [
    {
      k: "Nieuwe aanvragen",
      v: String(nieuw.length),
      sub: nieuw.length === 1 ? "wacht op een offerte" : "wachten op een offerte",
      href: "/admin/projecten?status=aanvraag",
      icon: Inbox,
      alarm: nieuw.some((p) => p.categorie === "last-minute"),
    },
    {
      k: "In productie",
      v: String(lopend.length),
      sub: `${werkvoorraadUren.toLocaleString("nl-BE")} u werkvoorraad`,
      href: "/admin/projecten?status=productie",
      icon: HardHat,
      alarm: false,
    },
    {
      k: "Deadlines ≤ 7 dagen",
      v: String(binnen7.length),
      sub: binnen7.some((d) => (d.n ?? 0) < 0) ? "waarvan te laat!" : "op schema houden",
      href: "/admin/projecten",
      icon: CalendarClock,
      alarm: binnen7.some((d) => (d.n ?? 0) < 0),
    },
    {
      k: "Te factureren",
      v: String(teFactureren.length),
      sub: teFacturerenWaarde > 0 ? `± ${eur(teFacturerenWaarde)} excl. btw` : "geleverd, nog niet betaald",
      href: "/admin/projecten?status=geleverd",
      icon: Wallet,
      alarm: false,
    },
  ];

  const money = [
    {
      k: "Openstaand",
      v: eur(openInvoiceTotal),
      href: "/admin/facturen?status=open",
      icon: CircleAlert,
      sub: "nog te ontvangen",
    },
    {
      k: "Betaald deze maand",
      v: eur(paidThisMonth),
      href: "/admin/facturen?status=betaald",
      icon: CheckCircle2,
      sub: "ontvangen deze maand",
    },
    {
      k: "Open offertes",
      v: eur(openOfferValue),
      href: "/admin/offertes?status=open",
      icon: FileText,
      sub: "in afwachting van akkoord",
    },
    {
      k: "Werkvoorraad",
      v: eur(werkvoorraadWaarde),
      href: "/admin/projecten?status=productie",
      icon: Clock,
      sub: "aanvaard, nog te leveren",
    },
  ];

  const boekhouding = [
    { k: "Kosten deze maand", v: eur(costThisMonth), href: "/admin/aankoopfacturen", sub: "aankoop incl. btw" },
    {
      k: "Btw-saldo",
      v: eur(vatBalance),
      href: "/admin/rapporten",
      sub: vatBalance >= 0 ? `${yr} — te betalen` : `${yr} — terug`,
    },
    { k: "Open tickets", v: String(tickets.length), href: "/admin/tickets", sub: "vragen en revisies" },
    { k: "Bank af te punten", v: String(bankOpen), href: "/admin/bank", sub: "open transacties" },
  ];

  type Activity = { at: string; label: string; sub: string; href: string };
  const activity: Activity[] = [
    ...projecten.slice(0, 12).map((p) => ({
      at: p.created_at,
      label: `Project · ${p.titel}`,
      sub: `${p.client_email} · ${STATUS_LABEL[p.status].nl.toLowerCase()}`,
      href: `/admin/projecten/${p.id}`,
    })),
    ...offers.slice(0, 12).map((o) => ({
      at: o.created_at,
      label: `Offerte · ${o.title}`,
      sub: `${o.client_email} · ${o.status}`,
      href: `/admin/offertes/${o.id}`,
    })),
    ...invoices.slice(0, 12).map((i) => ({
      at: i.issued_at,
      label: `Factuur ${i.number} · ${eur(i.amount_cents)}`,
      sub: `${i.client_email} · ${i.status}`,
      href: `/admin/facturen/${i.id}`,
    })),
    ...forms.slice(0, 12).map((f) => ({
      at: f.created_at,
      label: `Contactformulier · ${f.visitor_name || f.visitor_email || "bezoeker"}`,
      sub: `${f.visitor_email || f.client_email}${f.is_read ? "" : " · nieuw"}`,
      href: "/admin/formulieren",
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 10);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">
            {now.toLocaleDateString("nl-BE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/projecten/nieuw"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nieuw project
          </Link>
          <Link
            href="/admin/projecten"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            <Layers className="h-4 w-4" strokeWidth={2} />
            Projecten
          </Link>
          <Link
            href="/admin/facturen"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            <Receipt className="h-4 w-4" strokeWidth={2} />
            Facturen
          </Link>
        </div>
      </div>

      {/* Projecten-KPI's */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.k}
              href={s.href}
              className={`rounded-2xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${s.alarm ? "ring-2 ring-red-500/60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full ${s.alarm ? "bg-red-500 text-white" : "bg-accent/10 text-accent"}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight">{s.v}</p>
              <p className={`mt-0.5 text-xs ${s.alarm ? "font-semibold text-red-500" : "text-muted"}`}>{s.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Te doen + deadlines */}
      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <div className="rounded-2xl bg-card p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Te doen</p>
            <span className="font-mono text-[10px] text-muted">{taken.length} actie{taken.length === 1 ? "" : "s"}</span>
          </div>
          {taken.length === 0 ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
              Niets dringends — alles staat op schema.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {taken.map((t, i) => (
                <li key={i}>
                  <Link
                    href={t.href}
                    className="group flex items-center gap-3 py-3 text-sm transition-opacity hover:opacity-80"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.kleur}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.tekst}</span>
                      <span className="block truncate text-xs text-muted">{t.sub}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Leverplanning</p>
            <Link href="/admin/projecten" className="text-xs text-muted hover:text-foreground">
              Alle projecten →
            </Link>
          </div>
          {metDeadline.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Geen lopende projecten met een leverdatum.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {metDeadline.slice(0, 8).map(({ p, n }) => (
                <li key={p.id}>
                  <Link href={`/admin/projecten/${p.id}`} className="flex items-center gap-3 text-sm hover:opacity-80">
                    <span className="w-14 shrink-0 text-center">
                      <span className="block font-mono text-[10px] uppercase text-muted">
                        {new Date(`${p.leverdatum}T00:00:00`).toLocaleDateString("nl-BE", { weekday: "short" })}
                      </span>
                      <span className="block text-lg font-semibold leading-none">
                        {new Date(`${p.leverdatum}T00:00:00`).toLocaleDateString("nl-BE", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate font-medium">
                        {p.categorie === "last-minute" && <Zap className="h-3.5 w-3.5 shrink-0 text-red-500" strokeWidth={2.25} />}
                        <span className="truncate">{p.titel}</span>
                      </span>
                      <span className={`block text-xs ${deadlineKleur(n)}`}>
                        {deadlineTekst(n)} · {STATUS_LABEL[p.status].nl.toLowerCase()}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Pijplijn */}
      <div className="mt-3 rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Pijplijn</p>
          <span className="font-mono text-[10px] text-muted">{actief.length} actief · {projecten.length} totaal</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {perStatus.map(({ s, n }) => (
            <Link
              key={s}
              href={`/admin/projecten?status=${s}`}
              className="rounded-xl border p-4 transition-colors hover:bg-card-hover"
            >
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusKleur(s)}`}>
                {STATUS_LABEL[s].nl}
              </span>
              <p className="mt-3 text-3xl font-semibold">{n}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card-hover">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${(n / pijplijnMax) * 100}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Geld */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">Omzet</h2>
        <Link href="/admin/facturen" className="text-xs text-muted hover:text-foreground">
          Facturen →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {money.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.k}
              href={s.href}
              className="rounded-2xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-3 truncate text-3xl font-bold tracking-tight">{s.v}</p>
              <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-6 shadow-sm lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Betaalde omzet — laatste 6 maanden
          </p>
          <TrendChart id="omzet" color="var(--accent)" height={150} unit=" €" points={revMonths} />
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-6 shadow-sm">
          <p className="mb-2 self-start font-mono text-[10px] uppercase tracking-widest text-muted">Inningsgraad</p>
          <Gauge
            value={collectionRate}
            label="Geïnd deze maand"
            sub={`${eur(paidThisMonth)} van ${eur(paidThisMonth + openInvoiceTotal)}`}
          />
        </div>
      </div>

      {/* Vraag */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">Vraag</h2>
        <Link href="/admin/aanvragen" className="text-xs text-muted hover:text-foreground">
          Aanvragen →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-6 shadow-sm lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Nieuwe projecten per week</p>
          <TrendChart
            id="aanvragen"
            color="var(--accent)"
            points={aanvraagWeeks.map((w) => ({
              label: w.start.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" }),
              value: w.count,
            }))}
          />
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Per categorie</p>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-card-hover">
            {perCategorie.map(({ c, n }) =>
              n > 0 ? <div key={c} className={catKleur[c]} style={{ width: `${(n / catTotaal) * 100}%` }} /> : null,
            )}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {perCategorie.map(({ c, n }) => (
              <li key={c} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${catKleur[c]}`} />
                <span className="flex-1">{CATEGORIE_LABEL[c].nl}</span>
                <span className="font-mono text-xs text-muted">€ {UURTARIEF_CENT[c] / 100}/u</span>
                <span className="w-8 text-right font-semibold">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted">Per machinesturing</p>
          <div className="mt-3 space-y-2.5">
            {merken.length === 0 && <p className="text-sm text-muted">Nog geen projecten.</p>}
            {merken.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span className="truncate">{m.label}</span>
                  <span>{m.n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${(m.n / merkMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Boekhouding */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">Boekhouding & opvolging</h2>
        <Link href="/admin/rapporten" className="text-xs text-muted hover:text-foreground">
          Rapporten →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {boekhouding.map((s) => (
          <Link
            key={s.k}
            href={s.href}
            className="rounded-2xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight">{s.v}</p>
            <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
          </Link>
        ))}
      </div>
      <div className="mt-3">
        <ChartCard
          title="Aankoopkosten — laatste 6 maanden (incl. btw)"
          action={
            <Link href="/admin/aankoopfacturen" className="text-xs text-muted hover:text-foreground">
              Aankoop →
            </Link>
          }
        >
          <TrendChart id="dash-kosten" color="#0ea5e9" height={140} unit=" €" points={costMonths} />
        </ChartCard>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Recente activiteit
          {unreadForms > 0 && (
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
              {unreadForms} nieuw bericht{unreadForms === 1 ? "" : "en"}
            </span>
          )}
        </h2>
        {tickets.length > 0 && (
          <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
            <Headphones className="h-3.5 w-3.5" /> {tickets.length} open ticket{tickets.length === 1 ? "" : "s"}
          </Link>
        )}
      </div>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm">
        {activity.length === 0 && <li className="p-5 text-sm text-muted">Nog geen activiteit.</li>}
        {activity.map((a, i) => (
          <li key={i}>
            <Link
              href={a.href}
              className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm transition-colors hover:bg-card-hover"
            >
              <span className="min-w-0">
                <strong>{a.label}</strong> <span className="text-muted">· {a.sub}</span>
              </span>
              <span className="font-mono text-xs text-muted">{new Date(a.at).toLocaleDateString("nl-BE")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
