import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { ChartCard } from "@/components/charts";
import { euro } from "@/lib/tarieven";
import { isOntbrekend, ticketSchema, vergeetTicketSchema } from "@/lib/tickets-server";
import {
  TICKET_SOORTEN,
  afgeleid,
  datumTijd,
  isTicketSoort,
  isUuid,
  soortVan,
  ticketRef,
  toonOnderwerp,
  wachtKort,
  wachtUren,
  type BerichtKern,
  type TicketAfgeleid,
  type TicketRij,
  type TicketSoort,
} from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";

export const dynamic = "force-dynamic";

// Werklijst van alle tickets. Standaard 'Aan mij': open tickets waar de
// studio aan zet is, oudste eerst. Werkt met én zonder migratie 0049: zonder
// de nieuwe kolommen leiden we de toestand af uit het laatste bericht van
// elk ticket (enkel voor de geladen tickets, nooit alle berichten).

const WEERGAVEN = ["aan_mij", "wacht_op_klant", "open", "gesloten", "alle"] as const;
type Weergave = (typeof WEERGAVEN)[number];

const WEERGAVE_LABEL: Record<Weergave, string> = {
  aan_mij: "Aan mij",
  wacht_op_klant: "Wacht op klant",
  open: "Open",
  gesloten: "Gesloten",
  alle: "Alle",
};

/** Zichtbare lijst (met 0049 rechtstreeks uit de databank). */
const LIJST_MAX = 300;
/** Lichte rijen voor tegels, tellers, trend en filterkeuzes. */
const LICHT_MAX = 2000;
/** Zonder 0049: zoveel recentste tickets laden en in JS filteren. */
const BASIS_MAX = 500;
const UUR = 3600_000;

const LICHT_KOLOMMEN = "id,client_email,subject,status,soort,project_id,wacht_op,laatste_bericht_op,created_at,updated_at";

type Db = ReturnType<typeof getSupabaseAdmin>;
type Rij = { t: TicketRij; a: TicketAfgeleid; soort: TicketSoort };
type ProjectInfo = { titel: string; email: string };

const SOORT_KLEUR: Record<TicketSoort, string> = {
  vraag: "border-border text-muted",
  revisie: "border-violet-300 bg-violet-200 text-violet-950",
  machine: "border-teal-300 bg-teal-200 text-teal-950",
  afspraak: "border-blue-300 bg-blue-200 text-blue-950",
  intern: "border-dashed border-border text-muted",
};

function inWeergave(r: Rij, w: Weergave): boolean {
  switch (w) {
    case "aan_mij":
      return !r.a.gesloten && r.a.wachtOp === "studio";
    case "wacht_op_klant":
      return !r.a.gesloten && r.a.wachtOp === "klant";
    case "open":
      return !r.a.gesloten;
    case "gesloten":
      return r.a.gesloten;
    default:
      return true;
  }
}

function ms(iso: string | null | undefined): number {
  const n = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** Zelfde volgorde als de databankquery: 'Aan mij' oudste eerst, gesloten op sluitdatum, de rest op laatste wijziging. */
function sorteer(rijen: Rij[], w: Weergave): Rij[] {
  const k = [...rijen];
  if (w === "aan_mij") k.sort((x, y) => ms(x.a.laatsteOp) - ms(y.a.laatsteOp));
  else if (w === "gesloten")
    k.sort((x, y) => ms(y.t.gesloten_op ?? y.t.updated_at) - ms(x.t.gesloten_op ?? x.t.updated_at));
  else k.sort((x, y) => ms(y.t.updated_at) - ms(x.t.updated_at));
  return k;
}

function urenTekst(u: number): string {
  return `${String(Math.round(u * 100) / 100).replace(".", ",")} u`;
}

function blokken<T>(lijst: T[], n: number): T[][] {
  const uit: T[][] = [];
  for (let i = 0; i < lijst.length; i += n) uit.push(lijst.slice(i, i + n));
  return uit;
}

/** Laatste bericht per ticket, enkel voor deze tickets (per blok van 50, begrensd). */
async function laatsteBerichten(db: Db, ids: string[]): Promise<Map<string, BerichtKern>> {
  const laatste = new Map<string, BerichtKern>();
  const delen = await Promise.all(
    blokken([...new Set(ids)], 50).map(async (blok) => {
      const { data } = await db
        .from("ticket_messages")
        .select("ticket_id, sender, body, created_at")
        .in("ticket_id", blok)
        .order("created_at", { ascending: false })
        .limit(1000);
      return (data as BerichtKern[] | null) ?? [];
    }),
  );
  for (const deel of delen) {
    for (const m of deel) {
      if (m.ticket_id && !laatste.has(m.ticket_id)) laatste.set(m.ticket_id, m);
    }
  }
  return laatste;
}

/** Tickets op id (per blok van 100). */
async function ticketsOpId(db: Db, ids: string[]): Promise<TicketRij[]> {
  const delen = await Promise.all(
    blokken([...new Set(ids)], 100).map(async (blok) => {
      const { data } = await db.from("tickets").select("*").in("id", blok).limit(blok.length);
      return (data as TicketRij[] | null) ?? [];
    }),
  );
  return delen.flat();
}

/**
 * Zoeken in onderwerp, e-mail, nummer (met 0049) en de tekst van berichten.
 * Elke deelzoekopdracht is begrensd; het resultaat wordt in JS samengevoegd.
 */
async function zoekTickets(db: Db, q: string, v2: boolean): Promise<{ rijen: TicketRij[]; fout: string | null }> {
  const pat = `%${q}%`;
  const num = /^#?\d{1,9}$/.test(q) ? Number(q.replace("#", "")) : null;
  const [onderwerp, email, nummer, berichten] = await Promise.all([
    db.from("tickets").select("*").ilike("subject", pat).order("updated_at", { ascending: false }).limit(200),
    db.from("tickets").select("*").ilike("client_email", pat).order("updated_at", { ascending: false }).limit(200),
    v2 && num != null
      ? db.from("tickets").select("*").eq("nummer", num).limit(5)
      : Promise.resolve({ data: [] as TicketRij[], error: null }),
    db
      .from("ticket_messages")
      .select("ticket_id")
      .ilike("body", pat)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const fout = onderwerp.error ?? email.error ?? berichten.error ?? null;
  const perId = new Map<string, TicketRij>();
  for (const r of [onderwerp, email, nummer]) {
    for (const t of (r.data as TicketRij[] | null) ?? []) perId.set(t.id, t);
  }
  const ontbreekt = [
    ...new Set(((berichten.data as { ticket_id: string }[] | null) ?? []).map((m) => m.ticket_id)),
  ].filter((id) => !perId.has(id));
  if (ontbreekt.length) for (const t of await ticketsOpId(db, ontbreekt)) perId.set(t.id, t);
  return { rijen: [...perId.values()], fout: fout ? fout.message : null };
}

export default async function AdminTickets({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");

  const weergave: Weergave = (WEERGAVEN as readonly string[]).includes(pick("weergave"))
    ? (pick("weergave") as Weergave)
    : "aan_mij";
  const soortF: TicketSoort | null = isTicketSoort(pick("soort")) ? (pick("soort") as TicketSoort) : null;
  const klantF = pick("klant").toLowerCase().slice(0, 200) || null;
  const projectF = isUuid(pick("project")) ? pick("project") : null;
  // Geen %, _ of komma's (LIKE-jokers / filtersyntaxis), ook geen * of \.
  const q = pick("q")
    .replace(/[%_,*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  const db = getSupabaseAdmin();
  const schema = await ticketSchema();
  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();

  let v2 = schema.v2;
  let fout: string | null = null;
  let licht: Rij[] = [];
  let bron: Rij[] | null = null; // zoek- of basisstand: in JS filteren
  let dbLijst: Rij[] = []; // met 0049 zonder zoekterm: rechtstreeks uit de databank

  const maakRij = (t: TicketRij, laatste?: BerichtKern | null): Rij => ({
    t,
    a: afgeleid(t, laatste ? [laatste] : null),
    soort: soortVan(t),
  });

  // ── Met migratie 0049 ──
  if (v2) {
    let hq = db.from("tickets").select("*");
    hq = soortF ? hq.eq("soort", soortF) : hq.neq("soort", "intern");
    if (klantF) hq = hq.eq("client_email", klantF);
    if (projectF) hq = hq.eq("project_id", projectF);
    if (weergave === "aan_mij") {
      hq = hq
        .neq("status", "gesloten")
        .eq("wacht_op", "studio")
        .order("laatste_bericht_op", { ascending: true })
        .order("created_at", { ascending: true });
    } else if (weergave === "wacht_op_klant") {
      hq = hq.neq("status", "gesloten").eq("wacht_op", "klant").order("updated_at", { ascending: false });
    } else if (weergave === "open") {
      hq = hq.neq("status", "gesloten").order("updated_at", { ascending: false });
    } else if (weergave === "gesloten") {
      hq = hq
        .eq("status", "gesloten")
        .order("gesloten_op", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });
    } else {
      hq = hq.order("updated_at", { ascending: false });
    }

    const [lichtR, hoofdR, zoekR] = await Promise.all([
      db.from("tickets").select(LICHT_KOLOMMEN).order("created_at", { ascending: false }).limit(LICHT_MAX),
      q ? Promise.resolve(null) : hq.limit(LIJST_MAX),
      q ? zoekTickets(db, q, true) : Promise.resolve(null),
    ]);
    if (isOntbrekend(lichtR.error) || isOntbrekend(hoofdR?.error)) {
      // Cache zei v2, de databank niet (meer): basisstand.
      vergeetTicketSchema();
      v2 = false;
    } else {
      fout = lichtR.error?.message ?? hoofdR?.error?.message ?? zoekR?.fout ?? null;
      licht = ((lichtR.data as unknown as TicketRij[] | null) ?? []).map((t) => maakRij(t));
      if (zoekR) bron = zoekR.rijen.map((t) => maakRij(t));
      else dbLijst = ((hoofdR?.data as TicketRij[] | null) ?? []).map((t) => maakRij(t));
    }
  }

  // ── Basisstand (vóór migratie 0049) ──
  if (!v2) {
    const [basisR, zoekR] = await Promise.all([
      db.from("tickets").select("*").order("updated_at", { ascending: false }).limit(BASIS_MAX),
      q ? zoekTickets(db, q, false) : Promise.resolve(null),
    ]);
    fout = basisR.error?.message ?? zoekR?.fout ?? null;
    const basis = (basisR.data as TicketRij[] | null) ?? [];
    // Referentie vóór 0049 = '#' + begin van het id: ook daarop zoeken.
    const idStuk = /^#?[0-9a-f]{4,8}$/i.test(q) ? q.replace("#", "").toLowerCase() : null;
    const gevonden = zoekR ? [...zoekR.rijen] : null;
    if (gevonden && idStuk) {
      const al = new Set(gevonden.map((t) => t.id));
      for (const t of basis) if (t.id.startsWith(idStuk) && !al.has(t.id)) gevonden.push(t);
    }
    const laatste = await laatsteBerichten(db, [...basis, ...(gevonden ?? [])].map((t) => t.id));
    licht = basis.map((t) => maakRij(t, laatste.get(t.id)));
    bron = gevonden ? gevonden.map((t) => maakRij(t, laatste.get(t.id))) : licht;
  }

  // ── Projecten, bedrijven en revisie-uren ──
  const projectIds = new Set<string>();
  for (const r of [...licht, ...(bron ?? []), ...dbLijst]) if (isUuid(r.t.project_id)) projectIds.add(r.t.project_id);
  if (projectF) projectIds.add(projectF);

  const [projectDelen, quotesR, urenR] = await Promise.all([
    Promise.all(
      blokken([...projectIds], 100).map(async (blok) => {
        const { data } = await db.from("projecten").select("id, titel, client_email").in("id", blok).limit(blok.length);
        return (data as { id: string; titel: string | null; client_email: string | null }[] | null) ?? [];
      }),
    ),
    db
      .from("quotes")
      .select("email, company")
      .not("company", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000),
    schema.uren
      ? db
          .from("ticket_uren")
          .select("ticket_id, uren, tarief_cent")
          .is("invoice_id", null)
          .is("naar_project_op", null)
          .limit(2000)
      : Promise.resolve(null),
  ]);
  const projecten = new Map<string, ProjectInfo>();
  for (const p of projectDelen.flat()) {
    projecten.set(p.id, { titel: p.titel || "(zonder titel)", email: String(p.client_email ?? "").trim().toLowerCase() });
  }
  const bedrijf = new Map<string, string>();
  for (const r of (quotesR.data as { email: string | null; company: string | null }[] | null) ?? []) {
    const e = String(r.email ?? "").trim().toLowerCase();
    const c = String(r.company ?? "").trim();
    if (e && c && !bedrijf.has(e)) bedrijf.set(e, c);
  }
  const openUren = urenR && !urenR.error ? ((urenR.data as { ticket_id: string; uren: number; tarief_cent: number }[] | null) ?? []) : [];
  const urenTotaal = openUren.reduce((s, u) => s + (Number(u.uren) || 0), 0);
  const urenCent = openUren.reduce((s, u) => s + Math.round((Number(u.uren) || 0) * (Number(u.tarief_cent) || 0)), 0);
  const urenTickets = new Set(openUren.map((u) => u.ticket_id)).size;

  // ── Filters ──
  const projectInfo = projectF ? (projecten.get(projectF) ?? null) : null;
  const pastFilter = (r: Rij) => {
    if (soortF ? r.soort !== soortF : r.soort === "intern") return false;
    if (klantF && r.t.client_email.trim().toLowerCase() !== klantF) return false;
    if (projectF) {
      // Zonder 0049 bestaat de projectkoppeling niet: dan alle tickets van de klant van dat project.
      if (v2 ? r.t.project_id !== projectF : !projectInfo || r.t.client_email.trim().toLowerCase() !== projectInfo.email)
        return false;
    }
    return true;
  };

  const telBron = (bron ?? licht).filter(pastFilter);
  const tellers = Object.fromEntries(WEERGAVEN.map((w) => [w, telBron.filter((r) => inWeergave(r, w)).length])) as Record<
    Weergave,
    number
  >;
  const lijst = bron ? sorteer(bron.filter((r) => pastFilter(r) && inWeergave(r, weergave)), weergave).slice(0, LIJST_MAX) : dbLijst;
  const afgekapt = lijst.length >= LIJST_MAX;

  // ── Tegels (over alles, los van de filters; zonder interne meldingen) ──
  const extern = licht.filter((r) => r.soort !== "intern");
  const aanMij = extern.filter((r) => inWeergave(r, "aan_mij"));
  const wachtKlant = extern.filter((r) => inWeergave(r, "wacht_op_klant")).length;
  const teLaat = aanMij.filter((r) => nu - ms(r.a.laatsteOp) > 24 * UUR).length;

  // Maanden in Brusselse tijd (de server draait in UTC): "en-CA" geeft "JJJJ-MM".
  const brusselsMaand = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit" });
  const maandSleutel = (iso: string | null | undefined) => {
    const t = ms(iso);
    return t > 0 ? brusselsMaand.format(t) : "";
  };
  const perMaand = new Map<string, number>();
  for (const r of extern) {
    const ym = maandSleutel(r.t.created_at);
    if (ym) perMaand.set(ym, (perMaand.get(ym) ?? 0) + 1);
  }
  const [nuJaar, nuMaand] = brusselsMaand.format(nu).split("-").map(Number);
  const maanden = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(Date.UTC(nuJaar, nuMaand - 1 - (5 - k), 15));
    const ym = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short", timeZone: "UTC" }),
      value: perMaand.get(ym) ?? 0,
    };
  });

  // ── Filterkeuzes ──
  const klanten = [...new Set([...extern.map((r) => r.t.client_email.trim().toLowerCase()), ...(klantF ? [klantF] : [])])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "nl"));
  const projectKeuzes = v2
    ? [
        ...new Set([
          ...licht.filter((r) => r.soort !== "intern" && isUuid(r.t.project_id)).map((r) => r.t.project_id as string),
          ...(projectF ? [projectF] : []),
        ]),
      ]
        .map((id) => ({ id, ...(projecten.get(id) ?? { titel: "(project verwijderd)", email: "" }) }))
        .sort((a, b) => a.titel.localeCompare(b.titel, "nl"))
    : [];

  const filtersActief = !!(soortF || klantF || projectF || q);
  const banner = !schema.v2 || !schema.bijlagen || !schema.notities || !schema.uren || !v2;

  const href = (wijzig: Partial<Record<"weergave" | "soort" | "klant" | "project" | "q", string | null>>) => {
    const alles: Record<string, string | null> = {
      weergave,
      soort: soortF,
      klant: klantF,
      project: projectF,
      q: q || null,
      ...wijzig,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(alles)) {
      if (!v || (k === "weergave" && v === "aan_mij")) continue;
      p.set(k, v);
    }
    const s = p.toString();
    return `/admin/tickets${s ? `?${s}` : ""}`;
  };

  const chips: { label: string; weg: string }[] = [];
  if (soortF) chips.push({ label: `Soort: ${SOORT_LABEL[soortF].nl}`, weg: href({ soort: null }) });
  if (klantF) chips.push({ label: `Klant: ${klantF}`, weg: href({ klant: null }) });
  if (projectF)
    chips.push({
      label: `Project: ${projectInfo?.titel ?? "onbekend"}${v2 ? "" : " (alle tickets van deze klant)"}`,
      weg: href({ project: null }),
    });
  if (q) chips.push({ label: `Zoekterm: “${q}”`, weg: href({ q: null }) });

  const tegels = [
    { k: "Aan mij", v: String(aanMij.length), sub: "open, u bent aan zet", href: href({ weergave: "aan_mij", soort: null, klant: null, project: null, q: null }) },
    { k: "Wacht op klant", v: String(wachtKlant), sub: "open, klant is aan zet", href: href({ weergave: "wacht_op_klant", soort: null, klant: null, project: null, q: null }) },
    {
      k: "Te laat",
      v: String(teLaat),
      sub: "wacht > 24 u op u",
      rood: teLaat > 0,
      href: href({ weergave: "aan_mij", soort: null, klant: null, project: null, q: null }),
    },
    schema.uren
      ? {
          k: "Revisie-uren te factureren",
          v: urenTekst(urenTotaal),
          sub: `${euro(urenCent)} excl. btw · ${urenTickets} ticket${urenTickets === 1 ? "" : "s"}`,
          rood: urenTotaal > 0,
          href: null,
        }
      : { k: "Revisie-uren te factureren", v: "—", sub: "na migratie 0049", href: null },
  ];

  const SELECT = "mt-1 block w-full rounded-full border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:max-w-[16rem]";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <Link
          href="/admin/tickets/nieuw"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nieuw ticket
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">Vragen, revisies en machineproblemen van klanten. Standaard ziet u wat op u wacht, oudste eerst.</p>

      {banner && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          Migratie 0049 nog niet gedraaid — bijlagen, notities, uren en projectkoppeling staan uit.
        </p>
      )}
      {fout && (
        <p className="mt-4 rounded-xl border border-red-400 bg-red-200 px-4 py-2 text-sm text-red-950">
          Tickets konden niet (volledig) geladen worden: {fout}
        </p>
      )}

      {/* Tegels */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tegels.map((s) => {
          const inhoud = (
            <>
              <p className="text-xs uppercase tracking-wide text-muted">{s.k}</p>
              <p className={`mt-1 truncate text-2xl font-semibold ${"rood" in s && s.rood ? "text-red-500" : ""}`}>{s.v}</p>
              <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link
              key={s.k}
              href={s.href}
              className="rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5"
            >
              {inhoud}
            </Link>
          ) : (
            <div key={s.k} className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
              {inhoud}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <ChartCard title="Nieuwe tickets — laatste 6 maanden">
          <TrendChart id="tic-maand" color="var(--accent)" height={96} points={maanden} />
        </ChartCard>
      </div>

      {/* Weergaven */}
      <nav aria-label="Weergave" className="mt-6 flex flex-wrap gap-2">
        {WEERGAVEN.map((w) => (
          <Link
            key={w}
            href={href({ weergave: w })}
            aria-current={weergave === w ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              weergave === w ? "bg-foreground text-background" : "hover:bg-card-hover"
            }`}
          >
            {WEERGAVE_LABEL[w]}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${weergave === w ? "bg-background text-foreground" : "bg-card-hover"}`}>
              {tellers[w]}
            </span>
          </Link>
        ))}
      </nav>

      {/* Filters */}
      <form method="get" action="/admin/tickets" className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        {weergave !== "aan_mij" && <input type="hidden" name="weergave" value={weergave} />}
        <label className="text-xs text-muted">
          Soort
          <select name="soort" defaultValue={soortF ?? ""} className={SELECT}>
            <option value="">alle (zonder intern)</option>
            {TICKET_SOORTEN.map((s) => (
              <option key={s} value={s}>
                {SOORT_LABEL[s].nl}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Klant
          <select name="klant" defaultValue={klantF ?? ""} className={SELECT}>
            <option value="">alle klanten</option>
            {klanten.map((e) => (
              <option key={e} value={e}>
                {bedrijf.get(e) ? `${e} — ${bedrijf.get(e)}` : e}
              </option>
            ))}
          </select>
        </label>
        {projectKeuzes.length > 0 && (
          <label className="text-xs text-muted">
            Project
            <select name="project" defaultValue={projectF ?? ""} className={SELECT}>
              <option value="">alle projecten</option>
              {projectKeuzes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email ? `${p.titel} — ${p.email}` : p.titel}
                </option>
              ))}
            </select>
          </label>
        )}
        {!v2 && projectF && <input type="hidden" name="project" value={projectF} />}
        <label className="min-w-0 text-xs text-muted sm:min-w-[200px] sm:flex-1">
          Zoeken
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} aria-hidden="true" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              maxLength={80}
              placeholder={v2 ? "onderwerp, #nummer, e-mail of berichttekst" : "onderwerp, e-mail of berichttekst"}
              className="w-full rounded-full border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Filter
          </button>
          {filtersActief && (
            <Link
              href={href({ soort: null, klant: null, project: null, q: null })}
              className="px-2 py-1.5 text-sm text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Wissen
            </Link>
          )}
        </div>
      </form>

      {chips.length > 0 && (
        <ul aria-label="Actieve filters" className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.label} className="min-w-0 max-w-full">
              <Link
                href={c.weg}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-xs text-foreground transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="truncate">{c.label}</span>
                <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span className="sr-only">filter wissen</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Lijst */}
      {lijst.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-6 text-sm text-muted shadow-sm">
          {weergave === "aan_mij" ? (
            <>
              <p className="font-medium text-foreground">Niets wacht op u.</p>
              <p className="mt-1">
                <Link href={href({ weergave: "alle" })} className="text-accent underline-offset-2 hover:underline">
                  Alle tickets bekijken
                </Link>
              </p>
            </>
          ) : (
            <p>Geen tickets in deze weergave.</p>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {lijst.map((r) => {
            const { t, a } = r;
            const email = t.client_email.trim().toLowerCase();
            const ongelezen = a.studioOngelezen;
            const project = isUuid(t.project_id) ? projecten.get(t.project_id) : undefined;
            const wachtMs = !a.gesloten && a.wachtOp === "studio" ? Math.max(0, nu - ms(a.laatsteOp)) : null;
            const status = a.gesloten
              ? { label: "Gesloten", cls: "border text-muted" }
              : a.wachtOp === "studio"
                ? { label: "Aan mij", cls: "bg-accent text-background" }
                : { label: "Wacht op klant", cls: "bg-sky-200 text-sky-950" };
            const wachtCls =
              wachtMs == null
                ? ""
                : wachtMs > 48 * UUR
                  ? "bg-red-600 text-white"
                  : wachtMs > 24 * UUR
                    ? "bg-amber-300 text-amber-950"
                    : "border text-muted";
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/tickets/${t.id}`}
                  className="block rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        {ongelezen && (
                          <>
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                            <span className="sr-only">Ongelezen:</span>
                          </>
                        )}
                        <span className="font-mono">{ticketRef(t)}</span>
                        <span className={`rounded-full border px-2 py-0.5 ${SOORT_KLEUR[r.soort]}`}>{SOORT_LABEL[r.soort].nl}</span>
                        {project && <span className="min-w-0 break-words">{project.titel}</span>}
                      </p>
                      <p className={`mt-1.5 break-words ${ongelezen ? "font-semibold" : "font-medium"}`}>{toonOnderwerp(t) || t.subject}</p>
                      <p className="mt-0.5 break-all text-xs text-muted">
                        {email}
                        {bedrijf.get(email) ? <span className="break-normal"> · {bedrijf.get(email)}</span> : null}
                      </p>
                      {a.fragment && (
                        <p className={`mt-2 line-clamp-2 break-words text-sm ${ongelezen ? "text-foreground" : "text-muted"}`}>
                          {a.laatsteAfzender && (
                            <span className="font-medium text-foreground">{a.laatsteAfzender === "studio" ? "Studio:" : "Klant:"} </span>
                          )}
                          {a.fragment}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                      {wachtMs != null && (
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${wachtCls}`}>
                          wacht {wachtKort(wachtUren(a.laatsteOp, nu))}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        <span className="sr-only">Laatste activiteit: </span>
                        {datumTijd(a.laatsteOp, "nl")}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {afgekapt && (
        <p className="mt-3 text-xs text-muted">De eerste {LIJST_MAX} tickets worden getoond — verfijn met de filters of de zoekterm.</p>
      )}
    </>
  );
}
