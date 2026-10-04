import Link from "next/link";
import {
  Mail,
  Eye,
  Reply,
  XCircle,
  CheckCircle2,
  Radar,
  Pause,
  Play,
  HardHat,
  Target,
  Save,
  RotateCcw,
  FileText,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getOutreachConfig, warmUpQuota } from "@/lib/admin/outreach";
import {
  restartOutreachWarmup,
  saveOutreachTargeting,
  setOutreachStatus,
  toggleOutreachPaused,
} from "@/app/actions/outreach";
import { SOURCES, sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import {
  GRADE_LABEL,
  NACE_OPTIES,
  effectiveNace,
  isAannemerGrade,
  naceLabel,
  naceMetPunt,
  naceOrFilter,
  type AannemerGrade,
} from "@/lib/admin/aannemers";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type Row = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_grade: string | null;
  scan_issues: string[] | null;
  mail_to: string | null;
  mail_sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  nieuw: "bg-card-hover text-muted",
  gescand: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  verzonden: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  opgevolgd: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  geopend: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  beantwoord: "bg-green-500/10 text-green-700 dark:text-green-400",
  klant: "bg-emerald-600 text-white",
  geen_interesse: "bg-card-hover text-muted",
};

const STATUS_LABEL: Record<string, string> = {
  nieuw: "overgeslagen",
  gescand: "klaar",
  geen_interesse: "geen interesse",
};

const GRADE_BADGE: Record<AannemerGrade, string> = {
  "3D:MC": "bg-emerald-600 text-white",
  "3D:GW": "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "3D:AL": "bg-card-hover text-muted",
  "3D:NS": "bg-card-hover text-muted",
};

const GRADES: AannemerGrade[] = ["3D:MC", "3D:GW", "3D:AL", "3D:NS"];

// Rijen uit de vroegere website-campagne (grade A–F of leeg).
const OUD_FILTER = 'scan_grade.is.null,scan_grade.not.like."3D:*"';

// Buiten de component: tijdsafhankelijke waarden.
function dagenGeleden(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}
function laatste14Dagen(): { ymd: string; label: string }[] {
  return Array.from({ length: 14 }, (_, k) => {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - (13 - k));
    return {
      ymd: dt.toISOString().slice(0, 10),
      label: dt.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" }),
    };
  });
}

export default async function AdminOutreach({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; grade?: string; campagne?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = sp.status ?? "";
  const grade = GRADES.find((g) => g === sp.grade) ?? "";
  const oud = sp.campagne === "oud";

  const cfg = await getOutreachConfig();
  const db = getSupabaseAdmin();
  const nace = effectiveNace(cfg.nacePrefixes);
  const naceIsStandaard = cfg.nacePrefixes.length === 0;
  const vandaagMax = warmUpQuota(cfg.dailyQuota, cfg.startedAt);

  // KPI's — enkel de aannemers-campagne (scan_grade "3D:…").
  const head = { count: "exact" as const, head: true };
  const po = () => db.from("prospect_outreach").select("prospect_id", head).like("scan_grade", "3D:%");
  const [tot, klaar, snt, opn, rpl, klt, ngi, overg, oudTot, ...perGrade] = await Promise.all([
    po(),
    po().eq("status", "gescand"),
    po().not("mail_sent_at", "is", null),
    po().not("opened_at", "is", null),
    po().not("replied_at", "is", null),
    po().eq("status", "klant"),
    po().eq("status", "geen_interesse"),
    po().eq("status", "nieuw"),
    db.from("prospect_outreach").select("prospect_id", head).or(OUD_FILTER),
    ...GRADES.map((g) => po().eq("scan_grade", g).eq("status", "gescand")),
  ]);
  const gradeTel = Object.fromEntries(
    GRADES.map((g, i) => [g, perGrade[i]?.count ?? 0]),
  ) as Record<AannemerGrade, number>;

  const kpi = [
    { k: "Klaar om te mailen", v: klaar.count ?? 0, icon: Radar },
    { k: "Met machinesturing", v: gradeTel["3D:MC"], icon: HardHat },
    { k: "Verzonden", v: snt.count ?? 0, icon: Mail },
    { k: "Geopend / geklikt", v: opn.count ?? 0, icon: Eye },
    { k: "Beantwoord", v: rpl.count ?? 0, icon: Reply },
    { k: "Klant geworden", v: klt.count ?? 0, icon: CheckCircle2 },
    { k: "Geen interesse", v: ngi.count ?? 0, icon: XCircle },
  ];

  const funnel = [
    { label: "Gekwalificeerd", value: Math.max(0, (tot.count ?? 0) - (overg.count ?? 0)) },
    { label: "Verzonden", value: snt.count ?? 0 },
    { label: "Geopend / geklikt", value: opn.count ?? 0 },
    { label: "Beantwoord", value: rpl.count ?? 0 },
    { label: "Klant", value: klt.count ?? 0 },
  ];

  const gradeSegs = [
    { label: GRADE_LABEL["3D:MC"], value: gradeTel["3D:MC"], color: "#059669" },
    { label: GRADE_LABEL["3D:GW"], value: gradeTel["3D:GW"], color: "#0ea5e9" },
    { label: GRADE_LABEL["3D:AL"], value: gradeTel["3D:AL"], color: "#a8a29e" },
    { label: GRADE_LABEL["3D:NS"], value: gradeTel["3D:NS"], color: "#64748b" },
  ];

  // Mails per dag — laatste 14 dagen (alle campagnes).
  const { data: sentRows } = await db
    .from("prospect_outreach")
    .select("mail_sent_at")
    .not("mail_sent_at", "is", null)
    .gte("mail_sent_at", dagenGeleden(14).toISOString())
    .limit(2000);
  const mailsByDay = laatste14Dagen().map((d) => ({
    label: d.label,
    value: ((sentRows as { mail_sent_at: string }[] | null) ?? []).filter((r) =>
      r.mail_sent_at.startsWith(d.ymd),
    ).length,
  }));
  const sent_n = snt.count ?? 0;
  const openRate = sent_n > 0 ? Math.round(((opn.count ?? 0) / sent_n) * 100) : 0;

  // Omvang van de doelgroep per land (actief + met website).
  const doelgroep = await Promise.all(
    cfg.lands.map(async (land) => {
      const src = sourceFromLand(land);
      const f = naceOrFilter(src.codeCol, nace, land);
      const [alle, metSite] = await Promise.all([
        db.from(src.table).select(src.idCol, head).eq(src.statusCol, src.activeValue).or(f),
        db
          .from(src.table)
          .select(src.idCol, head)
          .eq(src.statusCol, src.activeValue)
          .not("website", "is", null)
          .or(f),
      ]);
      return { land, alle: alle.count ?? 0, metSite: metSite.count ?? 0 };
    }),
  );

  // Lijst
  let q = db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_score, scan_grade, scan_issues, mail_to, mail_sent_at, opened_at, replied_at, status, notes, created_at",
    )
    .limit(100);
  q = oud ? q.or(OUD_FILTER) : q.like("scan_grade", "3D:%");
  if (status) q = q.eq("status", status);
  if (grade && !oud) q = q.eq("scan_grade", grade);
  q =
    status === "gescand" || grade
      ? q.order("scan_score", { ascending: false })
      : q.order("updated_at", { ascending: false });
  const { data } = await q;
  const rows = (data as Row[] | null) ?? [];

  // Namen uit de bron-tabellen.
  const namen = new Map<string, string>();
  for (const land of ["be", "fr", "uk", "nl", "de"] as Land[]) {
    const ids = rows.filter((r) => r.land === land).map((r) => r.prospect_id);
    if (ids.length === 0) continue;
    const src = sourceFromLand(land);
    const { data: nm } = await db
      .from(src.table)
      .select(`${src.idCol}, name`)
      .in(src.idCol, ids);
    for (const n of (nm as unknown as Record<string, string | null>[] | null) ?? []) {
      const id = n[src.idCol];
      if (id && n.name) namen.set(`${land}:${id}`, n.name);
    }
  }

  const d = (s: string | null) =>
    s
      ? new Date(s).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })
      : "—";

  const mkFilter = (p: { status?: string; grade?: string; campagne?: string }) => {
    const u = new URLSearchParams();
    if (p.status) u.set("status", p.status);
    if (p.grade) u.set("grade", p.grade);
    if (p.campagne) u.set("campagne", p.campagne);
    const s = u.toString();
    return s ? `/admin/outreach?${s}` : "/admin/outreach";
  };

  const extraNace = cfg.nacePrefixes.filter(
    (p) => !NACE_OPTIES.some((o) => o.code === p),
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Outreach — aannemers
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            3D-modellen voor machinesturing · grond-, weg- en waterbouw ·
            homepage-signalen bepalen wie eerst gemaild wordt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/mail-preview"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            Mails nalezen
          </Link>
          <Link
            href="/admin/instellingen"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Configuratie
          </Link>
        </div>
      </div>

      {/* Pauze-status — bewust groot en solide */}
      <div
        className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 ${
          cfg.paused ? "bg-amber-400 text-amber-950" : "bg-green-500 text-green-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/10">
            {cfg.paused ? (
              <Pause className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Play className="h-5 w-5" strokeWidth={2.5} />
            )}
          </span>
          <div>
            <p className="text-lg font-bold uppercase tracking-wide">
              {cfg.paused ? "Gepauzeerd" : "Actief"}
            </p>
            <p className="text-sm font-medium">
              {cfg.paused
                ? "Er vertrekt geen enkele mail en er wordt niets gekwalificeerd. Kijk eerst de mails na; start pas daarna."
                : `Quota ${cfg.dailyQuota} mails/dag · vandaag max ${vandaagMax} (warm-up) · hoogste prioriteit eerst.`}
            </p>
          </div>
        </div>
        <form action={toggleOutreachPaused}>
          <button
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${
              cfg.paused ? "bg-amber-950 text-amber-50" : "bg-green-950 text-green-50"
            }`}
          >
            {cfg.paused ? (
              <>
                <Play className="h-4 w-4" strokeWidth={2.5} />
                Start engine
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" strokeWidth={2.5} />
                Pauzeer engine
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {kpi.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {s.k}
                </p>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {s.v.toLocaleString("nl-BE")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Doelgroep */}
      <form
        action={saveOutreachTargeting}
        className="mt-3 rounded-2xl bg-card p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-accent">
              <Target className="h-3.5 w-3.5" strokeWidth={2.5} />
              Doelgroep (NACE-hoofdactiviteit)
            </h2>
            <p className="mt-1 text-xs text-muted">
              {naceIsStandaard
                ? "Niets ingesteld → standaardselectie grond-, weg- en waterbouw (aangevinkt hieronder)."
                : "Eigen selectie actief. Alles uitvinken = terug naar de standaardselectie."}{" "}
              Enkel ondernemingen met een hoofdactiviteit binnen deze codes
              worden gekwalificeerd. Kernactiviteiten worden altijd gemaild;
              de andere codes enkel als hun homepage grondwerk- of
              machinesturing-signalen toont (anders &lsquo;overgeslagen&rsquo;).
            </p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            <Save className="h-4 w-4" strokeWidth={2} />
            Doelgroep bewaren
          </button>
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {NACE_OPTIES.map((o) => (
            <label key={o.code} className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="nace"
                value={o.code}
                defaultChecked={nace.includes(o.code)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span>
                <span className="font-mono text-xs text-muted">{naceMetPunt(o.code)}</span>{" "}
                {o.label}
                {o.kern ? (
                  <span className="ml-1 text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    kern
                  </span>
                ) : (
                  <span className="ml-1 text-[10px] uppercase tracking-widest text-muted">
                    {o.standaard ? "enkel met signalen" : "optioneel · enkel met signalen"}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 border-t pt-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted">
              Extra codes (prefix, met of zonder punt)
            </span>
            <input
              name="nace_extra"
              defaultValue={extraNace.map(naceMetPunt).join(", ")}
              placeholder="bv. 43.9, 71.12"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
            {extraNace.length > 0 && (
              <span className="mt-1 block text-[11px] text-muted">
                {extraNace
                  .map((c) => `${naceMetPunt(c)} ${naceLabel(c) || "(onbekende code)"}`)
                  .join(" · ")}
              </span>
            )}
          </label>
          <div>
            <span className="text-xs font-medium text-muted">Landen</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(["be", "fr", "uk", "nl", "de"] as const).map((l) => (
                <label
                  key={l}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name={`land_${l}`}
                    defaultChecked={cfg.lands.includes(l)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  {SOURCES[l].flag} {SOURCES[l].label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Mailtaal: BE volgens hun site of postcode (NL / FR, DE voor
              Oost-België), FR → Frans, UK → Engels.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {doelgroep.map((g) => (
            <span
              key={g.land}
              className="rounded-full bg-background/60 px-3 py-1 font-mono text-[11px] text-muted"
            >
              {SOURCES[g.land].flag} {g.alle.toLocaleString("nl-BE")} actief ·{" "}
              {g.metSite.toLocaleString("nl-BE")} met website
            </span>
          ))}
        </div>
      </form>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title={`Verzonden mails — laatste 14 dagen (open/klik-rate ${openRate}%)`}
          >
            <TrendChart
              id="outreach-trend"
              color="var(--accent)"
              height={140}
              points={mailsByDay}
            />
          </ChartCard>
        </div>
        <ChartCard title="Klaar om te mailen — per signaal">
          <Donut
            segments={gradeSegs}
            centerTop={String(klaar.count ?? 0)}
            centerSub="klaar"
          />
        </ChartCard>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Conversie-funnel (aannemers)">
            <BarList items={funnel} />
          </ChartCard>
        </div>
        <ChartCard title="Warm-up afzender">
          <p className="text-sm">
            {cfg.startedAt ? (
              <>
                Gestart op <strong>{cfg.startedAt}</strong> — vandaag max{" "}
                <strong>{vandaagMax}</strong> van {cfg.dailyQuota} mails.
              </>
            ) : (
              <>
                Nog niet gestart — de eerste dagen max <strong>5</strong>{" "}
                mails/dag, op dag 14 de volle quota ({cfg.dailyQuota}).
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-muted">
            Na een lange pauze of een nieuwe campagne is het veiliger om de
            warm-up opnieuw te laten beginnen.
          </p>
          {cfg.startedAt && (
            <form action={restartOutreachWarmup} className="mt-3">
              <button className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                Warm-up herstarten
              </button>
            </form>
          )}
        </ChartCard>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { k: "", l: "Alles" },
          { k: "gescand", l: "Klaar om te mailen" },
          { k: "verzonden", l: "Verzonden" },
          { k: "opgevolgd", l: "Opgevolgd" },
          { k: "geopend", l: "Geopend" },
          { k: "beantwoord", l: "Beantwoord" },
          { k: "klant", l: "Klant" },
          { k: "geen_interesse", l: "Geen interesse" },
          { k: "nieuw", l: `Overgeslagen · ${(overg.count ?? 0).toLocaleString("nl-BE")}` },
        ].map((f) => (
          <Link
            key={f.k}
            href={mkFilter({ status: f.k, grade, campagne: oud ? "oud" : "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === f.k
                ? "bg-accent/15 text-accent"
                : "border text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {f.l}
          </Link>
        ))}
        <span className="mx-1 w-px self-stretch bg-border" />
        {GRADES.map((g) => (
          <Link
            key={g}
            href={mkFilter({ status, grade: grade === g ? "" : g })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              grade === g && !oud
                ? "bg-accent/15 text-accent"
                : "border text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {GRADE_LABEL[g]} · {gradeTel[g].toLocaleString("nl-BE")}
          </Link>
        ))}
        <Link
          href={mkFilter({ status, campagne: oud ? "" : "oud" })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            oud
              ? "bg-accent/15 text-accent"
              : "border text-muted hover:bg-card-hover hover:text-foreground"
          }`}
          title="Rijen uit de vroegere website-campagne — worden nooit meer gemaild"
        >
          Oude website-campagne · {(oudTot.count ?? 0).toLocaleString("nl-BE")}
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Aannemer</th>
                <th className="px-4 py-3 font-medium">Prio</th>
                <th className="px-4 py-3 font-medium">Signalen</th>
                <th className="px-4 py-3 font-medium">Mail</th>
                <th className="px-4 py-3 font-medium">Verzonden</th>
                <th className="px-4 py-3 font-medium">Geopend</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    {oud
                      ? "Geen rijen uit de oude campagne in deze status."
                      : "Nog geen gekwalificeerde aannemers in deze weergave. De kwalificatie (homepage-scan) draait pas als de engine niet gepauzeerd is."}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const naam = namen.get(`${r.land}:${r.prospect_id}`);
                const g = isAannemerGrade(r.scan_grade) ? r.scan_grade : null;
                return (
                  <tr
                    key={`${r.land}-${r.prospect_id}`}
                    className="transition-colors hover:bg-card-hover"
                  >
                    <td className="px-4 py-3">
                      <span className="block max-w-[260px] truncate font-medium">
                        {naam ?? r.prospect_id}
                      </span>
                      <span className="block font-mono text-[10px] text-muted">
                        {r.land.toUpperCase()} · {r.prospect_id}
                        {r.website && (
                          <>
                            {" · "}
                            <a
                              href={
                                /^https?:\/\//.test(r.website)
                                  ? r.website
                                  : `https://${r.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-accent"
                            >
                              {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.scan_score ?? "—"}</td>
                    <td className="px-4 py-3">
                      {g ? (
                        <div className="flex max-w-[280px] flex-wrap gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${GRADE_BADGE[g]}`}
                          >
                            {GRADE_LABEL[g]}
                          </span>
                          {r.status === "nieuw" && r.notes && (
                            <span className="basis-full text-[10px] text-muted">
                              {r.notes.replace(/^overgeslagen:\s*/, "")}
                            </span>
                          )}
                          {(r.scan_issues ?? []).slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">
                          oude website-scan ({r.scan_grade ?? "—"})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{r.mail_to ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {d(r.mail_sent_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {d(r.opened_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${STATUS_BADGE[r.status] ?? "bg-card-hover text-muted"}`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/mail-preview?land=${r.land}&pid=${encodeURIComponent(r.prospect_id)}`}
                          className="rounded-md border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-card-hover"
                        >
                          Mail
                        </Link>
                        <form action={setOutreachStatus}>
                          <input type="hidden" name="land" value={r.land} />
                          <input
                            type="hidden"
                            name="prospect_id"
                            value={r.prospect_id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="beantwoord"
                          />
                          <button className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-green-500/10 hover:text-green-700">
                            Reply
                          </button>
                        </form>
                        <form action={setOutreachStatus}>
                          <input type="hidden" name="land" value={r.land} />
                          <input
                            type="hidden"
                            name="prospect_id"
                            value={r.prospect_id}
                          />
                          <input type="hidden" name="status" value="klant" />
                          <button className="rounded-md border border-emerald-600 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950">
                            Klant
                          </button>
                        </form>
                        <form action={setOutreachStatus}>
                          <input type="hidden" name="land" value={r.land} />
                          <input
                            type="hidden"
                            name="prospect_id"
                            value={r.prospect_id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="geen_interesse"
                          />
                          <button className="rounded-md border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-red-500/10 hover:text-red-600">
                            Stop
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
