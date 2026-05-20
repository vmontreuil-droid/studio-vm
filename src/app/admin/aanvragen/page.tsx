import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setStatus, setNote, deleteQuote } from "@/app/actions/admin";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type Quote = {
  id: string;
  created_at: string;
  locale: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  vat_number: string | null;
  address: string | null;
  message: string | null;
  notes: string | null;
  base: string;
  modules: string[];
  plan: string;
  est_low: number | null;
  est_high: number | null;
  monthly: number | null;
  deposit_cents: number | null;
  deposit_status: string | null;
  monthly_total_cents: number | null;
  status: string;
  source: string | null;
};

const eurc = (x: number | null | undefined) =>
  x == null ? "—" : "€ " + (x / 100).toLocaleString("nl-BE");

const eur = (x: number | null | undefined) =>
  x == null ? "—" : "€ " + x.toLocaleString("nl-BE");

const eurK = (x: number) =>
  x >= 10_000
    ? "€ " + Math.round(x / 1000) + "k"
    : "€ " + x.toLocaleString("nl-BE");

const STATUSES = ["nieuw", "in behandeling", "gewonnen", "verloren", "archief"];
const STATUS_COLOR: Record<string, string> = {
  nieuw: "bg-accent/15 text-accent",
  "in behandeling": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  gewonnen: "bg-green-500/15 text-green-600 dark:text-green-400",
  verloren: "bg-red-500/15 text-red-500",
  archief: "bg-muted/15 text-muted",
};
const STATUS_DOT: Record<string, string> = {
  nieuw: "var(--accent)",
  "in behandeling": "#0ea5e9",
  gewonnen: "#16a34a",
  verloren: "#ef4444",
  archief: "#64748b",
};

// Korte, "human" datum: vandaag · gisteren · X dagen geleden · datum
function relative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - d.getTime()) / 86_400_000,
  );
  if (days <= 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days}d geleden`;
  if (days < 30) return `${Math.floor(days / 7)}w geleden`;
  return d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" });
}

// Builder-aanvragen krijgen lange base64-dumps in `message`. We tonen
// alleen een nette samenvatting; de detailpagina toont de ruwe inhoud.
function builderSummary(msg: string | null): {
  zaak?: string;
  paginas: number;
  preview: string;
} {
  if (!msg) return { paginas: 0, preview: "" };
  const zaak = msg.match(/Zaak:\s*([^\n]+)/i)?.[1]?.trim();
  const paginas = (msg.match(/—\s*Pagina:/gi) || []).length;
  const stijl = msg.match(/Stijl:\s*([^\n]+)/i)?.[1]?.trim();
  const preview = [stijl].filter(Boolean).join(" · ").slice(0, 120);
  return { zaak, paginas, preview };
}

// Niet-builder: korte message-preview (geen base64-dumps, geen muren tekst).
function shortMessage(msg: string | null): string {
  if (!msg) return "";
  const cleaned = msg
    .replace(/data:image\/[^;]+;base64,[^\s)"']+/gi, "[afbeelding]")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 220 ? cleaned.slice(0, 220) + "…" : cleaned;
}

const SOURCE_LABEL: Record<string, string> = {
  builder: "Builder",
  "offerte-configurator": "Configurator",
  "offerte-calculator": "Calculator",
  contact: "Contactformulier",
};
const SOURCE_COLOR: Record<string, string> = {
  builder: "var(--accent)",
  "offerte-configurator": "#0ea5e9",
  "offerte-calculator": "#8b5cf6",
  contact: "#16a34a",
};

export default async function AdminAanvragen({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; src?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;

  const db = getSupabaseAdmin();
  let qy = db
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(400);
  if (sp.status && STATUSES.includes(sp.status))
    qy = qy.eq("status", sp.status);
  if (sp.src) qy = qy.eq("source", sp.src);
  const { data } = await qy;
  let rows = (data as Quote[]) ?? [];
  if (sp.q) {
    const n = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(n) ||
        r.email?.toLowerCase().includes(n) ||
        r.message?.toLowerCase().includes(n),
    );
  }

  // KPI's — berekend uit ALLE rows die de filter doorlaat.
  const now = new Date();
  const thisYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const cntTotal = rows.length;
  const cntThisMonth = rows.filter((r) => r.created_at.startsWith(thisYM)).length;
  const cntPrevMonth = rows.filter((r) => r.created_at.startsWith(prevYM)).length;
  const monthDelta =
    cntPrevMonth === 0
      ? cntThisMonth > 0
        ? 100
        : 0
      : Math.round(((cntThisMonth - cntPrevMonth) / cntPrevMonth) * 100);

  const cntOpen = rows.filter(
    (r) => r.status === "nieuw" || r.status === "in behandeling",
  ).length;
  const cntWon = rows.filter((r) => r.status === "gewonnen").length;
  const cntLost = rows.filter((r) => r.status === "verloren").length;
  const winrate =
    cntWon + cntLost > 0 ? Math.round((cntWon / (cntWon + cntLost)) * 100) : 0;

  const pipelineEur = rows
    .filter((r) => r.status === "nieuw" || r.status === "in behandeling")
    .reduce((s, r) => s + (r.est_high ?? 0), 0);

  const wonEur = rows
    .filter((r) => r.status === "gewonnen")
    .reduce((s, r) => s + (r.est_high ?? 0), 0);

  const avgTicket =
    cntWon > 0
      ? Math.round(wonEur / cntWon)
      : (() => {
          const withPrice = rows.filter((r) => (r.est_high ?? 0) > 0);
          return withPrice.length
            ? Math.round(
                withPrice.reduce((s, r) => s + (r.est_high ?? 0), 0) /
                  withPrice.length,
              )
            : 0;
        })();

  // Trend laatste 6 maanden
  const reqMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: rows.filter((r) => (r.created_at ?? "").startsWith(ym)).length,
    };
  });

  // Status-donut
  const statusSegs = STATUSES.map((s) => ({
    label: s,
    value: rows.filter((r) => r.status === s).length,
    color: STATUS_DOT[s] ?? "#64748b",
  })).filter((s) => s.value > 0);

  // Source-donut
  const SRC = Object.keys(SOURCE_LABEL);
  const knownSrc = new Set(SRC);
  const srcSegs = [
    ...SRC.map((k) => ({
      label: SOURCE_LABEL[k],
      value: rows.filter((r) => r.source === k).length,
      color: SOURCE_COLOR[k] ?? "#64748b",
    })).filter((s) => s.value > 0),
    {
      label: "Overig / leeg",
      value: rows.filter(
        (r) => !r.source || !knownSrc.has(r.source as string),
      ).length,
      color: "#64748b",
    },
  ].filter((s) => s.value > 0);

  // Top-modules (uit `modules` array)
  const moduleCount = new Map<string, number>();
  for (const r of rows) {
    for (const m of r.modules ?? []) {
      moduleCount.set(m, (moduleCount.get(m) ?? 0) + 1);
    }
  }
  const topModules = Array.from(moduleCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const chip = (label: string, params: Record<string, string>) => {
    const u = new URLSearchParams(params).toString();
    const active =
      (params.status ?? "") === (sp.status ?? "") &&
      (params.src ?? "") === (sp.src ?? "");
    return (
      <a
        key={label + JSON.stringify(params)}
        href={`/admin/aanvragen${u ? `?${u}` : ""}`}
        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
          active
            ? "border-accent bg-accent/10 text-accent"
            : "text-muted hover:border-foreground/40 hover:text-foreground"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Aanvragen
            <span className="ml-2 text-muted">({cntTotal})</span>
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Alles wat binnenkomt via builder, configurator, calculator en
            contactformulier — op één plek.
          </p>
        </div>
        {cntTotal > 0 && (
          <a
            href="/admin/aanvragen/export"
            className="rounded-full border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Exporteer CSV
          </a>
        )}
      </div>

      {/* KPI-strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Totaal aanvragen"
          value={String(cntTotal)}
          hint={`${cntThisMonth} deze maand`}
        />
        <Kpi
          label="Deze maand"
          value={String(cntThisMonth)}
          hint={
            cntPrevMonth === 0
              ? "geen vorige maand"
              : `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs. vorige`
          }
          tone={monthDelta >= 0 ? "good" : "bad"}
        />
        <Kpi
          label="Open"
          value={String(cntOpen)}
          hint="nieuw + in behandeling"
          tone={cntOpen > 0 ? "accent" : "neutral"}
        />
        <Kpi
          label="Win-rate"
          value={`${winrate}%`}
          hint={`${cntWon} gewonnen · ${cntLost} verloren`}
          tone={winrate >= 50 ? "good" : winrate > 0 ? "neutral" : "bad"}
        />
        <Kpi
          label="Pijplijn-waarde"
          value={eurK(pipelineEur)}
          hint={`gem. ticket ${eurK(avgTicket)}`}
        />
      </div>

      {/* Charts row */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Aanvragen — laatste 6 maanden">
            <TrendChart
              id="aanv-maand"
              color="var(--accent)"
              height={160}
              points={reqMonths}
            />
          </ChartCard>
        </div>
        <ChartCard title="Status">
          {statusSegs.length === 0 ? (
            <p className="text-sm text-muted">Geen gegevens.</p>
          ) : (
            <Donut
              segments={statusSegs}
              centerTop={String(cntTotal)}
              centerSub="aanvragen"
            />
          )}
        </ChartCard>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Per bron">
          {srcSegs.length === 0 ? (
            <p className="text-sm text-muted">Geen gegevens.</p>
          ) : (
            <Donut segments={srcSegs} />
          )}
        </ChartCard>
        <ChartCard title="Top-modules">
          {topModules.length === 0 ? (
            <p className="text-sm text-muted">Geen modules in deze selectie.</p>
          ) : (
            <BarList items={topModules} />
          )}
        </ChartCard>
      </div>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Zoek naam / e-mail / tekst…"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
        />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        {sp.src && <input type="hidden" name="src" value={sp.src} />}
        <button className="rounded-full border px-4 py-2 text-xs">
          Zoeken
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {chip("Alles", {})}
        <span className="mx-1 self-center text-xs text-muted">|</span>
        {STATUSES.map((s) => chip(s, { status: s }))}
        <span className="mx-1 self-center text-xs text-muted">|</span>
        {Object.entries(SOURCE_LABEL).map(([k, v]) =>
          chip(`· ${v.toLowerCase()}`, { src: k }),
        )}
      </div>

      {/* Lijst */}
      <ul className="mt-6 space-y-3">
        {rows.length === 0 && (
          <li className="rounded-2xl bg-card p-6 text-muted shadow-sm">
            Geen aanvragen voor deze filter.
          </li>
        )}
        {rows.map((q) => {
          const isBuilder = q.source === "builder";
          const builderInfo = isBuilder ? builderSummary(q.message) : null;
          const srcLabel = q.source ? SOURCE_LABEL[q.source] : null;
          const srcColor = q.source ? SOURCE_COLOR[q.source] : null;
          return (
            <li
              key={q.id}
              className="overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/30 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {srcLabel && (
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-background"
                      style={{ background: srcColor ?? "#64748b" }}
                    >
                      {srcLabel}
                    </span>
                  )}
                  <Link
                    href={`/admin/aanvragen/${q.id}`}
                    className="truncate font-semibold underline-offset-2 hover:underline"
                  >
                    {q.name || "(geen naam)"}
                  </Link>
                  {q.email && (
                    <a
                      href={`mailto:${q.email}`}
                      className="truncate text-sm text-accent underline-offset-2 hover:underline"
                    >
                      {q.email}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                  <span>{relative(q.created_at)}</span>
                  <span>·</span>
                  <span>{q.locale?.toUpperCase()}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      STATUS_COLOR[q.status] ?? "bg-muted/15 text-muted"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                {isBuilder ? (
                  <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        Zaak
                      </p>
                      <p className="mt-0.5 font-medium">
                        {builderInfo?.zaak ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        Pagina&apos;s gebouwd
                      </p>
                      <p className="mt-0.5 font-medium">
                        {builderInfo?.paginas ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        Stijl
                      </p>
                      <p className="mt-0.5 truncate text-muted">
                        {builderInfo?.preview || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        Pakket
                      </p>
                      <p className="mt-0.5 font-medium">
                        {q.base}
                        {q.plan && (
                          <span className="ml-1 text-muted">· {q.plan}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        Richtprijs
                      </p>
                      <p className="mt-0.5 font-medium">
                        {eur(q.est_low)}
                        {q.est_low !== q.est_high && ` – ${eur(q.est_high)}`}
                      </p>
                    </div>
                    {q.modules?.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          Modules
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {q.modules.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-background px-2 py-0.5 text-[11px]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(q.phone || q.company || q.vat_number || q.address) && (
                      <div className="sm:col-span-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          Klant
                        </p>
                        <p className="mt-0.5 text-muted">
                          {[q.company, q.phone, q.vat_number, q.address]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    )}
                    {q.deposit_cents != null && (
                      <div className="sm:col-span-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          Aanbetaling
                        </p>
                        <p className="mt-0.5">
                          <strong>{eurc(q.deposit_cents)}</strong>{" "}
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                              q.deposit_status === "betaald"
                                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {q.deposit_status ?? "open"}
                          </span>
                          {q.monthly_total_cents != null && (
                            <>
                              {" "}
                              · <span className="text-muted">daarna</span>{" "}
                              {eurc(q.monthly_total_cents)}/maand
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {q.message && !isBuilder && (
                  <p className="mt-3 line-clamp-3 rounded-xl bg-background/50 px-3 py-2 text-sm text-muted">
                    {shortMessage(q.message)}
                  </p>
                )}
              </div>

              {/* Acties */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-background/20 px-5 py-3">
                <Link
                  href={`/admin/aanvragen/${q.id}`}
                  className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  Volledig detail →
                </Link>
                <form action={setStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={q.id} />
                  <select
                    name="status"
                    defaultValue={q.status}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    Status
                  </button>
                </form>
                <form action={deleteQuote}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-card-hover">
                    Verwijder
                  </button>
                </form>
                <details className="ml-auto">
                  <summary className="cursor-pointer rounded-full border px-3 py-1.5 text-xs text-muted hover:text-foreground">
                    Notitie {q.notes ? "✎" : "+"}
                  </summary>
                  <form action={setNote} className="mt-2 sm:min-w-[340px]">
                    <input type="hidden" name="id" value={q.id} />
                    <textarea
                      name="notes"
                      defaultValue={q.notes ?? ""}
                      rows={2}
                      placeholder="Interne notitie…"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button className="mt-1 rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                      Bewaren
                    </button>
                  </form>
                </details>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Compacte KPI-card. Kleine variant van shop-stijl maar uniform met
// de admin-grafiekkaarten. Tone bepaalt de accent-kleur.
function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "accent";
}) {
  const toneCls =
    tone === "good"
      ? "text-green-600 dark:text-green-400"
      : tone === "bad"
        ? "text-red-500"
        : tone === "accent"
          ? "text-accent"
          : "text-foreground";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
