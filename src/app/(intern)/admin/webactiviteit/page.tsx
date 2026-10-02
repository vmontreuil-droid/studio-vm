import Link from "next/link";
import {
  Activity,
  Eye,
  Users,
  FileUp,
  Inbox,
  FileText,
  CheckCircle2,
  Link2,
  ArrowRight,
  Smartphone,
  Monitor,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

// 2-letter landcode → vlag-emoji. "??" → globe.
function vlag(cc: string): string {
  if (!cc || cc === "??" || cc.length !== 2) return "🌍";
  return String.fromCodePoint(...cc.toUpperCase().split("").map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function relatief(iso: string, nu: number) {
  const s = Math.max(0, Math.round((nu - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${Math.round(s / 3600)} u`;
  return `${Math.round(s / 86400)} d`;
}

// Pad zonder taalvoorvoegsel, zodat /nl/tarieven en /fr/tarieven samen tellen.
function zonderTaal(pad: string): string {
  const p = pad.replace(/^\/(nl|fr|en|de|es)(?=\/|$)/, "");
  return p || "/";
}

const TAAL_KLEUR: Record<string, { label: string; kleur: string }> = {
  nl: { label: "Nederlands", kleur: "var(--accent)" },
  fr: { label: "Français", kleur: "#0ea5e9" },
  en: { label: "English", kleur: "#16a34a" },
  de: { label: "Deutsch", kleur: "#a855f7" },
  es: { label: "Español", kleur: "#eab308" },
};

type Pv = {
  created_at: string;
  path: string;
  locale?: string | null;
  referrer?: string | null;
  country?: string | null;
  ua_family?: string | null;
  visitor_hash?: string | null;
};

export default async function WebActiviteit({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const periode = sp.d === "7" ? 7 : sp.d === "90" ? 90 : 30;

  const db = getSupabaseAdmin();
  const nu = new Date();
  const nuMs = nu.getTime();
  const vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
  const sinds = new Date(nuMs - periode * 86_400_000);
  const vijfMin = new Date(nuMs - 5 * 60_000);

  const [pvR, pvLiveR, pvRecentR, quotesR, offersR] = await Promise.all([
    db
      .from("page_views")
      .select("created_at, path, locale, referrer, country, ua_family, visitor_hash")
      .gte("created_at", sinds.toISOString())
      .order("created_at", { ascending: false })
      .limit(20000),
    db.from("page_views").select("visitor_hash").gte("created_at", vijfMin.toISOString()),
    db
      .from("page_views")
      .select("created_at, path, locale, referrer, country, ua_family")
      .order("created_at", { ascending: false })
      .limit(25),
    db
      .from("quotes")
      .select("id, created_at, name, email, company, source, snapshot")
      .gte("created_at", sinds.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("offers")
      .select("id, created_at, status")
      .gte("created_at", sinds.toISOString())
      .limit(1000),
  ]);

  const pv = (pvR.data as Pv[] | null) ?? [];
  const live = new Set(((pvLiveR.data as { visitor_hash: string }[] | null) ?? []).map((r) => r.visitor_hash)).size;
  const recent = (pvRecentR.data as Pv[] | null) ?? [];
  type Q = { id: string; created_at: string; name: string; email: string; company: string | null; source: string | null; snapshot: { werk?: string; categorie?: string; werf?: { gemeente?: string; land?: string } } | null };
  const quotes = (quotesR.data as Q[] | null) ?? [];
  const aanvragen3d = quotes.filter((q) => q.source === "3d-model");
  const contacten = quotes.filter((q) => q.source === "contact");
  const offers = (offersR.data as { status: string }[] | null) ?? [];

  const vandaagIso = vandaag.toISOString();
  const pvVandaag = pv.filter((r) => r.created_at >= vandaagIso);
  const uniek = (rows: Pv[]) => new Set(rows.map((r) => r.visitor_hash).filter(Boolean)).size;
  const bezoekersVandaag = uniek(pvVandaag);
  const bezoekersPeriode = uniek(pv);
  const paginasPerBezoek = bezoekersPeriode ? (pv.length / bezoekersPeriode).toFixed(1) : "0";

  // Trechter: bezoekers → offerteformulier gezien → aanvraag → offerte → akkoord.
  const offerteBezoekers = uniek(pv.filter((r) => /\/offerte(\/|$)/.test(r.path)));
  const trechter = [
    { k: "Bezoekers", v: bezoekersPeriode, icon: Users },
    { k: "Offerteformulier bekeken", v: offerteBezoekers, icon: FileUp },
    { k: "3D-aanvragen", v: aanvragen3d.length, icon: Inbox },
    { k: "Offertes verstuurd", v: offers.length, icon: FileText },
    { k: "Akkoord", v: offers.filter((o) => o.status === "akkoord").length, icon: CheckCircle2 },
  ];
  const trechterMax = Math.max(1, trechter[0].v);
  const conversie = bezoekersPeriode ? ((aanvragen3d.length / bezoekersPeriode) * 100).toFixed(1) : "0";

  // Per dag (periode).
  const perDag = Array.from({ length: periode }, (_, k) => {
    const d = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - (periode - 1 - k));
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rijen = pv.filter((r) => {
      const t = new Date(r.created_at);
      const y = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      return y === ymd;
    });
    return {
      // Bij veel dagen enkel elke n-de datum tonen, anders lopen ze in elkaar.
      label:
        k % Math.ceil(periode / 10) === 0 || k === periode - 1
          ? d.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" })
          : "",
      value: uniek(rijen),
    };
  });

  // Per uur (laatste 24 u).
  const perUur = Array.from({ length: 24 }, (_, k) => {
    const start = new Date(nuMs - (23 - k) * 3_600_000);
    start.setMinutes(0, 0, 0);
    const s = start.getTime();
    return {
      label: k % 3 === 0 || k === 23 ? `${String(start.getHours()).padStart(2, "0")}u` : "",
      value: pv.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= s && t < s + 3_600_000;
      }).length,
    };
  });

  const teller = (sleutel: (r: Pv) => string | null, max = 10) => {
    const m = new Map<string, number>();
    for (const r of pv) {
      const k = sleutel(r);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([label, value]) => ({ label, value }));
  };
  const topPaginas = teller((r) => zonderTaal(r.path), 12);
  const topVerwijzers = teller((r) => {
    if (!r.referrer) return "(direct)";
    try {
      const h = new URL(r.referrer).hostname.replace(/^www\./, "");
      return h.includes("studio-vm") ? null : h || "(direct)";
    } catch {
      return "(onbekend)";
    }
  }, 8);
  const topLanden = teller((r) => (r.country ?? "??").toUpperCase(), 8).map((x) => ({
    label: `${vlag(x.label)} ${x.label}`,
    value: x.value,
  }));
  const talen = Object.entries(TAAL_KLEUR)
    .map(([k, t]) => ({ label: t.label, color: t.kleur, value: pv.filter((r) => (r.locale ?? "") === k).length }))
    .filter((s) => s.value > 0);
  const mobiel = pv.filter((r) => r.ua_family === "mobile").length;
  const mobielPct = pv.length ? Math.round((mobiel / pv.length) * 100) : 0;

  const tegels = [
    { k: "Nu op de site", v: String(live), sub: "laatste 5 minuten", icon: Activity, live: true },
    { k: "Bezoekers vandaag", v: String(bezoekersVandaag), sub: `${pvVandaag.length} paginaweergaven`, icon: Eye },
    { k: `Bezoekers ${periode} d`, v: String(bezoekersPeriode), sub: `${paginasPerBezoek} pagina's per bezoeker`, icon: Users },
    { k: `3D-aanvragen ${periode} d`, v: String(aanvragen3d.length), sub: `${conversie} % van de bezoekers`, icon: Inbox },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webactiviteit</h1>
          <p className="mt-0.5 text-sm text-muted">
            Bezoek op studio-vm.be en hoeveel daarvan een 3D-model aanvraagt. Cookieloos, zonder IP-opslag.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border p-1 text-xs">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/webactiviteit?d=${d}`}
              className={`rounded-full px-3 py-1 transition-colors ${periode === d ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
            >
              {d} dagen
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tegels.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.k} className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{t.k}</p>
                <span className="relative grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  {t.live && Number(t.v) > 0 && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  )}
                </span>
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight">{t.v}</p>
              <p className="mt-0.5 text-xs text-muted">{t.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Trechter */}
      <div className="mt-3 rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Van bezoek tot opdracht — {periode} dagen</p>
          <span className="font-mono text-[10px] text-muted">conversie bezoek → aanvraag: {conversie} %</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {trechter.map((s, i) => {
            const Icon = s.icon;
            const vorige = i > 0 ? trechter[i - 1].v : null;
            const pct = vorige ? Math.round((s.v / vorige) * 100) : null;
            return (
              <div key={s.k} className="relative rounded-xl border p-4">
                <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
                <p className="mt-3 text-3xl font-semibold">{s.v}</p>
                <p className="mt-0.5 text-xs text-muted">{s.k}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-hover">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.max(2, (s.v / trechterMax) * 100)}%` }} />
                </div>
                {pct !== null && <p className="mt-1.5 font-mono text-[10px] text-muted">{pct} % van vorige stap</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title={`Unieke bezoekers per dag — ${periode} dagen`}>
            <TrendChart id="wa-dag" color="var(--accent)" height={150} points={perDag} />
          </ChartCard>
        </div>
        <ChartCard title="Paginaweergaven per uur — 24 u">
          <TrendChart id="wa-uur" color="#0ea5e9" height={150} points={perUur} />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Meest bekeken pagina's (alle talen samen)">
            {topPaginas.length ? <BarList items={topPaginas} color="var(--accent)" /> : <p className="text-sm text-muted">Nog geen bezoek.</p>}
          </ChartCard>
        </div>
        <ChartCard title="Talen">
          {talen.length ? (
            <Donut segments={talen} centerTop={String(pv.length)} centerSub="weergaven" />
          ) : (
            <p className="text-sm text-muted">Nog geen bezoek.</p>
          )}
          <p className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> {100 - mobielPct} %</span>
            <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> {mobielPct} %</span>
          </p>
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Verwijzers">
          {topVerwijzers.length ? <BarList items={topVerwijzers} color="#a855f7" /> : <p className="text-sm text-muted">Nog geen bezoek.</p>}
        </ChartCard>
        <ChartCard title="Landen">
          {topLanden.length ? <BarList items={topLanden} color="#16a34a" /> : <p className="text-sm text-muted">Nog geen bezoek.</p>}
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Recente aanvragen</p>
            <Link href="/admin/aanvragen" className="text-xs text-muted hover:text-foreground">
              Alle aanvragen →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {[...aanvragen3d, ...contacten]
              .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
              .slice(0, 8)
              .map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/aanvragen/${q.id}`} className="group flex items-center gap-3 py-3 text-sm hover:opacity-80">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${q.source === "3d-model" ? "bg-accent/15 text-accent" : "bg-emerald-500/15 text-emerald-600"}`}>
                      {q.source === "3d-model" ? "3D" : "contact"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{q.company || q.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {q.snapshot?.werk ? `${q.snapshot.werk} · ` : ""}
                        {q.snapshot?.werf?.gemeente ?? q.email}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-muted">{relatief(q.created_at, nuMs)}</span>
                    <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            {aanvragen3d.length + contacten.length === 0 && (
              <li className="py-4 text-sm text-muted">Geen aanvragen in deze periode.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Eye className="h-3.5 w-3.5" /> Live paginaweergaven
          </p>
          <ul className="mt-4 divide-y divide-border">
            {recent.length === 0 && <li className="py-4 text-sm text-muted">Nog geen bezoek.</li>}
            {recent.slice(0, 12).map((r, i) => {
              let bron = "direct";
              if (r.referrer) {
                try {
                  bron = new URL(r.referrer).hostname.replace(/^www\./, "");
                } catch {
                  bron = "onbekend";
                }
              }
              return (
                <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{r.path}</span>
                    <span className="block truncate font-mono text-[10px] text-muted">
                      {vlag((r.country ?? "??").toUpperCase())} {(r.locale ?? "").toUpperCase()} · {r.ua_family ?? "?"} · via {bron}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-muted">{relatief(r.created_at, nuMs)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
