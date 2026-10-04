import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  FileText,
  Package,
  Clock,
  Receipt,
  MessageSquareWarning,
  NotebookPen,
  Settings2,
  TriangleAlert,
  Download,
  Trash2,
  Send,
  ExternalLink,
  Check,
  Plus,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  STAPPEN,
  STATUS_LABEL,
  CATEGORIE_LABEL,
  MERKEN,
  NEUTRALE_SYSTEMEN,
  werfTekst,
  grootteTekst,
  perVersie,
  dagenTot,
  type Project,
  type Levering,
} from "@/lib/projecten";
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "@/lib/tarieven";
import { LANDEN } from "@/lib/stelsel";
import { TAAL_NAAM } from "@/lib/projecten-teksten";
import { klantGegevens } from "@/lib/projecten-admin";
import {
  zetStatus,
  bewaarGegevens,
  bewaarWerf,
  bewaarUren,
  telUren,
  bewaarNotitie,
  verwijderPlan,
  verwijderLevering,
  verwittigKlant,
  maakFactuur,
  markeerBetaald,
  verwijderProject,
} from "@/app/actions/projecten-admin";
import { SubmitButton } from "@/components/submit-button";
import { Uploader, BevestigKnop, OfferteFormulier } from "@/components/admin/project-cockpit";
import { CategorieBadge, StatusBadge, Aftelling, Kaart, VELD } from "@/components/admin/project-ui";
import {
  afgeleid,
  soortVan,
  ticketRef,
  toonOnderwerp,
  type BerichtKern,
  type TicketRij,
  type TicketSoort,
} from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";

export const dynamic = "force-dynamic";

type OfferItem = { label: string; desc?: string; cents: number; kind?: string };
type Offerte = {
  id: string;
  offer_no: string | null;
  status: string;
  amount_cents: number | null;
  valid_until: string | null;
  vat_reverse: boolean | null;
  items: OfferItem[] | null;
  created_at: string;
};
type Factuur = {
  id: string;
  number: string;
  status: string;
  amount_cents: number;
  due_at: string | null;
  paid_at: string | null;
  issued_at: string;
  mollie_payment_id: string | null;
};
type TicketUur = {
  ticket_id: string;
  uren: number;
  invoice_id: string | null;
  naar_project_op: string | null;
};
type UrenTotaal = { open: number; gefactureerd: number; bijProject: number };

const SOORT_KLEUR: Record<TicketSoort, string> = {
  vraag: "border-border text-muted",
  revisie: "border-violet-300 bg-violet-200 text-violet-950",
  machine: "border-teal-300 bg-teal-200 text-teal-950",
  afspraak: "border-blue-300 bg-blue-200 text-blue-950",
  intern: "border-dashed border-border text-muted",
};

const MELDING: Record<string, { ok: boolean; tekst: string }> = {
  aangemaakt: { ok: true, tekst: "Project aangemaakt — de klant heeft portaaltoegang." },
  verwittigd: { ok: true, tekst: "Klant verwittigd: de nieuwe modelbestanden staan klaar in het portaal." },
  "geen-leveringen": { ok: false, tekst: "Er zijn nog geen modelbestanden om te melden." },
  offerte: { ok: true, tekst: "Offerte opgeslagen, gekoppeld en de klant is verwittigd." },
  "offerte-fout": { ok: false, tekst: "Offerte opslaan mislukte." },
  factuur: { ok: true, tekst: "Factuur aangemaakt, gekoppeld en de klant is verwittigd." },
  "factuur-fout": { ok: false, tekst: "Factuur opslaan mislukte." },
  "factuur-bestaat": { ok: false, tekst: "Er is al een lopende factuur voor dit project." },
  "factuur-nul": { ok: false, tekst: "Factuurbedrag is € 0 — vul de uren in." },
  bevestig: { ok: false, tekst: "Typ “verwijder” om het project definitief te verwijderen." },
};

const KNOP = "rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover";
const HOOFDKNOP = "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90";
const uurTekst = (u: number) => `${String(Math.round(u * 100) / 100).replace(".", ",")} u`;

export default async function ProjectCockpit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ melding?: string; mail?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getSupabaseAdmin();
  const { data } = await db.from("projecten").select("*").eq("id", id).maybeSingle();
  const p = data as Project | null;
  if (!p) notFound();

  const [levR, offR, facR, ticR, urenR, klant] = await Promise.all([
    db.from("leveringen").select("*").eq("project_id", id).order("versie", { ascending: false }).order("systeem"),
    p.offer_id
      ? db.from("offers").select("id, offer_no, status, amount_cents, valid_until, vat_reverse, items, created_at").eq("id", p.offer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    p.invoice_id
      ? db.from("invoices").select("id, number, status, amount_cents, due_at, paid_at, issued_at, mollie_payment_id").eq("id", p.invoice_id).maybeSingle()
      : Promise.resolve({ data: null }),
    // Tickets via de projectkoppeling (migratie 0049): blijft kloppen na een nieuwe titel.
    db.from("tickets").select("*").eq("project_id", id).order("updated_at", { ascending: false }).limit(50),
    // Revisie-uren op dit project (tabel bestaat pas na 0049; fout = geen uren tonen).
    db.from("ticket_uren").select("ticket_id, uren, invoice_id, naar_project_op").eq("project_id", id).limit(1000),
    klantGegevens(p.client_email, p.quote_id),
  ]);
  const leveringen = (levR.data as Levering[] | null) ?? [];
  const offerte = offR.data as Offerte | null;
  const factuur = facR.data as Factuur | null;
  const betaald = factuur?.status === "betaald";

  // Zonder 0049 (geen kolom project_id): zoals vroeger op klant + titel in het
  // onderwerp, en 'aan zet' afgeleid uit het laatste bericht.
  const ticketsViaProject = !ticR.error;
  let tickets = (ticR.data as TicketRij[] | null) ?? [];
  let berichten: BerichtKern[] = [];
  if (!ticketsViaProject) {
    const { data: oud } = await db
      .from("tickets")
      .select("*")
      .ilike("client_email", p.client_email)
      .ilike("subject", `%${p.titel.replace(/[%_]/g, " ").slice(0, 120)}%`)
      .order("updated_at", { ascending: false })
      .limit(20);
    tickets = (oud as TicketRij[] | null) ?? [];
    if (tickets.length > 0) {
      const { data: m } = await db
        .from("ticket_messages")
        .select("ticket_id, sender, created_at")
        .in(
          "ticket_id",
          tickets.map((t) => t.id),
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      berichten = (m as BerichtKern[] | null) ?? [];
    }
  }
  const urenPerTicket = new Map<string, UrenTotaal>();
  const urenProject: UrenTotaal = { open: 0, gefactureerd: 0, bijProject: 0 };
  const urenBekend = !urenR.error;
  for (const u of (urenBekend ? (urenR.data as TicketUur[] | null) : null) ?? []) {
    const n = Number(u.uren) || 0;
    const tot = urenPerTicket.get(u.ticket_id) ?? { open: 0, gefactureerd: 0, bijProject: 0 };
    const sleutel: keyof UrenTotaal = u.invoice_id ? "gefactureerd" : u.naar_project_op ? "bijProject" : "open";
    tot[sleutel] += n;
    urenProject[sleutel] += n;
    urenPerTicket.set(u.ticket_id, tot);
  }

  // Tijdelijke downloadlinks (1 uur) voor admin.
  const [planLinks, levLinks] = await Promise.all([
    Promise.all(
      (p.plannen ?? []).map(async (pl) => {
        const { data: s } = await db.storage.from("plannen").createSignedUrl(pl.pad, 3600, { download: pl.naam });
        return s?.signedUrl ?? null;
      }),
    ),
    Promise.all(
      leveringen.map(async (l) => {
        const { data: s } = await db.storage.from("modellen").createSignedUrl(l.pad, 3600, { download: l.naam });
        return [l.id, s?.signedUrl ?? null] as const;
      }),
    ),
  ]);
  const levLink = new Map(levLinks);

  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();
  const dagen = p.leverdatum ? dagenTot(p.leverdatum, nu) : null;
  const maxVersie = leveringen.reduce((m, l) => Math.max(m, l.versie), 0);
  const tarief = UURTARIEF_CENT[p.categorie];
  const gewerkt = p.gewerkte_uren != null ? Number(p.gewerkte_uren) : null;
  const geschat = p.geschatte_uren != null ? Number(p.geschatte_uren) : null;
  const factUren = Math.max(gewerkt ?? geschat ?? 0, MINIMUM_UREN);
  const urenExcl = Math.round(factUren * tarief);
  const extraLijnen = (offerte?.items ?? []).filter((l) => l.kind !== "uren" && l.kind !== "incl" && l.kind !== "sub" && l.cents !== 0);
  const extraCent = extraLijnen.reduce((t, l) => t + l.cents, 0);
  const verlegd = !!offerte?.vat_reverse;
  const metBtw = (c: number) => (verlegd ? c : Math.round(c * 1.21));
  const lat = p.werf?.lat ?? null;
  const lon = p.werf?.lon ?? null;
  const landNaam = new Intl.DisplayNames(["nl"], { type: "region" });
  const melding = sp.melding ? MELDING[sp.melding] : undefined;
  const systemen = [...new Set([...p.merken, ...NEUTRALE_SYSTEMEN])];
  const offerteStd = {
    titel: p.titel,
    uren: Math.max(geschat ?? 0, MINIMUM_UREN),
    categorie: p.categorie,
    taal: klant.taal,
    naam: klant.naam ?? "",
    bedrijf: klant.bedrijf ?? "",
    adres: klant.adres ?? "",
    btw: klant.btw ?? "",
    werf: werfTekst(p.werf) === "—" ? "" : werfTekst(p.werf),
    merken: p.merken,
    stelsel: p.stelsel,
    leverdatum: p.leverdatum,
  };

  return (
    <>
      <Link href="/admin/projecten" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar projecten
      </Link>

      {melding && (
        <p
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            melding.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {melding.tekst}
          {melding.ok && sp.mail === "0" && (
            <span className="block text-amber-700 dark:text-amber-400">
              Let op: de mail is niet vertrokken (geen RESEND_API_KEY of verzendfout) — enkel gelogd.
            </span>
          )}
        </p>
      )}

      {/* Kop */}
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{p.titel}</h1>
          <p className="mt-1 text-sm text-muted">
            <Link href={`/admin/klanten/${encodeURIComponent(p.client_email)}`} className="text-foreground hover:text-accent">
              {klant.bedrijf || klant.naam || p.client_email}
            </Link>
            {(klant.bedrijf || klant.naam) && <span className="font-mono text-[11px]"> · {p.client_email}</span>}
            {klant.telefoon && <span className="font-mono text-[11px]"> · {klant.telefoon}</span>}
            <span className="font-mono text-[11px]"> · {TAAL_NAAM[klant.taal]}</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            aangemaakt {new Date(p.created_at).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })}
            {p.quote_id && (
              <>
                {" · "}
                <Link href={`/admin/aanvragen/${p.quote_id}`} className="hover:text-accent">
                  originele aanvraag
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CategorieBadge c={p.categorie} />
          <StatusBadge s={p.status} />
          <Aftelling datum={p.leverdatum} dagen={dagen} klaar={["geleverd", "afgesloten", "geannuleerd"].includes(p.status)} />
        </div>
      </header>

      {/* Status-stepper */}
      <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STAPPEN.map((st, i) => {
          const huidig = STAPPEN.indexOf(p.status);
          const klaar = p.status !== "geannuleerd" && i <= huidig;
          return (
            <li key={st}>
              <form action={zetStatus.bind(null, p.id, st)}>
                <button
                  className={`w-full rounded-xl border p-3 text-left text-xs transition-colors hover:border-accent ${
                    st === p.status ? "border-accent bg-accent/10" : klaar ? "border-accent/30 bg-accent/5" : "opacity-70"
                  }`}
                  title={`Status op “${STATUS_LABEL[st].nl}” zetten`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${klaar ? "bg-accent text-white" : "border"}`}>
                    {klaar ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                  </span>
                  <span className="mt-2 block font-medium leading-tight">{STATUS_LABEL[st].nl}</span>
                </button>
              </form>
            </li>
          );
        })}
      </ol>
      {p.status === "geannuleerd" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">Dit project is geannuleerd — klik een stap om het te heropenen.</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Leveringen */}
          <Kaart
            titel={`Leveringen — modelbestanden${maxVersie ? ` (v${maxVersie})` : ""}`}
            icoon={Package}
            actie={
              <form action={verwittigKlant}>
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton pendingLabel="Versturen…" className={HOOFDKNOP}>
                  <Send className="h-4 w-4" strokeWidth={2} /> Klant verwittigen
                </SubmitButton>
              </form>
            }
          >
            <Uploader projectId={p.id} soort="levering" systemen={systemen} maxVersie={maxVersie} />
            {!betaald && leveringen.length > 0 && (
              <p className="mt-3 text-xs text-muted">De klant ziet de bestanden, maar kan pas downloaden zodra de projectfactuur betaald is.</p>
            )}
            {leveringen.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nog geen modelbestanden opgeladen.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {perVersie(leveringen).map((v) => (
                  <div key={v.versie}>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Versie {v.versie} · {new Date(v.items[0].created_at).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })}
                    </p>
                    <ul className="divide-y rounded-xl border">
                      {v.items.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">{l.systeem}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {l.naam}
                            {l.opmerking && <span className="block truncate text-xs text-muted">{l.opmerking}</span>}
                          </span>
                          <span className="font-mono text-[11px] text-muted">{grootteTekst(l.grootte)}</span>
                          {levLink.get(l.id) && (
                            <a href={levLink.get(l.id)!} className="rounded-full p-1.5 text-muted hover:bg-card-hover hover:text-foreground" title="Downloaden">
                              <Download className="h-4 w-4" strokeWidth={2} />
                            </a>
                          )}
                          <form action={verwijderLevering}>
                            <input type="hidden" name="id" value={l.id} />
                            <BevestigKnop vraag={`“${l.naam}” verwijderen (ook uit de opslag)?`} className="rounded-full p-1.5 text-red-600 hover:bg-red-500/10">
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </BevestigKnop>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Kaart>

          {/* Offerte & factuur */}
          <Kaart titel="Offerte & factuur" icoon={Receipt}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-4 text-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Offerte</p>
                {offerte ? (
                  <>
                    <p className="mt-1 font-medium">
                      <Link href={`/admin/offertes/${offerte.id}`} className="hover:text-accent">
                        {offerte.offer_no ?? "Offerte"}
                      </Link>{" "}
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">{offerte.status}</span>
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {euro(offerte.amount_cents ?? 0)} excl. · {euro(metBtw(offerte.amount_cents ?? 0))} {verlegd ? "(btw verlegd)" : "incl."}
                    </p>
                    {offerte.valid_until && <p className="font-mono text-xs text-muted">geldig tot {offerte.valid_until}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-muted">Nog geen offerte.</p>
                )}
              </div>
              <div className="rounded-xl border bg-background p-4 text-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Factuur</p>
                {factuur ? (
                  <>
                    <p className="mt-1 font-medium">
                      <Link href={`/admin/facturen/${factuur.id}`} className="hover:text-accent">
                        {factuur.number}
                      </Link>{" "}
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                          betaald ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : factuur.status === "vervallen" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {factuur.status}
                      </span>
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {euro(factuur.amount_cents)} excl. · {euro(metBtw(factuur.amount_cents))} {verlegd ? "(btw verlegd)" : "incl."}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {betaald
                        ? `betaald${factuur.paid_at ? ` op ${new Date(factuur.paid_at).toLocaleDateString("nl-BE")}` : ""}${factuur.mollie_payment_id ? " via Mollie" : ""}`
                        : `te betalen tegen ${factuur.due_at ?? "—"}`}
                    </p>
                    {!betaald && (
                      <form action={markeerBetaald.bind(null, p.id)} className="mt-2">
                        <BevestigKnop vraag="Factuur als betaald markeren (bv. overschrijving ontvangen)? De klant kan daarna downloaden." className={KNOP}>
                          Markeer als betaald
                        </BevestigKnop>
                      </form>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-muted">Nog geen factuur — downloads blijven vergrendeld.</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              {offerte && <p className="mb-2 text-xs text-muted">Een nieuwe offerte vervangt de koppeling met {offerte.offer_no}; de oude blijft bestaan.</p>}
              <OfferteFormulier projectId={p.id} std={offerteStd} />
            </div>

            {(!factuur || factuur.status === "vervallen") && (
              <form action={maakFactuur} className="mt-5 space-y-3 rounded-xl border bg-background p-4">
                <input type="hidden" name="id" value={p.id} />
                <p className="font-medium">Factuur maken</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-muted">
                    Uren (gewerkt, anders geschat)
                    <input name="uren" defaultValue={String(factUren).replace(".", ",")} inputMode="decimal" className={VELD} />
                  </label>
                  <label className="text-xs text-muted">
                    Betaaltermijn
                    <select name="termijn" defaultValue="14" className={VELD}>
                      <option value="14">14 dagen</option>
                      <option value="30">30 dagen</option>
                    </select>
                  </label>
                  <label className="text-xs text-muted">
                    Omschrijving (leeg = automatisch)
                    <input name="omschrijving" maxLength={300} className={VELD} />
                  </label>
                </div>
                {extraLijnen.length > 0 && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="met_extra" value="1" defaultChecked />
                    Extra lijnen uit de offerte meenemen ({extraLijnen.map((l) => `${l.label} ${euro(l.cents)}`).join(", ")})
                  </label>
                )}
                <p className="font-mono text-xs text-muted">
                  {uurTekst(factUren)} × {euro(tarief)} = {euro(urenExcl)}
                  {extraLijnen.length > 0 && ` · met extra lijnen ${euro(Math.max(0, urenExcl + extraCent))}`} excl. btw
                  {verlegd ? " · btw verlegd" : ""}
                </p>
                <SubmitButton pendingLabel="Aanmaken…" className={HOOFDKNOP}>
                  Factuur maken &amp; klant verwittigen
                </SubmitButton>
              </form>
            )}
          </Kaart>

          {/* Plannen */}
          <Kaart titel={`Plannen van de klant (${(p.plannen ?? []).length})`} icoon={FileText}>
            {(p.plannen ?? []).length === 0 ? (
              <p className="mb-4 text-sm text-muted">Geen plannen opgeladen.</p>
            ) : (
              <ul className="mb-4 divide-y rounded-xl border">
                {p.plannen.map((pl, i) => (
                  <li key={pl.pad} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
                    <span className="min-w-0 flex-1 truncate">
                      {pl.naam}
                      {pl.pad.startsWith(`projecten/${p.id}/`) && <span className="ml-2 font-mono text-[10px] text-muted">(door jou)</span>}
                    </span>
                    <span className="font-mono text-[11px] text-muted">{grootteTekst(pl.grootte)}</span>
                    {planLinks[i] && (
                      <a href={planLinks[i]!} className="rounded-full p-1.5 text-muted hover:bg-card-hover hover:text-foreground" title="Downloaden">
                        <Download className="h-4 w-4" strokeWidth={2} />
                      </a>
                    )}
                    <form action={verwijderPlan.bind(null, p.id, pl.pad)}>
                      <BevestigKnop vraag={`“${pl.naam}” uit het project halen?`} className="rounded-full p-1.5 text-red-600 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </BevestigKnop>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <Uploader projectId={p.id} soort="plan" />
          </Kaart>

          {/* Revisies / tickets */}
          <Kaart
            titel="Revisies & vragen"
            icoon={MessageSquareWarning}
            actie={
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/tickets/nieuw?project=${p.id}`} className={`${KNOP} inline-flex items-center gap-1`}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  Nieuw ticket
                </Link>
                <Link href={`/admin/tickets?project=${p.id}&weergave=alle`} className={KNOP}>
                  Alle tickets
                </Link>
              </div>
            }
          >
            {tickets.length === 0 ? (
              <p className="text-sm text-muted">
                {ticketsViaProject ? "Nog geen tickets gekoppeld aan dit project." : "Geen tickets van deze klant over dit project."}
              </p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {tickets.map((t) => {
                  const a = afgeleid(t, berichten);
                  const soort = soortVan(t);
                  const status = a.gesloten
                    ? { label: "Gesloten", cls: "border text-muted" }
                    : a.wachtOp === "studio"
                      ? { label: "Aan mij", cls: "bg-accent text-background" }
                      : { label: "Wacht op klant", cls: "bg-sky-200 text-sky-950" };
                  const u = urenPerTicket.get(t.id);
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm transition-colors hover:bg-card-hover"
                      >
                        <span className="font-mono text-[11px] text-muted">{ticketRef(t)}</span>
                        <span className={`min-w-[8rem] flex-1 truncate ${a.studioOngelezen ? "font-semibold" : ""}`}>
                          {toonOnderwerp(t) || t.subject}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${SOORT_KLEUR[soort]}`}>{SOORT_LABEL[soort].nl}</span>
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>{status.label}</span>
                        {u && (u.open > 0 || u.gefactureerd > 0 || u.bijProject > 0) && (
                          <span className="basis-full font-mono text-[11px] text-muted">
                            {[
                              u.open > 0 ? `open ${uurTekst(u.open)}` : null,
                              u.gefactureerd > 0 ? `gefactureerd ${uurTekst(u.gefactureerd)}` : null,
                              u.bijProject > 0 ? `bij projecturen ${uurTekst(u.bijProject)}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {urenBekend && (urenProject.open > 0 || urenProject.gefactureerd > 0 || urenProject.bijProject > 0) && (
              <p className="mt-3 font-mono text-xs text-muted">
                Revisie-uren: open {uurTekst(urenProject.open)} · gefactureerd {uurTekst(urenProject.gefactureerd)}
                {urenProject.bijProject > 0 && ` · bij projecturen ${uurTekst(urenProject.bijProject)}`}
              </p>
            )}
            {!ticketsViaProject && (
              <p className="mt-3 text-[11px] text-muted">
                Basisstand (migratie 0049 nog niet gedraaid): gevonden op klant en projecttitel in het onderwerp.
              </p>
            )}
          </Kaart>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Werf */}
          <Kaart titel="Werf" icoon={MapPin}>
            <p className="text-sm">{werfTekst(p.werf)}</p>
            {lat != null && lon != null ? (
              <>
                <iframe
                  title="Kaart van de werf"
                  className="mt-3 h-56 w-full rounded-xl border"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.006}%2C${lat - 0.004}%2C${lon + 0.006}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lon}`}
                />
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                    Google Maps <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    OpenStreetMap <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                  <span className="font-mono text-muted">
                    {lat.toFixed(5)}, {lon.toFixed(5)}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-amber-600">Adres niet gevonden op de kaart.</p>
            )}
            {p.stelsel && (
              <div className="mt-4 rounded-xl border bg-background p-3 text-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Stelsel &amp; hoogte</p>
                <p className="mt-1 font-medium">{p.stelsel.stelsel}</p>
                <p className="font-mono text-xs text-accent">{p.stelsel.epsg}</p>
                <p className="mt-1 text-xs">Hoogte: {p.stelsel.hoogte}</p>
                {p.stelsel.opmerking && <p className="mt-1 text-xs text-muted">{p.stelsel.opmerking}</p>}
              </div>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted hover:text-foreground">Werf of stelsel aanpassen</summary>
              <form action={bewaarWerf} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="werf_straat" defaultValue={p.werf?.straat ?? ""} placeholder="Straat + nr." className={VELD} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="werf_postcode" defaultValue={p.werf?.postcode ?? ""} placeholder="Postcode" className={VELD} />
                  <input name="werf_gemeente" defaultValue={p.werf?.gemeente ?? ""} placeholder="Gemeente" className={VELD} />
                </div>
                <select name="werf_land" defaultValue={p.werf?.land ?? "BE"} className={VELD}>
                  {LANDEN.map((c) => (
                    <option key={c} value={c}>
                      {landNaam.of(c)} ({c})
                    </option>
                  ))}
                </select>
                <input name="stelsel" defaultValue={p.stelsel?.stelsel ?? ""} placeholder="Stelsel" className={VELD} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="epsg" defaultValue={p.stelsel?.epsg ?? ""} placeholder="EPSG:…" className={VELD} />
                  <input name="hoogte" defaultValue={p.stelsel?.hoogte ?? ""} placeholder="Hoogtereferentie" className={VELD} />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="stelsel_opnieuw" value="1" /> Stelsel opnieuw voorstellen uit land + kaartpositie
                </label>
                <SubmitButton className={KNOP}>Werf bewaren</SubmitButton>
              </form>
            </details>
          </Kaart>

          {/* Uren */}
          <Kaart titel="Uren" icoon={Clock}>
            <form action={bewaarUren} className="grid grid-cols-2 gap-3">
              <input type="hidden" name="id" value={p.id} />
              <label className="text-xs text-muted">
                Geschat
                <input name="geschatte_uren" defaultValue={geschat != null ? String(geschat).replace(".", ",") : ""} inputMode="decimal" className={VELD} />
              </label>
              <label className="text-xs text-muted">
                Gewerkt
                <input name="gewerkte_uren" defaultValue={gewerkt != null ? String(gewerkt).replace(".", ",") : ""} inputMode="decimal" className={VELD} />
              </label>
              <div className="col-span-2">
                <SubmitButton className={KNOP}>Uren bewaren</SubmitButton>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Gewerkt bijtellen:</span>
              {[0.25, 0.5, 1].map((d) => (
                <form key={d} action={telUren.bind(null, p.id, d)}>
                  <SubmitButton className={KNOP}>+{String(d).replace(".", ",")} u</SubmitButton>
                </form>
              ))}
              <form action={telUren.bind(null, p.id, -0.25)}>
                <SubmitButton className={`${KNOP} text-muted`}>−0,25</SubmitButton>
              </form>
            </div>
            <div className="mt-4 space-y-1 rounded-xl border bg-background p-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>
                  {uurTekst(factUren)} × {euro(tarief)} ({CATEGORIE_LABEL[p.categorie].nl})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Excl. btw</span>
                <span className="font-mono">{euro(urenExcl)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Incl. 21% btw</span>
                <span className="font-mono">{euro(Math.round(urenExcl * 1.21))}</span>
              </div>
              <p className="pt-1 text-[11px] text-muted">
                Basis: {gewerkt != null ? "gewerkte" : "geschatte"} uren, minimum {MINIMUM_UREN} u.
              </p>
            </div>
          </Kaart>

          {/* Gegevens */}
          <Kaart titel="Projectgegevens" icoon={Settings2}>
            <form action={bewaarGegevens} className="space-y-3">
              <input type="hidden" name="id" value={p.id} />
              <label className="block text-xs text-muted">
                Titel
                <input name="titel" defaultValue={p.titel} maxLength={140} className={VELD} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted">
                  Categorie
                  <select name="categorie" defaultValue={p.categorie} className={VELD}>
                    {(["vroegtijdig", "normaal", "last-minute"] as const).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORIE_LABEL[c].nl}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-muted">
                  Leverdatum
                  <input name="leverdatum" type="date" defaultValue={p.leverdatum ?? ""} className={VELD} />
                </label>
              </div>
              <div>
                <p className="text-xs text-muted">Machinesturing</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[...new Set([...MERKEN, ...p.merken])].map((m) => (
                    <label
                      key={m}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs has-[:checked]:border-accent has-[:checked]:bg-accent/10"
                    >
                      <input type="checkbox" name="merken" value={m} defaultChecked={p.merken.includes(m)} />
                      {m}
                    </label>
                  ))}
                </div>
                <input name="merk_extra" placeholder="Ander systeem toevoegen" maxLength={80} className={VELD} />
              </div>
              <SubmitButton className={KNOP}>Gegevens bewaren</SubmitButton>
            </form>
          </Kaart>

          {/* Notitie */}
          <Kaart titel="Omschrijving & notitie" icoon={NotebookPen}>
            <form action={bewaarNotitie} className="space-y-2">
              <input type="hidden" name="id" value={p.id} />
              <textarea name="opmerking" rows={6} defaultValue={p.opmerking ?? ""} className={VELD} />
              <p className="text-[11px] text-muted">Bij een aanvraag staat hier de omschrijving van de klant. Het portaal toont dit veld niet, maar het hoort bij het project van de klant: zet hier niets vertrouwelijks.</p>
              <SubmitButton className={KNOP}>Notitie bewaren</SubmitButton>
            </form>
          </Kaart>

          {/* Gevarenzone */}
          <Kaart titel="Gevarenzone" icoon={TriangleAlert} className="border border-red-500/30">
            {p.status !== "geannuleerd" ? (
              <form action={zetStatus.bind(null, p.id, "geannuleerd")}>
                <BevestigKnop vraag="Project annuleren? Het verdwijnt uit de actieve lijsten (data blijft bewaard)." className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400">
                  Project annuleren
                </BevestigKnop>
              </form>
            ) : (
              <form action={zetStatus.bind(null, p.id, "aanvraag")}>
                <SubmitButton className={KNOP}>Heropenen (status aanvraag)</SubmitButton>
              </form>
            )}
            <form action={verwijderProject} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={p.id} />
              <label className="block text-xs text-muted">
                Definitief verwijderen — project, leveringen en hun bestanden. Offertes en facturen blijven bestaan. Typ <strong>verwijder</strong>:
                <input name="bevestig" autoComplete="off" className={VELD} />
              </label>
              <BevestigKnop vraag="Dit project en alle modelbestanden definitief verwijderen?" className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                Definitief verwijderen
              </BevestigKnop>
            </form>
          </Kaart>
        </div>
      </div>
    </>
  );
}
